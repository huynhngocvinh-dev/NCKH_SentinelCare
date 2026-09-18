package com.backend.SentinelCare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CameraWebhookRequest {
    @NotBlank(message = "camera_code là bắt buộc")
    @JsonProperty("camera_code")
    private String cameraCode;

    @JsonProperty("location_name")
    private String locationName;

    private Long timestamp;

    @JsonProperty("confidence_score")
    private Float confidenceScore;

    @JsonProperty("snapshot_url")
    private String snapshotUrl;
}