package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.Address;
import com.backend.SentinelCare.model.CameraDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CameraDeviceRepository extends JpaRepository<CameraDevice, Long> {
    Optional<CameraDevice> findByCameraCode(String cameraCode);

    List<CameraDevice> findByAddressIn(List<Address> addresses);
}