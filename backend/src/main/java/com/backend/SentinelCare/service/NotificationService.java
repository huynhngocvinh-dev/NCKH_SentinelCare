package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.FallIncident;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Bắn dữ liệu thông báo thật qua WebSocket tới chuông trên Web Frontend
     */
    public void sendInAppNotification(FallIncident incident, String title, String message) {
        log.info("🔔 [WEB NOTIFICATIONL] Đang bắn thông báo sự cố ID {} lên Web", incident.getId());
        
        Map<String, Object> payload = Map.of(
            "incidentId", incident.getId(),
            "title", title,
            "message", message,
            "incidentTime", incident.getIncidentTime() != null ? incident.getIncidentTime().toString() : "",
            "snapshotUrl", incident.getSnapshotUrl() != null ? incident.getSnapshotUrl() : ""
        );

        // Đẩy tin nhắn qua Kênh WebSocket /topic/incidents
        messagingTemplate.convertAndSend("/topic/incidents", payload);
    }
}