package com.backend.SentinelCare.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "fall_incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "address"})
public class FallIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private MonitoredSubject patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "iot_device_id")
    private IotDevice iotDevice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camera_id")
    private CameraDevice cameraDevice;

    @Column(name = "incident_time")
    private LocalDateTime incidentTime;

    private Double latitude;
    private Double longitude;

    @Column(name = "confidence_score")
    private Float confidenceScore;

    @Column(name = "snapshot_url", length = 550)
    private String snapshotUrl;

    // 1. Trạng thái vòng đời sự cố
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private IncidentStatus status;  

    // 2. Trạng thái tiến trình cuộc gọi khẩn cấp (Lớp trạng thái bổ sung)
    @Enumerated(EnumType.STRING)
    @Column(name = "call_escalation_status", length = 50)
    private CallEscalationStatus callEscalationStatus;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum IncidentStatus {
        PENDING, CANCELLED_BY_USER, SOS_BY_USER, CONFIRMED_FALL, ACKNOWLEDGED, FALSE_POSITIVE
    }

    public enum CallEscalationStatus {
        CALL_NOT_STARTED,
        CALLING,
        CALL_CONNECTED,
        CALL_TIMEOUT,
        ESCALATION_STOPPED
    }
}