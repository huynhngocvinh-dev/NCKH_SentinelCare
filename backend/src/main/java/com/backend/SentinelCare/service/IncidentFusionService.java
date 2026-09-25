package com.backend.SentinelCare.service;

import com.backend.SentinelCare.dto.CameraWebhookRequest;
import com.backend.SentinelCare.dto.IotEventRequest;
import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.repository.FallIncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class IncidentFusionService {

    private final FallIncidentRepository incidentRepository;

    /**
     * Dung hợp sự cố Camera vào sự cố IoT sẵn có (nếu xảy ra trong vòng 5s)
     */
    public FallIncident fuseCameraEvent(CameraDevice camera, CameraWebhookRequest request) {
        LocalDateTime thresholdTime = LocalDateTime.now().minusSeconds(5);
        Optional<FallIncident> recentIncidentOpt = incidentRepository
                .findFirstByIncidentTimeAfterAndStatusOrderByIncidentTimeDesc(thresholdTime, FallIncident.IncidentStatus.PENDING);

        Float confidence = (request.getPerson() != null && request.getPerson().getBodyAngle() != null)
                ? (float) (request.getPerson().getBodyAngle() / 90.0)
                : 0.95f;

        if (recentIncidentOpt.isPresent()) {
            FallIncident incident = recentIncidentOpt.get();
            incident.setCameraDevice(camera);
            incident.setSnapshotUrl(request.getSnapshotBase64());
            incident.setConfidenceScore(confidence);
            log.info("🔀 [FUSION] Gộp sự cố Camera ({}) vào Sự cố IoT (ID: {}) đang chờ!", camera.getCameraCode(), incident.getId());
            return incident;
        }

        return FallIncident.builder()
                .cameraDevice(camera)
                .confidenceScore(confidence)
                .snapshotUrl(request.getSnapshotBase64())
                .incidentTime(LocalDateTime.now())
                .status(FallIncident.IncidentStatus.PENDING)
                .build();
    }

    /**
     * Dung hợp sự cố IoT vào sự cố Camera sẵn có (nếu xảy ra trong vòng 5s)
     */
    public FallIncident fuseIotEvent(IotDevice device, MonitoredSubject patient, IotEventRequest request) {
        LocalDateTime thresholdTime = LocalDateTime.now().minusSeconds(5);
        Optional<FallIncident> recentIncidentOpt = incidentRepository
                .findFirstByIncidentTimeAfterAndStatusOrderByIncidentTimeDesc(thresholdTime, FallIncident.IncidentStatus.PENDING);

        if (recentIncidentOpt.isPresent()) {
            FallIncident incident = recentIncidentOpt.get();
            incident.setIotDevice(device);
            incident.setPatient(patient);
            incident.setLatitude(request.getLatitude());
            incident.setLongitude(request.getLongitude());
            log.info("🔀 [FUSION] Gộp sự cố IoT ({}) vào Sự cố Camera (ID: {}) đang chờ!", device.getDeviceSerial(), incident.getId());
            return incident;
        }

        return FallIncident.builder()
                .iotDevice(device)
                .patient(patient)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .incidentTime(LocalDateTime.now())
                .status(FallIncident.IncidentStatus.PENDING)
                .build();
    }

    /**
     * Soạn thảo văn bản thông báo gộp linh hoạt theo nguồn dữ liệu
     */
    public String buildCompositeAlertText(FallIncident incident) {
        StringBuilder sb = new StringBuilder("Cảnh báo khẩn cấp từ SentinelCare! ");

        boolean hasIot = incident.getIotDevice() != null;
        boolean hasCam = incident.getCameraDevice() != null;

        String timeStr = incident.getIncidentTime() != null
                ? incident.getIncidentTime().format(DateTimeFormatter.ofPattern("HH:mm:ss 'ngày' dd/MM/yyyy"))
                : "vừa xong";

        if (hasIot && hasCam) {
            String patientName = incident.getPatient() != null ? incident.getPatient().getFullName() : "Người giám sát";
            String gps = (incident.getLatitude() != null) ? String.format("tại tọa độ (%.4f, %.4f)", incident.getLatitude(), incident.getLongitude()) : "";
            String camLocation = incident.getCameraDevice() != null ? incident.getCameraDevice().getLocationName() : "Khu vực giám sát";

            sb.append(String.format("Phát hiện %s té ngã %s từ thiết bị đeo, ĐỒNG THỜI Camera ghi nhận té ngã tại %s vào lúc %s.",
                    patientName, gps, camLocation, timeStr));
        } else if (hasIot) {
            String patientName = incident.getPatient() != null ? incident.getPatient().getFullName() : "Người thân";
            String gps = (incident.getLatitude() != null) ? String.format("tại vị trí GPS (%.4f, %.4f)", incident.getLatitude(), incident.getLongitude()) : "ở nhà";
            sb.append(String.format("Phát hiện %s bị ngã %s vào lúc %s.", patientName, gps, timeStr));
        } else if (hasCam) {
            String camLocation = incident.getCameraDevice() != null ? incident.getCameraDevice().getLocationName() : "Phòng khách";
            sb.append(String.format("Camera AI phát hiện người ngã (chưa xác định danh tính) tại %s vào lúc %s.", camLocation, timeStr));
        } else {
            sb.append("Phát hiện sự cố té ngã khẩn cấp! Vui lòng kiểm tra ngay.");
        }

        return sb.toString();
    }
}