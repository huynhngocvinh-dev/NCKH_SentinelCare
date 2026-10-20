package com.backend.SentinelCare.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IncidentResponseDTO {
    private Long id;
    private String incidentTimeFormatted; // DD/MM/YYYY - HH:mm:ss
    private String detectionSource;        // "IoT Device (FG-2024-00123)", "Camera AI (Phòng ngủ)", "Dung hợp (Cả hai)"
    private String patientName;
    private String locationAddress;       // Tọa độ GPS / Địa chỉ phòng
    private String status;                // CONFIRMED_FALL, CANCELLED_BY_USER, SOS_BY_USER...
    private String snapshotUrl;
}