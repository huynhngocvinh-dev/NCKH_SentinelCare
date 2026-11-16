package com.backend.SentinelCare.service;

import com.backend.SentinelCare.repository.SubscriptionRepository;
import com.backend.SentinelCare.util.Utc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionScheduler {

    private final SubscriptionBillingService billingService;
    private final SubscriptionRepository subscriptionRepository;

    @Value("${billing.reminder-days:3}")
    private int reminderDays;

    // Quét gói đến hạn: current_period_end <= NOW() (UTC). Hóa đơn có
    // idempotency_key nên chạy lặp vẫn an toàn.
    @Scheduled(cron = "${billing.cron.renewal:0 0 * * * *}", zone = "Asia/Ho_Chi_Minh")
    public void processRenewals() {
        List<Long> ids = subscriptionRepository.findDueIds(Utc.now());
        if (!ids.isEmpty()) {
            log.info("[BILLING] {} goi den han can xu ly", ids.size());
        }
        for (Long id : ids) {
            try {
                billingService.processDue(id);
            } catch (Exception e) {
                log.error("[BILLING] Loi xu ly goi {}", id, e);
            }
        }
    }

    // Email nhắc trước 3 ngày
    @Scheduled(cron = "${billing.cron.reminder:0 0 9 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void sendRenewalReminders() {
        LocalDateTime now = Utc.now();
        List<Long> ids = subscriptionRepository.findIdsNeedingReminder(now, now.plusDays(reminderDays));
        for (Long id : ids) {
            try {
                billingService.sendReminder(id);
            } catch (Exception e) {
                log.error("[BILLING] Loi gui nhac gia han cho goi {}", id, e);
            }
        }
    }

    // Hóa đơn người dùng bỏ dở
    @Scheduled(cron = "${billing.cron.pending-invoices:0 */15 * * * *}", zone = "Asia/Ho_Chi_Minh")
    public void cancelStalePendingInvoices() {
        try {
            int count = billingService.cancelStaleInvoices();
            if (count > 0)
                log.info("[BILLING] Da huy {} hoa don bo do", count);
        } catch (Exception e) {
            log.error("[BILLING] Loi don hoa don treo", e);
        }
    }
}