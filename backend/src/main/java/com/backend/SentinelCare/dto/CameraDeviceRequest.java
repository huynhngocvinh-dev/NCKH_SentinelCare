package com.backend.SentinelCare.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CameraDeviceRequest {
    @NotBlank(message = "Tên Camera là bắt buộc")
    private String cameraName;
    @NotBlank(message = "Mã Serial Camera là bắt buộc")
    private String serialNumber;
    private String roomLocation;
    private String cameraAngle;
    private Boolean enableTwoWayIntercom;
}
