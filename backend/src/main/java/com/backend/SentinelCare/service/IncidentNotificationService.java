package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.model.CameraDevice;
import com.backend.SentinelCare.model.EmergencyContact;
import com.backend.SentinelCare.model.FallIncident;
import com.backend.SentinelCare.repository.EmergencyContactRepository;
import com.backend.SentinelCare.repository.FallIncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class IncidentNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final TtsService ttsService;
    private final VoipCallService voipCallService;
    private final SubscriptionService subscriptionService;
    private final EmergencyContactRepository contactRepository;
    private final FallIncidentRepository incidentRepository;
    private final IncidentTimerService timerService;

    /**
     * Bắn thông báo tức thì lên WebApp và gửi Email kèm Audio TTS cho đúng danh sách người thân
     */
    public void dispatchImmediateNotifications(FallIncident incident, String alertText) {
        // 1. Tạo Payload WebSocket đầy đủ thông tin
        Map<String, Object> wsData = new HashMap<>();
        wsData.put("id", incident.getId());
        wsData.put("status", incident.getStatus() != null ? incident.getStatus().name() : "PENDING");
        wsData.put("callEscalationStatus", incident.getCallEscalationStatus() != null ? incident.getCallEscalationStatus().name() : "CALL_NOT_STARTED");
        wsData.put("snapshotUrl", incident.getSnapshotUrl() != null ? incident.getSnapshotUrl() : "");
        wsData.put("confidenceScore", incident.getConfidenceScore());
        wsData.put("incidentTime", incident.getIncidentTime() != null ? incident.getIncidentTime().toString() : "");

        // Tên bệnh nhân (dành cho IoT Band hoặc Camera có định danh)
        String patientName = (incident.getPatient() != null) 
                ? incident.getPatient().getFullName() 
                : "Chưa định danh (Camera AI)";
        wsData.put("patientName", patientName);

        // Vị trí / Tọa độ GPS từ IoT Band hoặc Camera
        String location = "Chưa rõ vị trí";
        if (incident.getLatitude() != null && incident.getLongitude() != null) {
            location = String.format("GPS: %.5f, %.5f", incident.getLatitude(), incident.getLongitude());
        } else if (incident.getCameraDevice() != null) {
            location = "Vị trí: " + incident.getCameraDevice().getLocationName();
        }
        wsData.put("location", location);
        wsData.put("latitude", incident.getLatitude());
        wsData.put("longitude", incident.getLongitude());

        // Nguồn phát hiện sự cố
        String source = "Dung hợp AI & IoT";
        if (incident.getIotDevice() != null && incident.getCameraDevice() == null) {
            source = "Vòng đeo IoT (" + incident.getIotDevice().getDeviceSerial() + ")";
        } else if (incident.getCameraDevice() != null && incident.getIotDevice() == null) {
            source = "Camera AI (" + incident.getCameraDevice().getLocationName() + ")";
        }
        wsData.put("source", source);

        
        // Lấy Account và danh sách EmergencyContact
        Account account = extractAccountFromIncident(incident);
        Long accountId = account != null ? account.getId() : null;

        // Bắn dữ liệu xuống WebApp CHỈ cho chủ tài khoản (kênh riêng /user/queue/incidents)
        if (account != null) {
            messagingTemplate.convertAndSendToUser(account.getEmail(), "/queue/incidents", wsData);
            log.info("[WEBSOCKET] da gui thong bao su co ID {} cho tai khoan ID {}", incident.getId(), account.getId());
        } else {
            log.warn("[WEBSOCKET] su co ID {} khong xac dinh duoc tai khoan chu, khong gui len WebApp.", incident.getId());
        }

        List<EmergencyContact> contacts = loadContacts(accountId);

        // 2. Gửi Email kèm Audio TTS nếu tài khoản sở hữu Feature ALERT_EMAIL
        if (accountId != null && subscriptionService.hasFeatureAccess(accountId, "ALERT_EMAIL")) {
            sendEmailWithAiVoice(contacts, alertText, incident.getId());
        } else {
            log.info("tai khaon ID {} dung goi khong ho tro canh bao Email.", accountId);
        }

        // 3. Kích hoạt đếm ngược 5 giây đòn bẩy trước khi gọi điện GSM
        trigger5sCallEscalationTimer(incident.getId(), alertText);
    }

        /**
     * Đếm ngược 5s rồi mới kích hoạt cuộc gọi GSM (không chặn luồng gọi)
     */
        private void trigger5sCallEscalationTimer(Long incidentId, String alertText) {
            log.info(" [TIMER 5S] bat dau dem nguoc 5s don bay kich hoat cuoc goi cho su co ID {}", incidentId);
            timerService.runAfter(5, "CALL-5s-" + incidentId, () -> handleCallEscalation(incidentId, alertText));
        }
    
        private void handleCallEscalation(Long incidentId, String alertText) {
            FallIncident incident = incidentRepository.findById(incidentId).orElse(null);
            if (incident == null) return;
    
            // Đã xác nhận hoặc đã hủy trong 5s -> không gọi điện
            if (incident.getStatus() == FallIncident.IncidentStatus.ACKNOWLEDGED
                    || incident.getStatus() == FallIncident.IncidentStatus.CANCELLED_BY_USER) {
                incident.setCallEscalationStatus(FallIncident.CallEscalationStatus.ESCALATION_STOPPED);
                incidentRepository.save(incident);
                log.info(" [DISARMED] su co ID {} da duoc xac nhan/huy trong vong 5s. huy cuoc goi GSM!", incidentId);
                return;
            }
    
            Account account = extractAccountFromIncident(incident);
            Long accountId = account != null ? account.getId() : null;
    
            if (accountId != null && subscriptionService.hasFeatureAccess(accountId, "CALL_ALERT")) {
                log.warn(" [TIMEOUT 5S] lap tuc kich hoat cuoc goi xoay vong qua Stringee!");
                voipCallService.triggerEscalationCallWorkflow(
                        incident.getId(), loadContacts(accountId), alertText);
            } else {
                incident.setCallEscalationStatus(FallIncident.CallEscalationStatus.CALL_NOT_STARTED);
                incidentRepository.save(incident);
                log.info("[TIMEOUT 5S] tai khoan ID {} khong ho tro cuoc goi GSM hoac khong xac dinh duoc chu.", accountId);
            }
        }

    private void sendEmailWithAiVoice(List<EmergencyContact> contacts, String alertText, Long incidentId) {
        try {
            byte[] audioBytes = ttsService.generateVoiceAudio(alertText);

            for (EmergencyContact contact : contacts) {
                if (contact.getEmail() != null && !contact.getEmail().isBlank()) {
                    emailService.sendEmergencyAlertEmail(contact.getEmail(), alertText, audioBytes, incidentId);
                }
            }
        } catch (Exception e) {
            log.error("loi gui Email TTS cho su co ID {}: ", incidentId, e);
        }
    }


    private Account extractAccountFromIncident(FallIncident incident) {
        // 1. Luồng IoT Device: Lấy Account chính chủ qua MonitoredSubject (Patient)
        if (incident.getPatient() != null && incident.getPatient().getAccount() != null) {
            return incident.getPatient().getAccount();
        }
    
        // 2. Luồng Camera AI: Lấy Account chính chủ sở hữu vị trí/địa chỉ đặt Camera
        if (incident.getCameraDevice() != null) { 
            CameraDevice camera = incident.getCameraDevice();
            if (camera.getAddress() != null && camera.getAddress().getAccount() != null) {
                return camera.getAddress().getAccount();
            }
        }
    
        return null;
    }

    // Chỉ lấy người thân của đúng tài khoản chủ, đã xếp theo mức ưu tiên
    private List<EmergencyContact> loadContacts(Long accountId) {
        if (accountId == null) {
            log.warn("Không xác định được tài khoản chủ của sự cố, không gửi cảnh báo cho ai.");
            return List.of();
        }
        return contactRepository.findByAccountIdOrderByPriorityOrderAsc(accountId);
    }
}