package com.backend.SentinelCare.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "iot_device_id", nullable = false)
    private IotDevice iotDevice;

    // Dữ liệu gia tốc MPU6050
    private Double accelerationX;
    private Double accelerationY;
    private Double accelerationZ;

    // Dữ liệu con quay hồi chuyển
    private Double gyroX;
    private Double gyroY;
    private Double gyroZ;

    private Boolean fallDetected;
    private Float fallConfidence;

    // Chuỗi JSON lưu thông tin mở rộng (GPS: lat/lng, nút bấm: SOS_NOW/CANCEL)
    @Column(columnDefinition = "TEXT")
    private String rawData;

    @CreationTimestamp
    @Column(name = "timestamp", updatable = false)
    private LocalDateTime timestamp;
}