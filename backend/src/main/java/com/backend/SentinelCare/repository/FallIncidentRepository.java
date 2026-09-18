package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.FallIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FallIncidentRepository extends JpaRepository<FallIncident, Long> {
    List<FallIncident> findAllByOrderByIncidentTimeDesc();
    
    // Tìm sự cố đang đếm ngược 25s của người bệnh
    Optional<FallIncident> findFirstByPatientIdAndStatusOrderByIncidentTimeDesc(
            Long patientId, FallIncident.IncidentStatus status);
}