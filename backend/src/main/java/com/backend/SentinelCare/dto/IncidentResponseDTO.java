package com.backend.SentinelCare.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IncidentResponseDTO {
    private Long id;
    private String incidentTimeFormatted; // DD/MM/YYYY - HH:mm:ss
    private String detectionSource;       // "Thiết bị đeo IoT (...)", "Camera AI (...)", "Dung hợp AI & IoT"
    private String patientName;
    private String locationAddress;       // Tọa độ GPS / Địa chỉ phòng
    private String status;                // CONFIRMED_FALL, CANCELLED_BY_USER, ...
    private String callEscalationStatus;  // CALL_NOT_STARTED, CALLING, CALL_CONNECTED, ...
    private String snapshotUrl;
}