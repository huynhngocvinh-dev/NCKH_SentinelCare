package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.Subscription;
import com.backend.SentinelCare.model.Subscription.Status;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

        Optional<Subscription> findByUserId(Long userId);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        Optional<Subscription> findWithLockByUserId(Long userId);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        Optional<Subscription> findWithLockById(Long id);

        // Gói ACTIVE đã hết kỳ + mọi gói đang ân hạn: cron cần xử lý
        @Query("SELECT s.id FROM Subscription s WHERE " +
                        "(s.status = :active AND s.currentPeriodEnd IS NOT NULL AND s.currentPeriodEnd <= :now) " +
                        "OR s.status = :grace")
        List<Long> findDueIdsInternal(@Param("now") LocalDateTime now,
                        @Param("active") Status active,
                        @Param("grace") Status grace);

        default List<Long> findDueIds(LocalDateTime nowUtc) {
                return findDueIdsInternal(nowUtc, Status.ACTIVE, Status.GRACE_PERIOD);
        }

        // Gói sắp hết kỳ trong khoảng (now, until] mà chưa nhắc trong kỳ này
        @Query("SELECT s.id FROM Subscription s WHERE s.status = :active " +
                        "AND s.currentPeriodEnd IS NOT NULL AND s.currentPeriodEnd > :now AND s.currentPeriodEnd <= :until "
                        +
                        "AND (s.renewalReminderSentAt IS NULL OR s.renewalReminderSentAt < s.currentPeriodStart)")
        List<Long> findIdsNeedingReminderInternal(@Param("now") LocalDateTime now,
                        @Param("until") LocalDateTime until,
                        @Param("active") Status active);

        default List<Long> findIdsNeedingReminder(LocalDateTime nowUtc, LocalDateTime untilUtc) {
                return findIdsNeedingReminderInternal(nowUtc, untilUtc, Status.ACTIVE);
        }
}