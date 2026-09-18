package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.MonitoredSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MonitoredSubjectRepository extends JpaRepository<MonitoredSubject, Long> {
    List<MonitoredSubject> findByAccountId(Long accountId);
}