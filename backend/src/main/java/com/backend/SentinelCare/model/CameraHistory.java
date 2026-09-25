package com.backend.SentinelCare.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "camera_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CameraHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id")
    private String eventId;

    @Column(name = "camera_code")
    private String cameraCode;

    private String eventType; 
    private String severity;  

    private Integer trackId; 
    private Double bodyAngle;
    private Double aspectRatio;

    // Tọa độ BoundingBox lưu dạng chuỗi JSON hoặc text
    private Integer bboxX1;
    private Integer bboxY1;
    private Integer bboxX2;
    private Integer bboxY2;

    @Lob
    @Column(name = "snapshot_base64", columnDefinition = "LONGTEXT")
    private String snapshotBase64; 

    @Column(name = "camera_timestamp")
    private LocalDateTime cameraTimestamp;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}