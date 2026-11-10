package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.model.SubscriptionLog.Action;
import com.backend.SentinelCare.repository.InvoiceRepository;
import com.backend.SentinelCare.repository.SubscriptionRepository;
import com.backend.SentinelCare.util.Utc;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionBillingService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final List<Invoice.Type> USER_INITIATED_TYPES = List.of(Invoice.Type.INITIAL, Invoice.Type.UPGRADE,
            Invoice.Type.RECOVERY);

    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceSettlementService settlement;
    private final SubscriptionSupport support;
    private final EmailService emailService;

    @Value("${billing.grace-days:3}")
    private int graceDays;

    @Value("${billing.notice-hours:24}")
    private int noticeHours;

    @Value("${billing.reminder-days:3}")
    private int reminderDays;

    @Value("${billing.pending-invoice-timeout-minutes:30}")
    private int pendingTimeoutMinutes;

    // =====================================================================
    // CRON: gói đến hạn (current_period_end <= NOW() UTC) và gói đang ân hạn
    // =====================================================================
    @Transactional
    public void processDue(Long subscriptionId) {
        LocalDateTime now = Utc.now();
        Subscription sub = subscriptionRepository.findWithLockById(subscriptionId).orElse(null);
        if (sub == null)
            return;

        switch (sub.getStatus()) {
            case ACTIVE -> processActive(sub, now);
            case GRACE_PERIOD -> processGracePeriod(sub, now);
        }
    }

    private void processActive(Subscription sub, LocalDateTime now) {
        if (sub.getCurrentPeriodEnd() == null || sub.getCurrentPeriodEnd().isAfter(now))
            return;

        if (!sub.isAutoRenew()) {
            // current_period_end <= NOW() nhưng auto_renew = FALSE: hạ về gói Free, không
            // ân hạn
            settlement.expire(sub, "Hết chu kỳ thanh toán và không bật gia hạn");
            return;
        }
        enterGracePeriod(sub, now);
    }

    private void processGracePeriod(Subscription sub, LocalDateTime now) {
        boolean graceOver = sub.getGracePeriodEnd() == null || !sub.getGracePeriodEnd().isAfter(now);
        if (graceOver || !sub.isAutoRenew()) {
            settlement.expire(sub, "Hết thời gian ân hạn " + graceDays + " ngày mà chưa gia hạn");
            return;
        }
        boolean noticedRecently = sub.getLastBillingAttemptAt() != null
                && sub.getLastBillingAttemptAt().isAfter(now.minusHours(noticeHours));
        if (!noticedRecently) {
            sendRenewalNotice(sub, now, false);
        }
    }

    // Đến hạn: vào ân hạn (vẫn giữ quyền truy cập), tạo hóa đơn kỳ này và thông báo
    // gia hạn
    private void enterGracePeriod(Subscription sub, LocalDateTime now) {
        ensureRenewalInvoice(sub, nextPlanOf(sub));

        LocalDateTime graceEnd = sub.getCurrentPeriodEnd().plusDays(graceDays);
        if (graceEnd.isBefore(now.plusDays(1)))
            graceEnd = now.plusDays(1); // cron chậm: vẫn cho tối thiểu 1 ngày

        sub.setStatus(Subscription.Status.GRACE_PERIOD);
        sub.setGracePeriodEnd(graceEnd);
        subscriptionRepository.save(sub);

        support.audit(sub.getUser(), Action.GRACE_STARTED, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), null,
                "ACTIVE", "GRACE_PERIOD", sub.getPlan().getCode(), sub.getPlan().getCode(), null,
                "Đến kỳ gia hạn. Ân hạn đến " + Utc.toVietnam(graceEnd).format(DATE_FMT)
                        + ", vẫn giữ nguyên quyền lợi");
        sendRenewalNotice(sub, now, true);
    }

    private void sendRenewalNotice(Subscription sub, LocalDateTime now, boolean firstNotice) {
        Account user = sub.getUser();
        ServicePackage next = nextPlanOf(sub);

        emailService.sendRenewalDueEmail(user.getEmail(), support.displayName(user), next.getName(),
                next.getPrice(), Utc.toVietnam(sub.getGracePeriodEnd()));

        int notices = (sub.getRetryCount() == null ? 0 : sub.getRetryCount()) + 1;
        sub.setRetryCount(notices);
        sub.setLastBillingAttemptAt(now); // mốc nhắc gần nhất
        subscriptionRepository.save(sub);

        if (!firstNotice) {
            support.audit(user, Action.RENEWAL_REMINDER_SENT, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), null,
                    "GRACE_PERIOD", "GRACE_PERIOD", sub.getPlan().getCode(), next.getCode(), next.getPrice(),
                    "Nhắc gia hạn lần " + notices + " (ân hạn đến "
                            + Utc.toVietnam(sub.getGracePeriodEnd()).format(DATE_FMT) + ")");
        }
        support.push(user, "RENEWAL_DUE", null, "GRACE_PERIOD", "Gói " + next.getName() + " đã đến kỳ gia hạn.");
    }

    /**
     * Hóa đơn gia hạn của kỳ này. Khóa idempotency:
     * RENEW_{subscription_id}_{period_end_date UTC}.
     * Dù cron chạy hai lần hay người dùng bấm gia hạn nhiều lần, mỗi kỳ chỉ có MỘT
     * hóa đơn.
     */
    @Transactional
    public Invoice ensureRenewalInvoice(Subscription sub, ServicePackage plan) {
        String key = "RENEW_" + sub.getId() + "_"
                + sub.getCurrentPeriodEnd().toLocalDate().format(DateTimeFormatter.BASIC_ISO_DATE);

        return invoiceRepository.findByIdempotencyKey(key).orElseGet(() -> invoiceRepository.save(Invoice.builder()
                .user(sub.getUser()).subscription(sub).plan(plan).type(Invoice.Type.RENEWAL)
                .status(Invoice.Status.PENDING)
                .amount(plan.getPrice()).listPrice(plan.getPrice()).prorationCredit(BigDecimal.ZERO)
                .idempotencyKey(key).attemptCount(0)
                .build()));
    }

    // =====================================================================
    // EMAIL NHẮC TRƯỚC KỲ GIA HẠN / HẾT HẠN
    // =====================================================================
    @Transactional
    public void sendReminder(Long subscriptionId) {
        LocalDateTime now = Utc.now();
        Subscription sub = subscriptionRepository.findWithLockById(subscriptionId).orElse(null);
        if (sub == null || !isReminderDue(sub, now))
            return;

        Account user = sub.getUser();
        ServicePackage next = nextPlanOf(sub);
        emailService.sendRenewalReminderEmail(user.getEmail(), support.displayName(user), sub.getPlan().getName(),
                next.getName(), next.getPrice(), Utc.toVietnam(sub.getCurrentPeriodEnd()), sub.isAutoRenew());

        sub.setRenewalReminderSentAt(now);
        subscriptionRepository.save(sub);
        support.audit(user, Action.RENEWAL_REMINDER_SENT, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), null,
                "ACTIVE", "ACTIVE", sub.getPlan().getCode(), next.getCode(), sub.isAutoRenew() ? next.getPrice() : null,
                "Gửi email nhắc " + (sub.isAutoRenew() ? "gia hạn" : "hết hạn") + " trước kỳ thanh toán");
    }

    // Còn trong khoảng nhắc và chưa nhắc trong kỳ này
    private boolean isReminderDue(Subscription sub, LocalDateTime now) {
        if (sub.getStatus() != Subscription.Status.ACTIVE || sub.getCurrentPeriodEnd() == null)
            return false;
        boolean inWindow = sub.getCurrentPeriodEnd().isAfter(now)
                && !sub.getCurrentPeriodEnd().isAfter(now.plusDays(reminderDays));
        boolean alreadySent = sub.getRenewalReminderSentAt() != null
                && !sub.getRenewalReminderSentAt().isBefore(sub.getCurrentPeriodStart());
        return inWindow && !alreadySent;
    }

    // =====================================================================
    // DỌN HÓA ĐƠN NGƯỜI DÙNG BỎ DỞ (đóng trang VNPAY giữa chừng). Hóa đơn gia hạn
    // được giữ lại.
    // =====================================================================
    @Transactional
    public int cancelStaleInvoices() {
        LocalDateTime cutoff = Utc.now().minusMinutes(pendingTimeoutMinutes);
        List<Invoice> stale = invoiceRepository.findByStatusAndTypeInAndCreatedAtBefore(
                Invoice.Status.PENDING, USER_INITIATED_TYPES, cutoff);

        for (Invoice invoice : stale) {
            invoice.setStatus(Invoice.Status.CANCELED);
            invoice.setFailureMessage("Quá thời gian thanh toán, giao dịch bị hủy.");
            invoiceRepository.save(invoice);
            support.audit(invoice.getUser(), Action.PAYMENT_FAILED, SubscriptionSupport.ACTOR_SYSTEM, null,
                    invoice.getId(), "PENDING", "CANCELED", null, invoice.getPlan().getCode(),
                    invoice.getAmount(), invoice.getFailureMessage());
        }
        return stale.size();
    }

    // Gói được tính tiền ở kỳ tới: gói hạ đã lên lịch, nếu không thì gói hiện tại
    private ServicePackage nextPlanOf(Subscription sub) {
        return sub.getPendingPlan() != null ? sub.getPendingPlan() : sub.getPlan();
    }
}