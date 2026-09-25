package com.backend.SentinelCare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IotEventRequest {
    @NotBlank(message = "device_serial là bắt buộc")
    @JsonProperty("device_serial")
    private String deviceSerial;

    @JsonProperty("event_type")
    private String eventType; // "ACCEL_THRESHOLD", "CANCEL", "SOS_NOW"

    private Double latitude;
    private Double longitude;
    
    private Double accelX;
    private Double accelY;
    private Double accelZ;

    private Double gyroX;
    private Double gyroY;
    private Double gyroZ;
}