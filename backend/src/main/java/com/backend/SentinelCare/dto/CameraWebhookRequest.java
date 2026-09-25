package com.backend.SentinelCare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CameraWebhookRequest {

    private String eventId;
    private String eventType;
    private String severity;
    private String timestamp;

   
    @JsonProperty("cameraId")
    private String cameraCode;

    private String locationName;

    private PersonData person;

    private String snapshotBase64;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonData {
        private Integer trackId;
        private String state;
        private Double bodyAngle;
        private Double aspectRatio;
        private BoundingBox boundingBox;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoundingBox {
        private Integer x1;
        private Integer y1;
        private Integer x2;
        private Integer y2;
    }
}