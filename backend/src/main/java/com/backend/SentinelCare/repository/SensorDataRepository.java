package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
    // Tìm nhật ký cảm biến gần nhất của một thiết bị
    List<SensorData> findByIotDeviceIdOrderByTimestampDesc(Long iotDeviceId);
}