package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.CameraWebhookRequest;
import com.backend.SentinelCare.dto.IncidentResponseDTO;
import com.backend.SentinelCare.dto.IotEventRequest;
import com.backend.SentinelCare.model.FallIncident;
import com.backend.SentinelCare.repository.FallIncidentRepository;
import com.backend.SentinelCare.service.IncidentEngineService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentEngineService incidentEngineService;
    private final FallIncidentRepository incidentRepository;

    // UC-02: Webhook tiếp nhận từ Camera AI
    @PostMapping("/webhook/camera")
    public ResponseEntity<?> receiveCameraWebhook(@Valid @RequestBody CameraWebhookRequest request) {
        FallIncident incident = incidentEngineService.processCameraWebhook(request);
        
        return ResponseEntity.ok(Map.of(
            "message", "Tiếp nhận tín hiệu Camera AI thành công. Đã kích hoạt đếm ngược 25s!",
            "incidentId", incident.getId(),
            "status", incident.getStatus().name(),
            "cameraCode", request.getCameraCode() != null ? request.getCameraCode() : "CAM_DEFAULT"
        ));
    }

    // UC-02 & UC-04: REST API tiếp nhận từ IoT Band
    @PostMapping("/iot-event")
    public ResponseEntity<?> receiveIotEvent(@Valid @RequestBody IotEventRequest request) {
        FallIncident incident = incidentEngineService.processIotEvent(request);
        
        if (incident == null) {
            return ResponseEntity.ok(Map.of(
                "message", "Sự kiện " + request.getEventType() + " đã được xử lý thành công"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "message", "Tiếp nhận tín hiệu IoT Band thành công!",
            "incidentId", incident.getId(),
            "status", incident.getStatus().name(),
            "deviceSerial", request.getDeviceSerial()
        ));
    }

    // Cho phép hỗ trợ cả GET (click từ Email) lẫn POST (gọi từ React App)
    @RequestMapping(value = "/{id}/acknowledge", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> acknowledgeIncident(@PathVariable Long id, HttpServletRequest request) {
        incidentEngineService.acknowledgeIncident(id);

        // Nếu gọi từ Trình duyệt / Email (dùng GET), trả về giao diện HTML màu xanh
        if ("GET".equalsIgnoreCase(request.getMethod())) {
            String htmlResponse = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Xác nhận sự cố - SentinelCare</title>
                </head>
                <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0;">
                    <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); text-align: center; max-width: 480px; width: 90%%;">
                        <div style="background-color: #dcfce7; color: #16a34a; width: 80px; height: 80px; border-radius: 50%%; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 20px auto;">
                            ✓
                        </div>
                        <h2 style="color: #15803d; margin: 0 0 10px 0; font-size: 22px;">ĐÃ XÁC NHẬN SỰ CỐ</h2>
                        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                            Hệ thống <strong>SentinelCare</strong> đã ghi nhận phản hồi xác nhận cho sự cố té ngã mã số <strong>#%d</strong>.
                        </p>
                        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; color: #166534; font-size: 14px; font-weight: 600;">
                            📞 Lập tức HỦY toàn bộ quy trình gọi điện GSM khẩn cấp!
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(id);

            return ResponseEntity.ok()
                    .header("Content-Type", "text/html; charset=UTF-8")
                    .body(htmlResponse);
        }

        // Nếu gọi từ Frontend App React (dùng POST), trả về JSON
        return ResponseEntity.ok(Map.of(
            "message", "Đã ghi nhận xác nhận từ người thân. Hủy cuộc gọi leo thang.",
            "incidentId", id,
            "status", "ACKNOWLEDGED"
        ));
    }

    // UC-06: API Lấy Lịch sử Sự cố theo thời gian thực
    @GetMapping("/history")
    public ResponseEntity<List<IncidentResponseDTO>> getIncidentHistory() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy - HH:mm:ss");

        List<IncidentResponseDTO> history = incidentRepository.findAllByOrderByIncidentTimeDesc()
                .stream()
                .map(inc -> {
                    String source = "Dung hợp AI & IoT";
                    if (inc.getIotDevice() != null && inc.getCameraDevice() == null) {
                        source = "Thiết bị đeo IoT (" + inc.getIotDevice().getDeviceSerial() + ")";
                    } else if (inc.getCameraDevice() != null && inc.getIotDevice() == null) {
                        source = "Camera AI (" + inc.getCameraDevice().getLocationName() + ")";
                    }

                    String location = "Địa chỉ cố định";
                    if (inc.getLatitude() != null && inc.getLongitude() != null) {
                        location = String.format("Tọa độ GPS (%.5f, %.5f)", inc.getLatitude(), inc.getLongitude());
                    } else if (inc.getCameraDevice() != null) {
                        location = "Vị trí: " + inc.getCameraDevice().getLocationName();
                    }

                    return IncidentResponseDTO.builder()
                            .id(inc.getId())
                            .incidentTimeFormatted(inc.getIncidentTime() != null ? inc.getIncidentTime().format(formatter) : "")
                            .detectionSource(source)
                            .patientName(inc.getPatient() != null ? inc.getPatient().getFullName() : "Cụ Nguyễn Văn An")
                            .locationAddress(location)
                            .status(inc.getStatus().name())
                            .snapshotUrl(inc.getSnapshotUrl())
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }
}