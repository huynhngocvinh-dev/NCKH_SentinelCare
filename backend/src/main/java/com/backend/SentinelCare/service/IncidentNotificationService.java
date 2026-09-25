package com.backend.SentinelCare.service;

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
    private final EmergencyContactRepository contactRepository;
    private final FallIncidentRepository incidentRepository;

    /**
     * Bắn thông báo tức thì lên WebApp và gửi Email kèm Audio TTS
     */
    public void dispatchImmediateNotifications(FallIncident incident, String alertText) {
        // 1. Tạo Payload đầy đủ thông tin cho cả Camera AI và IoT Band
        Map<String, Object> wsData = new HashMap<>();
        wsData.put("id", incident.getId());
        wsData.put("status", incident.getStatus() != null ? incident.getStatus().name() : "PENDING");
        wsData.put("snapshotUrl", incident.getSnapshotUrl() != null ? incident.getSnapshotUrl() : "");
        wsData.put("confidenceScore", incident.getConfidenceScore() != null ? incident.getConfidenceScore() : 0.95);
        wsData.put("incidentTime", incident.getIncidentTime() != null ? incident.getIncidentTime().toString() : "");
    
        // Tên bệnh nhân (dành cho IoT Band hoặc Camera có định danh)
        String patientName = (incident.getPatient() != null) 
                ? incident.getPatient().getFullName() 
                : "Chưa định danh (Camera AI)";
        wsData.put("patientName", patientName);
    
        //  Vị trí / Tọa độ GPS từ IoT Band
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
    
        // 2. Gửi Email kèm Audio TTS từ Google AI Studio & Nút bấm xác nhận
        sendEmailWithAiVoice(alertText, incident.getId());
    }
    /**
     * Đếm ngược 60s đòn bẩy kích hoạt Cuộc gọi GSM
     */
    @Async
    public void trigger60sCallEscalationTimer(Long incidentId, String alertText) {
        try {
            Thread.sleep(60000); // Đếm ngược 60 giây
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        Optional<FallIncident> incidentOpt = incidentRepository.findById(incidentId);
        if (incidentOpt.isPresent()) {
            FallIncident incident = incidentOpt.get();

            if (incident.getStatus() != FallIncident.IncidentStatus.ACKNOWLEDGED
                    && incident.getStatus() != FallIncident.IncidentStatus.CANCELLED_BY_USER) {

                log.warn("📞 [TIMEOUT 60S] Lập tức kích hoạt Cuộc gọi GSM qua Stringee!");
                List<EmergencyContact> contacts = contactRepository.findAll();
                voipCallService.triggerEscalationCallWorkflow(contacts, alertText);
            } else {
                log.info("✅ [DISARMED] Người thân đã bấm xác nhận trong 60s. HỦY CUỘC GỌI GSM!");
            }
        }
    }

    //  Nhận thêm tham số Long incidentId
    private void sendEmailWithAiVoice(String alertText, Long incidentId) {
        try {
            byte[] audioBytes = ttsService.generateVoiceAudio(alertText);
            List<EmergencyContact> contacts = contactRepository.findAll();

            for (EmergencyContact contact : contacts) {
                if (contact.getEmail() != null) {
                    // Truyền incidentId xuống EmailService
                    emailService.sendEmergencyAlertEmail(contact.getEmail(), alertText, audioBytes, incidentId);
                }
            }
        } catch (Exception e) {
            log.error("Lỗi gửi Email TTS: ", e);
        }
    }
}