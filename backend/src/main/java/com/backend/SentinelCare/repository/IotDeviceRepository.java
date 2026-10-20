package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.IotDevice;
import com.backend.SentinelCare.model.MonitoredSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IotDeviceRepository extends JpaRepository<IotDevice, Long> {
    Optional<IotDevice> findByDeviceSerial(String deviceSerial);

    boolean existsByDeviceSerial(String deviceSerial);

    List<IotDevice> findByMonitoredSubjectIn(List<MonitoredSubject> subjects);
}