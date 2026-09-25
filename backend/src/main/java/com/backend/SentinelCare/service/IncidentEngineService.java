package com.backend.SentinelCare.service;

import com.backend.SentinelCare.dto.CameraWebhookRequest;
import com.backend.SentinelCare.dto.IotEventRequest;
import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class IncidentEngineService {

    private final FallIncidentRepository incidentRepository;
    private final IotDeviceRepository iotDeviceRepository;
    private final SensorDataRepository sensorDataRepository;
    private final CameraDeviceRepository cameraDeviceRepository;
    private final CameraHistoryRepository cameraHistoryRepository;
    
    
    private final IncidentFusionService fusionService;
    private final IncidentNotificationService notificationService;

    // 1. TIẾP NHẬN CAMERA WEBHOOK
    @Transactional
    public FallIncident processCameraWebhook(CameraWebhookRequest request) {
        // A. Lưu log thô vào camera_history
        saveCameraRawHistory(request);

        // B. Tìm/Tạo mới Camera Device
        String camCode = request.getCameraCode() != null ? request.getCameraCode() : "CAM_DEFAULT";
        String location = request.getLocationName() != null ? request.getLocationName() : "Phòng khách (Camera AI)";

        CameraDevice camera = cameraDeviceRepository.findByCameraCode(camCode)
                .orElseGet(() -> cameraDeviceRepository.save(CameraDevice.builder()
                        .cameraCode(camCode)
                        .locationName(location)
                        .status(CameraDevice.Status.active)
                        .build()));

        // C. Dung hợp sự cố và lưu DB
        FallIncident incident = fusionService.fuseCameraEvent(camera, request);
        incident = incidentRepository.save(incident);

        // D. Kích hoạt đếm ngược 25s
        trigger25sVerificationWindow(incident.getId());
        return incident;
    }

    // 2. TIẾP NHẬN IOT EVENT
    @Transactional
    public FallIncident processIotEvent(IotEventRequest request) {
        Optional<IotDevice> deviceOpt = iotDeviceRepository.findByDeviceSerial(request.getDeviceSerial());
        if (deviceOpt.isEmpty()) {
            log.warn("Thiết bị IoT chưa đăng ký: {}", request.getDeviceSerial());
            return null;
        }

        IotDevice device = deviceOpt.get();
        
        //Lưu nhật ký cảm biến thô vào bảng sensor_data
        saveRawSensorData(request, device);

        MonitoredSubject patient = device.getMonitoredSubject();

        if ("CANCEL".equalsIgnoreCase(request.getEventType())) {
            cancelActiveIncident(patient != null ? patient.getId() : null);
            return null;
        }

        if ("SOS_NOW".equalsIgnoreCase(request.getEventType())) {
            return triggerImmediateSos(device, patient, request.getLatitude(), request.getLongitude());
        }

        // Dung hợp sự cố và lưu DB
        FallIncident incident = fusionService.fuseIotEvent(device, patient, request);
        incident = incidentRepository.save(incident);

        trigger25sVerificationWindow(incident.getId());
        return incident;
    }

    private void saveRawSensorData(IotEventRequest request, IotDevice device) {
        try {
            String rawJson = String.format("{\"lat\": %s, \"lng\": %s, \"eventType\": \"%s\"}",
                    request.getLatitude(), request.getLongitude(), request.getEventType());
    
            SensorData sensorLog = SensorData.builder()
                    .iotDevice(device)
                    .accelerationX(request.getAccelX())
                    .accelerationY(request.getAccelY())
                    .accelerationZ(request.getAccelZ())
                    .gyroX(request.getGyroX())
                    .gyroY(request.getGyroY())
                    .gyroZ(request.getGyroZ())
                    .fallDetected("FALL_DETECTED".equalsIgnoreCase(request.getEventType()))
                    .fallConfidence(0.95f)
                    .rawData(rawJson)
                    .build();
    
            sensorDataRepository.save(sensorLog);
            log.info("Đã lưu thành công SensorData cho thiết bị IoT: {}", device.getDeviceSerial());
        } catch (Exception e) {
            log.error("Lỗi khi lưu SensorData: ", e);
        }
    }

    // 3. CỬA SỔ XÁC MINH BAN ĐẦU (25 GIÂY)
    @Async
    public void trigger25sVerificationWindow(Long incidentId) {
        try {
            Thread.sleep(25000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        Optional<FallIncident> incidentOpt = incidentRepository.findById(incidentId);
        if (incidentOpt.isPresent()) {
            FallIncident incident = incidentOpt.get();
            if (incident.getStatus() == FallIncident.IncidentStatus.PENDING) {
                incident.setStatus(FallIncident.IncidentStatus.CONFIRMED_FALL);
                incidentRepository.save(incident);

                log.warn("🚨 [CONFIRMED] XÁC NHẬN NGÃ THẬT! Bắt đầu luồng thông báo 60s.");
                start60sEscalationWorkflow(incident);
            }
        }
    }

    // 4. BẮT ĐẦU LUỒNG THÔNG BÁO TỨC THÌ VÀ ĐẾM NGƯỢC 60S
    private void start60sEscalationWorkflow(FallIncident incident) {
        String alertText = fusionService.buildCompositeAlertText(incident);
        
        // Bắn WebSocket & Email TTS
        notificationService.dispatchImmediateNotifications(incident, alertText);

        // Chạy timer đếm ngược 60s
        notificationService.trigger60sCallEscalationTimer(incident.getId(), alertText);
    }

    // 5. API XÁC NHẬN TỪ NGƯỜI THÂN
    @Transactional
    public void acknowledgeIncident(Long incidentId) {
        Optional<FallIncident> incidentOpt = incidentRepository.findById(incidentId);
        if (incidentOpt.isPresent()) {
            FallIncident incident = incidentOpt.get();
            incident.setStatus(FallIncident.IncidentStatus.ACKNOWLEDGED);
            incidentRepository.save(incident);
            log.info("👍 Đã xác nhận sự cố ID: {}. Đã khóa leo thang cuộc gọi!", incidentId);
        }
    }

    private void saveCameraRawHistory(CameraWebhookRequest request) {
        try {
            CameraWebhookRequest.PersonData person = request.getPerson();
            CameraWebhookRequest.BoundingBox bbox = (person != null) ? person.getBoundingBox() : null;

            CameraHistory history = CameraHistory.builder()
                    .eventId(request.getEventId())
                    .cameraCode(request.getCameraCode())
                    .eventType(request.getEventType())
                    .severity(request.getSeverity())
                    .trackId(person != null ? person.getTrackId() : null)
                    .bodyAngle(person != null ? person.getBodyAngle() : null)
                    .aspectRatio(person != null ? person.getAspectRatio() : null)
                    .bboxX1(bbox != null ? bbox.getX1() : null)
                    .bboxY1(bbox != null ? bbox.getY1() : null)
                    .bboxX2(bbox != null ? bbox.getX2() : null)
                    .bboxY2(bbox != null ? bbox.getY2() : null)
                    .snapshotBase64(request.getSnapshotBase64())
                    .cameraTimestamp(LocalDateTime.now())
                    .build();

            cameraHistoryRepository.save(history);
        } catch (Exception e) {
            log.error("Lỗi khi lưu camera_history: ", e);
        }
    }

    private void cancelActiveIncident(Long patientId) {
        if (patientId == null) return;
        Optional<FallIncident> pendingOpt = incidentRepository.findFirstByPatientIdAndStatusOrderByIncidentTimeDesc(
                patientId, FallIncident.IncidentStatus.PENDING);

        if (pendingOpt.isPresent()) {
            FallIncident incident = pendingOpt.get();
            incident.setStatus(FallIncident.IncidentStatus.CANCELLED_BY_USER);
            incidentRepository.save(incident);
            log.info("Bệnh nhân nhấn hủy 3 lần. Đã hủy đếm ngược!");
        }
    }

    private FallIncident triggerImmediateSos(IotDevice device, MonitoredSubject patient, Double lat, Double lng) {
        FallIncident incident = FallIncident.builder()
                .iotDevice(device)
                .patient(patient)
                .latitude(lat)
                .longitude(lng)
                .incidentTime(LocalDateTime.now())
                .status(FallIncident.IncidentStatus.SOS_BY_USER)
                .build();

        incident = incidentRepository.save(incident);
        start60sEscalationWorkflow(incident);
        return incident;
    }
}