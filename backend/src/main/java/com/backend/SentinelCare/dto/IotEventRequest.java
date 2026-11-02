package com.backend.SentinelCare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IotEventRequest {
    @NotBlank(message = "device_serial là bắt buộc")
    @JsonProperty("device_serial")
    private String deviceSerial;

    // "ACCEL_THRESHOLD", "CANCEL", "SOS_NOW", "CONFIRM_NOW", "HEARTBEAT"
    @JsonProperty("event_type")
    private String eventType;

    private Double latitude;
    private Double longitude;

    private Double accelX;
    private Double accelY;
    private Double accelZ;

    private Double gyroX;
    private Double gyroY;
    private Double gyroZ;

    // Pin thật của thiết bị (0-100), có thể gửi kèm bất kỳ sự kiện nào
    @JsonProperty("battery_level")
    private Integer batteryLevel;

    // Độ tin cậy do thiết bị tự tính (có thể bỏ trống)
    @JsonProperty("fall_confidence")
    private Float fallConfidence;
}