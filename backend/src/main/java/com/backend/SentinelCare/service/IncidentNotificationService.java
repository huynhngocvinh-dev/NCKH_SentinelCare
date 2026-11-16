package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.model.CameraDevice;
import com.backend.SentinelCare.model.EmergencyContact;
import com.backend.SentinelCare.model.FallIncident;
import com.backend.SentinelCare.repository.EmergencyContactRepository;
import com.backend.SentinelCare.util.FeatureCodes;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class IncidentNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final EmergencyVoiceCallService voiceCallService;
    private final SubscriptionService subscriptionService;
    private final EmergencyContactRepository contactRepository;

    /**
     * Chạy SAU KHI transaction tạo sự cố đã commit (xem
     * IncidentEngineService.runAfterCommit).
     * Không được ghi DB trong hàm này, vì lúc đó transaction cũ đã đóng nên thay
     * đổi sẽ không được lưu.
     * emailText: văn bản để đọc. voiceText: văn bản để TTS đọc to.
     */
    public void dispatchImmediateNotifications(FallIncident incident, String emailText, String voiceText) {
        Account account = extractAccountFromIncident(incident);
        if (account == null) {
            log.warn("Su co ID {} khong xac dinh duoc tai khoan chu, khong gui canh bao cho ai.", incident.getId());
            return;
        }
        Long accountId = account.getId();

        // 1. WebApp: chỉ chủ tài khoản
        messagingTemplate.convertAndSendToUser(account.getEmail(), "/queue/incidents", buildWsPayload(incident));
        log.info("[WEBSOCKET] Da gui su co ID {} cho tai khoan ID {}", incident.getId(), accountId);

        List<EmergencyContact> contacts = contactRepository.findByAccountIdOrderByPriorityOrderAsc(accountId);

        // 2. Email cho người thân: gói có ALERT_EMAIL
        if (subscriptionService.hasFeatureAccess(accountId, FeatureCodes.ALERT_EMAIL)) {
            contacts.stream()
                    .map(EmergencyContact::getEmail)
                    .filter(email -> email != null && !email.isBlank())
                    .distinct()
                    .forEach(email -> emailService.sendEmergencyAlertEmail(email, emailText, incident.getId()));
        }

        // 3. Gọi điện NGAY (Pro/Premium). Người dùng bấm xác nhận sau đó không dừng
        // vòng gọi.
        if (subscriptionService.hasFeatureAccess(accountId, FeatureCodes.CALL_ALERT)) {
            voiceCallService.triggerEscalationCallWorkflow(incident.getId(), contacts, voiceText);
        } else {
            log.info("Tai khoan ID {} dung goi khong ho tro goi dien, chi gui Email/WebApp.", accountId);
        }
    }

    private Map<String, Object> buildWsPayload(FallIncident incident) {
        Map<String, Object> ws = new HashMap<>();
        ws.put("id", incident.getId());
        ws.put("status", incident.getStatus() != null ? incident.getStatus().name() : "PENDING");
        ws.put("callEscalationStatus", incident.getCallEscalationStatus() != null
                ? incident.getCallEscalationStatus().name()
                : "CALL_NOT_STARTED");
        ws.put("snapshotUrl", incident.getSnapshotUrl() != null ? incident.getSnapshotUrl() : "");
        ws.put("confidenceScore", incident.getConfidenceScore());
        ws.put("incidentTime", incident.getIncidentTime() != null ? incident.getIncidentTime().toString() : "");
        ws.put("type", "NEW_INCIDENT");
        ws.put("patientName", incident.getPatient() != null
                ? incident.getPatient().getFullName()
                : "Chưa định danh (Camera AI)");
        String location = "Chưa rõ vị trí";
        if (incident.getLatitude() != null && incident.getLongitude() != null) {
            location = String.format("GPS: %.5f, %.5f", incident.getLatitude(), incident.getLongitude());
        } else if (incident.getCameraDevice() != null) {
            location = "Vị trí: " + incident.getCameraDevice().getLocationName();
        }
        ws.put("location", location);
        ws.put("latitude", incident.getLatitude());
        ws.put("longitude", incident.getLongitude());

        String source = "Dung hợp AI & IoT";
        if (incident.getIotDevice() != null && incident.getCameraDevice() == null) {
            source = "Vòng đeo IoT (" + incident.getIotDevice().getDeviceSerial() + ")";
        } else if (incident.getCameraDevice() != null && incident.getIotDevice() == null) {
            source = "Camera AI (" + incident.getCameraDevice().getLocationName() + ")";
        }
        ws.put("source", source);
        return ws;
    }

    /**
     * Bao cho WebApp biet trang thai su co vua doi (vi du da xac nhan qua email) de
     * dong modal.
     */
    public void publishStatusUpdate(FallIncident incident) {
        Account account = extractAccountFromIncident(incident);
        if (account == null)
            return;

        Map<String, Object> ws = new HashMap<>();
        ws.put("type", "STATUS_UPDATE");
        ws.put("id", incident.getId());
        ws.put("status", incident.getStatus().name());
        messagingTemplate.convertAndSendToUser(account.getEmail(), "/queue/incidents", ws);
        log.info("[WEBSOCKET] Da gui cap nhat trang thai su co ID {}: {}", incident.getId(), incident.getStatus());
    }

    private Account extractAccountFromIncident(FallIncident incident) {
        if (incident.getPatient() != null && incident.getPatient().getAccount() != null) {
            return incident.getPatient().getAccount();
        }
        CameraDevice camera = incident.getCameraDevice();
        if (camera != null && camera.getAddress() != null && camera.getAddress().getAccount() != null) {
            return camera.getAddress().getAccount();
        }
        return null;
    }
}