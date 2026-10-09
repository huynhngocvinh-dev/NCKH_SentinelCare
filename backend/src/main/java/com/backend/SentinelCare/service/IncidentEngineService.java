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

    // 1. TIẾP NHẬN CAMERA WEBHOOK: Bỏ qua đếm ngược 25s, cảnh báo ngay
    @Transactional
    public FallIncident processCameraWebhook(CameraWebhookRequest request) {
        saveCameraRawHistory(request);

        String camCode = request.getCameraCode() != null ? request.getCameraCode() : "CAM_DEFAULT";
        String location = request.getLocationName() != null ? request.getLocationName() : "Phòng khách (Camera AI)";

        CameraDevice camera = cameraDeviceRepository.findByCameraCode(camCode)
                .orElseGet(() -> cameraDeviceRepository.save(CameraDevice.builder()
                        .cameraCode(camCode)
                        .locationName(location)
                        .status(CameraDevice.Status.active)
                        .build()));

        // Dung hợp sự cố và đặt trạng thái CONFIRMED_FALL & CALL_NOT_STARTED
        FallIncident incident = fusionService.fuseCameraEvent(camera, request);
        incident.setStatus(FallIncident.IncidentStatus.CONFIRMED_FALL);
        incident.setCallEscalationStatus(FallIncident.CallEscalationStatus.CALL_NOT_STARTED);
        incident = incidentRepository.save(incident);

        log.warn("🚨 [CAMERA AI] Phát hiện té ngã! Bắt đầu phát cảnh báo ngay lập tức.");
        triggerEscalationWorkflow(incident);
        
        return incident;
    }

    // 2. TIẾP NHẬN IOT EVENT: Đếm ngược 25s & Cảnh báo về thiết bị đeo
    @Transactional
    public FallIncident processIotEvent(IotEventRequest request) {
        Optional<IotDevice> deviceOpt = iotDeviceRepository.findByDeviceSerial(request.getDeviceSerial());
        if (deviceOpt.isEmpty()) {
            log.warn("⚠️ Thiết bị IoT chưa đăng ký: {}", request.getDeviceSerial());
            return null;
        }

        IotDevice device = deviceOpt.get();
        saveRawSensorData(request, device);
        MonitoredSubject patient = device.getMonitoredSubject();

        // TH1: Bấm 3 lần để HỦY (Báo nhầm)
        if ("CANCEL".equalsIgnoreCase(request.getEventType()) || "CANCEL_3X".equalsIgnoreCase(request.getEventType())) {
            cancelActiveIncident(patient != null ? patient.getId() : null);
            return null;
        }

        // TH2: Bấm 1 lần xác nhận ngã / Bấm SOS
        if ("SOS_NOW".equalsIgnoreCase(request.getEventType()) || "CONFIRM_NOW".equalsIgnoreCase(request.getEventType())) {
            log.info("🆘 Bệnh nhân bấm xác nhận ngã/SOS trên thiết bị!");
            return triggerImmediateSos(device, patient, request.getLatitude(), request.getLongitude());
        }

        // TH3: Cảm biến tự động phát hiện nghi ngờ té ngã -> PENDING & Đếm ngược 25s
        FallIncident incident = fusionService.fuseIotEvent(device, patient, request);
        incident.setStatus(FallIncident.IncidentStatus.PENDING);
        incident.setCallEscalationStatus(FallIncident.CallEscalationStatus.CALL_NOT_STARTED);
        incident = incidentRepository.save(incident);

        // Báo động xuống thiết bị đeo IoT (Rung/Còi)
        sendAlertSignalToIotDevice(device.getDeviceSerial());

        // Kích hoạt đếm ngược 25s
        trigger25sIotVerificationWindow(incident.getId());
        return incident;
    }

    // 3. CỬA SỔ XÁC MINH 25 GIÂY CHO IOT
    @Async
    public void trigger25sIotVerificationWindow(Long incidentId) {
        try {
            log.info("⏳ [IOT DEVICE] Đang đếm ngược 25s chờ phản hồi từ người đeo...");
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

                log.warn("🚨 [IOT 25S TIMEOUT] Hết 25s không bấm hủy. Bắt đầu phát cảnh báo!");
                triggerEscalationWorkflow(incident);
            }
        }
    }

    // 4. API XÁC NHẬN TỪ NGƯỜI THÂN (Dừng leo thang cuộc gọi)
    @Transactional
    public void acknowledgeIncident(Long incidentId) {
        Optional<FallIncident> incidentOpt = incidentRepository.findById(incidentId);
        if (incidentOpt.isPresent()) {
            FallIncident incident = incidentOpt.get();
            incident.setStatus(FallIncident.IncidentStatus.ACKNOWLEDGED);
            // Dừng tiến trình gọi
            incident.setCallEscalationStatus(FallIncident.CallEscalationStatus.ESCALATION_STOPPED);
            incidentRepository.save(incident);
            log.info("👍 Đã xác nhận sự cố ID: {}. Đã khóa cuộc gọi leo thang!", incidentId);
        }
    }

    private void triggerEscalationWorkflow(FallIncident incident) {
        String alertText = fusionService.buildCompositeAlertText(incident);
        notificationService.dispatchImmediateNotifications(incident, alertText);
    }

    private void cancelActiveIncident(Long patientId) {
        if (patientId == null) return;
        Optional<FallIncident> pendingOpt = incidentRepository.findFirstByPatientIdAndStatusOrderByIncidentTimeDesc(
                patientId, FallIncident.IncidentStatus.PENDING);

        if (pendingOpt.isPresent()) {
            FallIncident incident = pendingOpt.get();
            incident.setStatus(FallIncident.IncidentStatus.CANCELLED_BY_USER);
            incident.setCallEscalationStatus(FallIncident.CallEscalationStatus.ESCALATION_STOPPED);
            incidentRepository.save(incident);
            log.info(" [CANCELLED] da huy dem nguoc 25s!");
        }
    }

    private void sendAlertSignalToIotDevice(String deviceSerial) {
        log.info(" [MQTT/HTTP] gui lenh phat coi /rung dem nguocc 25s toi IoT: {}", deviceSerial);
    }

    private FallIncident triggerImmediateSos(IotDevice device, MonitoredSubject patient, Double lat, Double lng) {
        FallIncident incident = FallIncident.builder()
                .iotDevice(device)
                .patient(patient)
                .latitude(lat)
                .longitude(lng)
                .incidentTime(LocalDateTime.now())
                .status(FallIncident.IncidentStatus.CONFIRMED_FALL)
                .callEscalationStatus(FallIncident.CallEscalationStatus.CALL_NOT_STARTED)
                .build();

        incident = incidentRepository.save(incident);
        triggerEscalationWorkflow(incident);
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
        } catch (Exception e) {
            log.error("loi khi luu SensorData: ", e);
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
            log.error("loi khi luu camera_history: ", e);
        }
    }
}