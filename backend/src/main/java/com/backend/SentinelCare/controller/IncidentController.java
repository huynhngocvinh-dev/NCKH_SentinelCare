package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.CameraWebhookRequest;
import com.backend.SentinelCare.dto.IncidentResponseDTO;
import com.backend.SentinelCare.dto.IotEventRequest;
import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.model.FallIncident;
import com.backend.SentinelCare.repository.AccountRepository;
import com.backend.SentinelCare.repository.FallIncidentRepository;
import com.backend.SentinelCare.security.AckTokenService;
import com.backend.SentinelCare.service.IncidentEngineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentEngineService incidentEngineService;
    private final FallIncidentRepository incidentRepository;
    private final AccountRepository accountRepository;
    private final AckTokenService ackTokenService;

    // Khóa riêng cho thiết bị (camera AI, vòng đeo IoT) gọi vào hệ thống
    @Value("${sentinel.device-api-key:}")
    private String deviceApiKey;

    // UC-02: Webhook tiếp nhận từ Camera AI (xác thực bằng X-Device-Key)
    @PostMapping("/webhook/camera")
    public ResponseEntity<?> receiveCameraWebhook(
            @RequestHeader(value = "X-Device-Key", required = false) String deviceKey,
            @Valid @RequestBody CameraWebhookRequest request) {
        if (!isValidDeviceKey(deviceKey)) return unauthorizedDevice();

        FallIncident incident = incidentEngineService.processCameraWebhook(request);

        return ResponseEntity.ok(Map.of(
            "message", "Tiếp nhận tín hiệu Camera AI thành công. Đã kích hoạt đếm ngược 25s!",
            "incidentId", incident.getId(),
            "status", incident.getStatus().name(),
            "cameraCode", request.getCameraCode() != null ? request.getCameraCode() : "CAM_DEFAULT"
        ));
    }

    // UC-02 & UC-04: REST API tiếp nhận từ IoT Band (xác thực bằng X-Device-Key)
    @PostMapping("/iot-event")
    public ResponseEntity<?> receiveIotEvent(
            @RequestHeader(value = "X-Device-Key", required = false) String deviceKey,
            @Valid @RequestBody IotEventRequest request) {
        if (!isValidDeviceKey(deviceKey)) return unauthorizedDevice();

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

    // Xác nhận qua LINK TRONG EMAIL (không cần đăng nhập, bắt buộc token ký hợp lệ)
    @GetMapping("/{id}/acknowledge")
    public ResponseEntity<?> acknowledgeByEmailLink(@PathVariable Long id,
                                                    @RequestParam(required = false) String token) {
        if (!ackTokenService.verify(id, token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .header("Content-Type", "text/html; charset=UTF-8")
                    .body("<h3 style=\"font-family:sans-serif\">Liên kết xác nhận không hợp lệ hoặc đã bị chỉnh sửa.</h3>");
        }

        incidentEngineService.acknowledgeIncident(id);

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

    // Xác nhận từ WEB (bắt buộc đăng nhập và đúng chủ sự cố)
    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<?> acknowledgeFromApp(@PathVariable Long id, Authentication authentication) {
        Account account = currentAccount(authentication);

        if (!incidentRepository.existsByIdAndOwnerAccountId(id, account.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền xác nhận sự cố này!"));
        }

        incidentEngineService.acknowledgeIncident(id);
        return ResponseEntity.ok(Map.of(
            "message", "Đã ghi nhận xác nhận từ người thân. Hủy cuộc gọi leo thang.",
            "incidentId", id,
            "status", "ACKNOWLEDGED"
        ));
    }

    // UC-06: Lịch sử sự cố CỦA TÀI KHOẢN ĐANG ĐĂNG NHẬP, có phân trang (?page=0&size=10)
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getIncidentHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Account account = currentAccount(authentication);
        int safeSize = Math.min(Math.max(size, 1), 50);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy - HH:mm:ss");

        Page<FallIncident> result = incidentRepository.findByOwnerAccountId(
                account.getId(),
                PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "incidentTime")));

        List<IncidentResponseDTO> content = result.getContent().stream().map(inc -> {
            String source = "Dung hợp AI & IoT";
            if (inc.getIotDevice() != null && inc.getCameraDevice() == null) {
                source = "Thiết bị đeo IoT (" + inc.getIotDevice().getDeviceSerial() + ")";
            } else if (inc.getCameraDevice() != null && inc.getIotDevice() == null) {
                source = "Camera AI (" + inc.getCameraDevice().getLocationName() + ")";
            }

            String location = "Chưa rõ vị trí";
            if (inc.getLatitude() != null && inc.getLongitude() != null) {
                location = String.format("Tọa độ GPS (%.5f, %.5f)", inc.getLatitude(), inc.getLongitude());
            } else if (inc.getCameraDevice() != null) {
                location = "Vị trí: " + inc.getCameraDevice().getLocationName();
            }

            return IncidentResponseDTO.builder()
                    .id(inc.getId())
                    .incidentTimeFormatted(inc.getIncidentTime() != null ? inc.getIncidentTime().format(formatter) : "")
                    .detectionSource(source)
                    .patientName(inc.getPatient() != null ? inc.getPatient().getFullName() : "Chưa định danh (Camera AI)")
                    .locationAddress(location)
                    .status(inc.getStatus().name())
                    .snapshotUrl(inc.getSnapshotUrl())
                    .build();
        }).toList();

        return ResponseEntity.ok(Map.of(
            "content", content,
            "page", result.getNumber(),
            "size", result.getSize(),
            "totalElements", result.getTotalElements(),
            "totalPages", result.getTotalPages()
        ));
    }

    // ---------- Hàm hỗ trợ ----------

    private Account currentAccount(Authentication authentication) {
        String identifier = authentication.getName();
        return accountRepository.findByEmail(identifier)
                .or(() -> accountRepository.findByPhoneNumber(identifier))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản đăng nhập!"));
    }

    private boolean isValidDeviceKey(String provided) {
        if (deviceApiKey == null || deviceApiKey.isBlank() || provided == null) return false;
        return MessageDigest.isEqual(
                deviceApiKey.getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8));
    }

    private ResponseEntity<?> unauthorizedDevice() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Thiếu hoặc sai khóa thiết bị (X-Device-Key)!"));
    }
}