package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.SubscriptionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionLogRepository extends JpaRepository<SubscriptionLog, Long> {
    Page<SubscriptionLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}