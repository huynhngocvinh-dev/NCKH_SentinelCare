package com.backend.SentinelCare.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "fall_incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('PENDING', 'CANCELLED_BY_USER', 'SOS_BY_USER', 'CONFIRMED_FALL', 'FALSE_POSITIVE') DEFAULT 'PENDING'")
    private IncidentStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum IncidentStatus {
        PENDING, CANCELLED_BY_USER, SOS_BY_USER, CONFIRMED_FALL, FALSE_POSITIVE
    }
}