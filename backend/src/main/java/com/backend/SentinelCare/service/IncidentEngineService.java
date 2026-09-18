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
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class IncidentEngineService {

    private final FallIncidentRepository incidentRepository;
    private final IotDeviceRepository iotDeviceRepository;
    private final CameraDeviceRepository cameraDeviceRepository;
    private final EmergencyContactRepository contactRepository;
    private final VoipCallService voipCallService;

    // UC-02 & UC-03: Tiếp nhận Nguồn 1 (Camera AI)
    @Transactional
    public FallIncident processCameraWebhook(CameraWebhookRequest request) {
        CameraDevice camera = cameraDeviceRepository.findByCameraCode(request.getCameraCode())
                .orElseGet(() -> cameraDeviceRepository.save(CameraDevice.builder()
                        .cameraCode(request.getCameraCode())
                        .locationName(request.getLocationName())
                        .status(CameraDevice.Status.active)
                        .build()));

        FallIncident incident = FallIncident.builder()
                .cameraDevice(camera)
                .confidenceScore(request.getConfidenceScore())
                .snapshotUrl(request.getSnapshotUrl())
                .incidentTime(LocalDateTime.now())
                .status(FallIncident.IncidentStatus.PENDING)
                .build();

        incident = incidentRepository.save(incident);
        log.info("📷 [UC-02] Đã nhận tín hiệu từ Camera AI (ID: {}). Kích hoạt cửa sổ đếm ngược 25s!", camera.getCameraCode());

        trigger25sVerificationWindow(incident.getId());
        return incident;
    }

    // UC-02 & UC-04: Tiếp nhận Nguồn 2 (IoT Device MPU6050 & Nút bấm)
    @Transactional
    public FallIncident processIotEvent(IotEventRequest request) {
        Optional<IotDevice> deviceOpt = iotDeviceRepository.findByDeviceSerial(request.getDeviceSerial());
        
        if (deviceOpt.isEmpty()) {
            log.warn("Thiết bị IoT chưa đăng ký: {}", request.getDeviceSerial());
            return null;
        }

        IotDevice device = deviceOpt.get();
        // Lấy MonitoredSubject từ IotDevice
        MonitoredSubject patient = device.getMonitoredSubject();

        // XỬ LÝ NÚT BẤM PHẢN HỒI (UC-04)
        if ("CANCEL".equalsIgnoreCase(request.getEventType())) {
            // Trường hợp A: Bệnh nhân nhấn 3 lần -> HỦY BÁO ĐỘNG
            cancelActiveIncident(patient != null ? patient.getId() : null);
            return null;
        }

        if ("SOS_NOW".equalsIgnoreCase(request.getEventType())) {
            // Trường hợp B: Bệnh nhân nhấn giữ SOS -> BỎ QUA 25S, BÁO ĐỘNG GẤP
            return triggerImmediateSos(device, patient, request.getLatitude(), request.getLongitude());
        }

        // Trường hợp C: Gia tốc vượt ngưỡng -> Bắt đầu đếm ngược 25s
        FallIncident incident = FallIncident.builder()
                .iotDevice(device)
                .patient(patient)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .incidentTime(LocalDateTime.now())
                .status(FallIncident.IncidentStatus.PENDING)
                .build();

        incident = incidentRepository.save(incident);
        log.info("⌚ [UC-02] Đã nhận tín hiệu từ IoT Band (Serial: {}). Bắt đầu đếm ngược 25s!", device.getDeviceSerial());

        trigger25sVerificationWindow(incident.getId());
        return incident;
    }

    // UC-04: Cửa sổ xác minh 25 giây bất đồng bộ
    @Async
    public void trigger25sVerificationWindow(Long incidentId) {
        try {
            Thread.sleep(25000); // Đếm ngược 25 giây
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        Optional<FallIncident> incidentOpt = incidentRepository.findById(incidentId);
        if (incidentOpt.isPresent()) {
            FallIncident incident = incidentOpt.get();

            // Nếu sau 25s vẫn là PENDING -> Xác nhận ĐÃ NGÃ THẬT (CONFIRMED_FALL)
            if (incident.getStatus() == FallIncident.IncidentStatus.PENDING) {
                incident.setStatus(FallIncident.IncidentStatus.CONFIRMED_FALL);
                incidentRepository.save(incident);

                log.warn("🚨 [UC-04 - TRƯỜNG HỢP C] Hết 25s không nhận được phản hồi. Xác nhận NGÃ THẬT! Kích hoạt UC-05.");
                executeMultiChannelEscalation(incident);
            }
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
            log.info("[UC-04 - TRƯỜNG HỢP A] Bệnh nhân nhấn hủy 3 lần. Đã hủy đếm ngược, hệ thống trở về BÌNH THƯỜNG.");
        }
    }

    // 🟢 SỬA THAM SỐ: Đổi UserProfile -> MonitoredSubject
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
        log.warn(" [UC-04 - TRƯỜNG HỢP B] Bệnh nhân bấm SOS GẤP! Nhảy thẳng sang Kích hoạt Cảnh báo Đa kênh.");
        executeMultiChannelEscalation(incident);
        return incident;
    }

    // UC-05: Kích hoạt Cảnh báo Khẩn cấp Đa kênh (Multi-Channel Escalation)
    private void executeMultiChannelEscalation(FallIncident incident) {
        // 1. Trích xuất thông tin bệnh nhân & vị trí
        String patientName = incident.getPatient() != null ? incident.getPatient().getFullName() : "Người thân (Cụ An)";
        
        String location = incident.getLatitude() != null ?
                String.format("GPS (%.5f, %.5f)", incident.getLatitude(), incident.getLongitude()) :
                (incident.getCameraDevice() != null ? incident.getCameraDevice().getLocationName() : "Phòng ngủ Tầng 2");
    
  
        String timeStr = incident.getIncidentTime() != null 
                ? incident.getIncidentTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss 'ngày' dd/MM/yyyy"))
                : "ngay lúc này";
    
        log.info("📲 [UC-05 - KÊNH 1 & 2] Đang kích hoạt thông báo chuông Web và gọi điện GSM !");
    
        List<EmergencyContact> contacts = contactRepository.findAll();
        voipCallService.triggerEscalationCallWorkflow(contacts, patientName, location, timeStr);
    }
}