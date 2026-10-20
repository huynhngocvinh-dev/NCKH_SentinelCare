package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    @Query("SELECT s FROM UserSubscription s WHERE s.user.id = :userId AND s.status = 'ACTIVE' " +
           "AND (s.expiredAt IS NULL OR s.expiredAt > :now)")
    Optional<UserSubscription> findActiveSubscription(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}