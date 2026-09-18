package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.CameraWebhookRequest;
import com.backend.SentinelCare.dto.IncidentResponseDTO;
import com.backend.SentinelCare.dto.IotEventRequest;
import com.backend.SentinelCare.model.FallIncident;
import com.backend.SentinelCare.repository.FallIncidentRepository;
import com.backend.SentinelCare.service.IncidentEngineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
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
        return ResponseEntity.ok(incident);
    }

    // UC-02 & UC-04: REST API tiếp nhận từ IoT Band (Gia tốc / Nút Hủy / Nút SOS)
    @PostMapping("/iot-event")
    public ResponseEntity<?> receiveIotEvent(@Valid @RequestBody IotEventRequest request) {
        FallIncident incident = incidentEngineService.processIotEvent(request);
        return ResponseEntity.ok(incident != null ? incident : "Event processed");
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