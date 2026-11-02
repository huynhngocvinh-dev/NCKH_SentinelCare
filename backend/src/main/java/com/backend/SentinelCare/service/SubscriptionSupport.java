package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.model.ServicePackage;
import com.backend.SentinelCare.model.SubscriptionLog;
import com.backend.SentinelCare.model.UserProfile;
import com.backend.SentinelCare.repository.SubscriptionLogRepository;
import com.backend.SentinelCare.repository.UserProfileRepository;
import com.backend.SentinelCare.util.Utc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionSupport {

    public static final String ACTOR_USER = "USER";
    public static final String ACTOR_SYSTEM = "SYSTEM";

    private final SubscriptionLogRepository logRepository;
    private final UserProfileRepository userProfileRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void audit(Account user, SubscriptionLog.Action action, String actor, Long subscriptionId, Long invoiceId,
            String fromStatus, String toStatus, String fromPlan, String toPlan,
            BigDecimal amount, String message) {
        logRepository.save(SubscriptionLog.builder()
                .user(user).action(action).actor(actor)
                .subscriptionId(subscriptionId).invoiceId(invoiceId)
                .fromStatus(fromStatus).toStatus(toStatus)
                .fromPackage(fromPlan).toPackage(toPlan)
                .amount(amount)
                .message(message != null && message.length() > 500 ? message.substring(0, 500) : message)
                .createdAt(Utc.now())
                .build());
    }

    // Đẩy sự kiện xuống giao diện (kênh riêng /user/queue/subscription). Gửi sau
    // khi commit để client đọc đúng dữ liệu mới.
    public void push(Account user, String type, Long invoiceId, String status, String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("invoiceId", invoiceId);
        payload.put("status", status);
        payload.put("message", message);

        Runnable send = () -> {
            try {
                messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/subscription", payload);
            } catch (Exception e) {
                log.warn("Không đẩy được sự kiện gói dịch vụ cho user {}: {}", user.getId(), e.getMessage());
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }

    // Hạn của kỳ mới (UTC); gói trọn đời không có hạn
    public LocalDateTime periodEnd(ServicePackage plan, LocalDateTime startUtc) {
        return plan.getDurationDays() == null ? null : startUtc.plusDays(plan.getDurationDays());
    }

    public boolean isFree(ServicePackage plan) {
        return plan.getPrice() == null || plan.getPrice().signum() == 0;
    }

    public String displayName(Account user) {
        return userProfileRepository.findByAccountId(user.getId()).map(UserProfile::getFullName).orElse("bạn");
    }

    // Đồng bộ trường subscription_plan cũ trong hồ sơ (free / premium)
    public void syncProfilePlan(Account user, boolean paid) {
        userProfileRepository.findByAccountId(user.getId()).ifPresent(profile -> {
            profile.setSubscriptionPlan(
                    paid ? UserProfile.SubscriptionPlan.premium : UserProfile.SubscriptionPlan.free);
            userProfileRepository.save(profile);
        });
    }

    public String money(BigDecimal value) {
        return String.format("%,d", value.longValue()).replace(',', '.') + "đ";
    }
}