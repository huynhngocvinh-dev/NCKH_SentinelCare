package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.model.SubscriptionLog.Action;
import com.backend.SentinelCare.payment.PaymentGateway;
import com.backend.SentinelCare.payment.PaymentGateway.ChargeResult;
import com.backend.SentinelCare.payment.TokenCipher;
import com.backend.SentinelCare.repository.InvoiceRepository;
import com.backend.SentinelCare.repository.SubscriptionRepository;
import com.backend.SentinelCare.util.Utc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubscriptionBillingService {

    private record Attempt(Long invoiceId, String orderId, BigDecimal amount, String orderInfo,
            String partnerClientId, String token, boolean verifyPreviousOnly) {
    }

    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentGateway gateway;
    private final TokenCipher tokenCipher;
    private final InvoiceSettlementService settlement;
    private final SubscriptionSupport support;
    private final EmailService emailService;
    private final PlatformTransactionManager transactionManager;

    @Value("${billing.retry-hours:24}")
    private int retryHours;

    @Value("${billing.reminder-days:3}")
    private int reminderDays;

    @Value("${billing.pending-invoice-timeout-minutes:30}")
    private int pendingTimeoutMinutes;

    @Value("${payment.order-prefix:SC}")
    private String orderPrefix;

    @Value("${app.public-base-url:http://localhost:8080}")
    private String publicBaseUrl;

    // =====================================================================
    // GIA HẠN TỰ ĐỘNG (Merchant-Initiated Transaction)
    // =====================================================================
    public void processDue(Long subscriptionId) {
        Attempt attempt;
        try {
            attempt = new TransactionTemplate(transactionManager).execute(status -> prepareAttempt(subscriptionId));
        } catch (DataIntegrityViolationException e) {
            // Hai tiến trình cùng tạo hóa đơn kỳ này: ràng buộc UNIQUE(idempotency_key)
            // chặn, bỏ qua
            log.info("Hóa đơn gia hạn của gói {} vừa được tiến trình khác tạo, bỏ qua.", subscriptionId);
            return;
        }
        if (attempt == null)
            return;

        // Gọi cổng ngoài transaction (không giữ khóa CSDL khi chờ bên thứ ba)
        ChargeResult result = attempt.verifyPreviousOnly()
                ? gateway.queryTransaction(attempt.orderId())
                : gateway.chargeWithToken(attempt.orderId(), attempt.amount(), attempt.orderInfo(),
                        attempt.partnerClientId(), attempt.token(),
                        publicBaseUrl + "/api/v1/payments/momo/ipn");

        switch (result.status()) {
            case SUCCESS -> settlement.settleRenewalSuccess(attempt.invoiceId(), result.transactionId());
            case FAILED -> settlement.settleRenewalFailure(attempt.invoiceId(), String.valueOf(result.resultCode()),
                    result.message());
            case REAUTH_REQUIRED ->
                settlement.settleRenewalFailure(attempt.invoiceId(), String.valueOf(result.resultCode()),
                        result.message() + " Vui lòng đổi phương thức thanh toán.");
            // Chưa rõ kết quả: giữ PENDING. Lần chạy sau đối soát bằng queryTransaction,
            // TUYỆT ĐỐI không trừ lần hai.
            case UNKNOWN -> log.warn("Chưa rõ kết quả trừ tiền hóa đơn {}: {}", attempt.invoiceId(), result.message());
        }
    }

    private Attempt prepareAttempt(Long subscriptionId) {
        LocalDateTime now = Utc.now();
        Subscription sub = subscriptionRepository.findWithLockById(subscriptionId).orElse(null);
        if (sub == null)
            return null;

        UserPaymentMethod method = sub.getPaymentMethod();
        boolean canCharge = sub.isAutoRenew() && method != null
                && method.getStatus() == UserPaymentMethod.Status.ACTIVE;

        if (sub.getStatus() == Subscription.Status.ACTIVE) {
            if (sub.getCurrentPeriodEnd() == null || sub.getCurrentPeriodEnd().isAfter(now))
                return null;
            if (!canCharge) {
                // current_period_end <= NOW() nhưng auto_renew = FALSE: KHÔNG gọi trừ tiền, hạ
                // về gói Free
                settlement.expire(sub, "Hết chu kỳ thanh toán và không bật tự động gia hạn");
                return null;
            }
        } else if (sub.getStatus() == Subscription.Status.GRACE_PERIOD) {
            if (sub.getGracePeriodEnd() == null || !sub.getGracePeriodEnd().isAfter(now) || !canCharge) {
                settlement.expire(sub, "Hết thời gian ân hạn mà thanh toán chưa thành công");
                return null;
            }
            // Thử lại sau mỗi 24 giờ
            if (sub.getLastBillingAttemptAt() != null
                    && sub.getLastBillingAttemptAt().isAfter(now.minusHours(retryHours))) {
                return null;
            }
        } else {
            return null;
        }

        // Hóa đơn của kỳ này, khóa idempotency:
        // RENEW_{subscription_id}_{period_end_date UTC}
        ServicePackage next = sub.getPendingPlan() != null ? sub.getPendingPlan() : sub.getPlan();
        String key = "RENEW_" + sub.getId() + "_"
                + sub.getCurrentPeriodEnd().toLocalDate().format(DateTimeFormatter.BASIC_ISO_DATE);

        Invoice invoice = invoiceRepository.findByIdempotencyKey(key).orElse(null);
        if (invoice == null) {
            invoice = invoiceRepository.saveAndFlush(Invoice.builder()
                    .user(sub.getUser()).subscription(sub).plan(next).type(Invoice.Type.RENEWAL)
                    .status(Invoice.Status.PENDING)
                    .amount(next.getPrice()).listPrice(next.getPrice()).prorationCredit(BigDecimal.ZERO)
                    .methodType("TOKEN").paymentMethod(method).partnerClientId(method.getPartnerClientId())
                    .idempotencyKey(key).attemptCount(0)
                    .build());
        }
        if (invoice.getStatus() == Invoice.Status.PAID)
            return null; // đã thu rồi (cron chạy lần hai)

        int attempts = invoice.getAttemptCount() == null ? 0 : invoice.getAttemptCount();
        boolean previousOutcomeUnknown = invoice.getStatus() == Invoice.Status.PENDING && attempts > 0;
        if (previousOutcomeUnknown && invoice.getLastAttemptAt() != null
                && invoice.getLastAttemptAt().isAfter(now.minusMinutes(15))) {
            return null; // lần thử trước vẫn đang xử lý
        }
        if (!previousOutcomeUnknown) {
            attempts += 1;
            invoice.setAttemptCount(attempts);
            invoice.setGatewayOrderId(orderPrefix + invoice.getId() + "A" + attempts);
        }
        invoice.setStatus(Invoice.Status.PENDING);
        invoice.setLastAttemptAt(now);
        invoiceRepository.save(invoice);

        sub.setLastBillingAttemptAt(now);
        subscriptionRepository.save(sub);

        return new Attempt(invoice.getId(), invoice.getGatewayOrderId(), invoice.getAmount(),
                "Gia han goi " + next.getName(), method.getPartnerClientId(),
                tokenCipher.decrypt(method.getTokenEncrypted()), previousOutcomeUnknown);
    }

    // =====================================================================
    // EMAIL NHẮC TRƯỚC KHI GIA HẠN / HẾT HẠN
    // =====================================================================
    @Transactional
    public void sendReminder(Long subscriptionId) {
        LocalDateTime now = Utc.now();
        Subscription sub = subscriptionRepository.findWithLockById(subscriptionId).orElse(null);
        if (sub == null || sub.getStatus() != Subscription.Status.ACTIVE || sub.getCurrentPeriodEnd() == null)
            return;
        if (!sub.getCurrentPeriodEnd().isAfter(now) || sub.getCurrentPeriodEnd().isAfter(now.plusDays(reminderDays)))
            return;
        if (sub.getRenewalReminderSentAt() != null
                && !sub.getRenewalReminderSentAt().isBefore(sub.getCurrentPeriodStart()))
            return;

        Account user = sub.getUser();
        ServicePackage next = sub.getPendingPlan() != null ? sub.getPendingPlan() : sub.getPlan();
        boolean willRenew = sub.isAutoRenew() && sub.getPaymentMethod() != null
                && sub.getPaymentMethod().getStatus() == UserPaymentMethod.Status.ACTIVE;

        emailService.sendRenewalReminderEmail(user.getEmail(), support.displayName(user), sub.getPlan().getName(),
                next.getName(), next.getPrice(), Utc.toVietnam(sub.getCurrentPeriodEnd()), willRenew);

        sub.setRenewalReminderSentAt(now);
        subscriptionRepository.save(sub);
        support.audit(user, Action.RENEWAL_REMINDER_SENT, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), null,
                "ACTIVE", "ACTIVE", sub.getPlan().getCode(), next.getCode(), willRenew ? next.getPrice() : null,
                "Gửi email nhắc " + (willRenew ? "gia hạn" : "hết hạn") + " trước kỳ thanh toán");
    }

    // =====================================================================
    // DỌN HÓA ĐƠN NGƯỜI DÙNG BỎ DỞ (đóng trang MoMo giữa chừng)
    // =====================================================================
    @Transactional
    public int cancelStaleInvoices() {
        LocalDateTime cutoff = Utc.now().minusMinutes(pendingTimeoutMinutes);
        List<Invoice> stale = invoiceRepository.findByStatusAndTypeInAndCreatedAtBefore(
                Invoice.Status.PENDING, List.of(Invoice.Type.INITIAL, Invoice.Type.UPGRADE, Invoice.Type.RECOVERY),
                cutoff);
        for (Invoice invoice : stale) {
            invoice.setStatus(Invoice.Status.CANCELED);
            invoice.setFailureMessage("Quá thời gian thanh toán, giao dịch bị hủy.");
            invoiceRepository.save(invoice);
            support.audit(invoice.getUser(), Action.PAYMENT_FAILED, SubscriptionSupport.ACTOR_SYSTEM, null,
                    invoice.getId(),
                    "PENDING", "CANCELED", null, invoice.getPlan().getCode(), invoice.getAmount(),
                    invoice.getFailureMessage());
        }
        return stale.size();
    }
}