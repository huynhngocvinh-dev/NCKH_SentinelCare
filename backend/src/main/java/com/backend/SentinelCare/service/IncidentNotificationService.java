package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.Account;
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
        wsData.put("confidenceScore", incident.getConfidenceScore() != null ? incident.getConfidenceScore() : 0.95);
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

        // Bắn dữ liệu xuống WebApp qua WebSocket
        messagingTemplate.convertAndSend("/topic/incidents", wsData);
        log.info("[WEBSOCKET] da gui thong bao su co len ID {} len WebApp", incident.getId());

        // Lấy Account và danh sách EmergencyContact đúng theo Bệnh nhân
        Account account = extractAccountFromIncident(incident);
        Long accountId = account != null ? account.getId() : null;

        List<EmergencyContact> contacts = (incident.getPatient() != null)
                ? contactRepository.findByPatientId(incident.getPatient().getId())
                : contactRepository.findAll();

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
     * Đếm ngược 5s kích hoạt Cuộc gọi GSM (Chỉ gọi nếu gói hỗ trợ CALL_ALERT và chưa bấm ACKNOWLEDGED)
     */
    @Async
    public void trigger5sCallEscalationTimer(Long incidentId, String alertText) {
        try {
            log.info(" [TIMER 5S] bat dau dem nguoc 5s don bay kich hoat cuoc goi cho su co ID {}", incidentId);
            Thread.sleep(5000); // Đếm ngược 5 giây
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        Optional<FallIncident> incidentOpt = incidentRepository.findById(incidentId);
        if (incidentOpt.isPresent()) {
            FallIncident incident = incidentOpt.get();

            // Kiểm tra trạng thái sự cố: Nếu chưa ACKNOWLEDGED và chưa bị CANCELLED_BY_USER
            if (incident.getStatus() != FallIncident.IncidentStatus.ACKNOWLEDGED
                    && incident.getStatus() != FallIncident.IncidentStatus.CANCELLED_BY_USER) {

                Account account = extractAccountFromIncident(incident);
                Long accountId = account != null ? account.getId() : null;

                // Kiểm tra gói dịch vụ có tính năng gọi GSM (CALL_ALERT) hay không
                if (accountId != null && subscriptionService.hasFeatureAccess(accountId, "CALL_ALERT")) {
                    log.warn(" [TIMEOUT 5S] lap tuc kich hoat cuoc goi xoay vong qua Stringee!");

                    List<EmergencyContact> contacts = (incident.getPatient() != null)
                            ? contactRepository.findByPatientId(incident.getPatient().getId())
                            : contactRepository.findAll();

                    voipCallService.triggerEscalationCallWorkflow(incident.getId(), contacts, alertText);
                } else {
                    updateCallStatus(incidentId, FallIncident.CallEscalationStatus.CALL_NOT_STARTED);
                    log.info("[TIMEOUT 5S] het 5s nhung tai khoan ID {} su dung goi FREEMIUM (khong ho tro cuoc goi GSM).", accountId);
                }
            } else {
                updateCallStatus(incidentId, FallIncident.CallEscalationStatus.ESCALATION_STOPPED);
                log.info(" [DISARMED] su co ID {} da duoc xac nhan/huy trong vong 5s. huy cuoc goi GSM!", incidentId);
            }
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

    private void updateCallStatus(Long incidentId, FallIncident.CallEscalationStatus status) {
        incidentRepository.findById(incidentId).ifPresent(inc -> {
            inc.setCallEscalationStatus(status);
            incidentRepository.save(inc);
        });
    }

    private Account extractAccountFromIncident(FallIncident incident) {
        if (incident.getPatient() != null && incident.getPatient().getAccount() != null) {
            return incident.getPatient().getAccount();
        }
        return null;
    }
}