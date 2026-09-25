package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.CameraHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CameraHistoryRepository extends JpaRepository<CameraHistory, Long> {
    List<CameraHistory> findByCameraCodeOrderByCreatedAtDesc(String cameraCode);
}