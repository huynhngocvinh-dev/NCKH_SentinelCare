package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.model.SubscriptionLog.Action;
import com.backend.SentinelCare.payment.PaymentGateway;
import com.backend.SentinelCare.payment.PaymentGateway.Notification;
import com.backend.SentinelCare.repository.InvoiceRepository;
import com.backend.SentinelCare.repository.SubscriptionRepository;
import com.backend.SentinelCare.util.Utc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class InvoiceSettlementService {

    public enum Result {
        OK, INVALID_SIGNATURE, ORDER_NOT_FOUND, AMOUNT_MISMATCH, FORBIDDEN, ALREADY_PROCESSED
    }

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentGateway gateway;
    private final SubscriptionSupport support;
    private final EmailService emailService;

    @Value("${payment.order-prefix:SC}")
    private String orderPrefix;

    // =====================================================================
    // WEBHOOK (IPN) VÀ URL QUAY VỀ TỪ VNPAY
    // =====================================================================
    @Transactional
    public Result handleNotification(Map<String, String> params, Long expectedUserId) {
        Notification notification = gateway.verifyNotification(params);
        if (!notification.signatureValid())
            return Result.INVALID_SIGNATURE;

        Invoice invoice = findInvoice(notification.txnRef());
        if (invoice == null)
            return Result.ORDER_NOT_FOUND;
        if (expectedUserId != null && !invoice.getUser().getId().equals(expectedUserId))
            return Result.FORBIDDEN;

        // Chống sửa số tiền: phải đúng số tiền của hóa đơn
        if (invoice.getAmount().longValue() != notification.amount()) {
            log.warn("Sai số tiền hóa đơn {}: cổng báo {}, hóa đơn {}",
                    invoice.getId(), notification.amount(), invoice.getAmount());
            return Result.AMOUNT_MISMATCH;
        }
        if (invoice.getStatus() == Invoice.Status.PAID)
            return Result.ALREADY_PROCESSED;

        if (!notification.success()) {
            recordFailure(invoice, notification);
            return Result.OK;
        }

        invoice.setGatewayTransactionId(notification.transactionNo());
        if (invoice.getType() == Invoice.Type.RENEWAL)
            completeRenewal(invoice);
        else
            completeActivation(invoice);
        return Result.OK;
    }

    private Invoice findInvoice(String txnRef) {
        if (txnRef == null)
            return null;
        Matcher matcher = Pattern.compile("^" + Pattern.quote(orderPrefix) + "(\\d+)A\\d+$").matcher(txnRef);
        if (!matcher.matches())
            return null;
        return invoiceRepository.findWithLockById(Long.valueOf(matcher.group(1))).orElse(null);
    }

    private void recordFailure(Invoice invoice, Notification notification) {
        String message = truncate(notification.message());
        invoice.setStatus(Invoice.Status.FAILED);
        invoice.setFailureCode(notification.responseCode());
        invoice.setFailureMessage(message);
        invoiceRepository.save(invoice);

        Long subscriptionId = invoice.getSubscription() == null ? null : invoice.getSubscription().getId();
        if (invoice.getType() == Invoice.Type.RENEWAL && subscriptionId != null) {
            subscriptionRepository.findById(subscriptionId).ifPresent(sub -> {
                sub.setLastPaymentError(message);
                subscriptionRepository.save(sub);
            });
        }
        support.audit(invoice.getUser(), Action.PAYMENT_FAILED, SubscriptionSupport.ACTOR_USER, subscriptionId,
                invoice.getId(), "PENDING", "FAILED", null, invoice.getPlan().getCode(), invoice.getAmount(), message);
        support.push(invoice.getUser(), "PAYMENT_FAILED", invoice.getId(), "FAILED", message);
    }

    // =====================================================================
    // THANH TOÁN LẦN ĐẦU / NÂNG GÓI / KHÔI PHỤC KHI ÂN HẠN
    // =====================================================================
    private void completeActivation(Invoice invoice) {
        activate(invoice, Utc.now());
    }

    // Nâng gói mà phần quy đổi đã đủ trả giá gói mới: kích hoạt ngay, không cần thu
    // tiền
    @Transactional
    public void activateWithoutPayment(Invoice invoice) {
        invoice.setGatewayTransactionId("CREDIT_" + invoice.getId());
        activate(invoice, Utc.now());
    }

    // Mỗi người dùng có đúng một bản ghi subscriptions
    private void activate(Invoice invoice, LocalDateTime now) {
        Account user = invoice.getUser();
        ServicePackage plan = invoice.getPlan();

        Subscription sub = subscriptionRepository.findWithLockByUserId(user.getId())
                .orElseGet(() -> Subscription.builder().user(user).build());
        String fromStatus = sub.getId() == null ? null : sub.getStatus().name();
        String fromPlan = sub.getPlan() == null ? null : sub.getPlan().getCode();

        sub.setPlan(plan);
        sub.setPendingPlan(null);
        sub.setStatus(Subscription.Status.ACTIVE);
        sub.setCurrentPeriodStart(now); // NOW() (UTC)
        sub.setCurrentPeriodEnd(support.periodEnd(plan, now)); // NOW() + chu kỳ; null nếu trọn đời
        sub.setCurrentPeriodAmount(plan.getPrice());
        sub.setAutoRenew(plan.getDurationDays() != null); // gói theo kỳ: bật gia hạn
        resetBillingState(sub);
        sub.setCancelReason(null);
        sub.setCancelFeedback(null);
        sub.setCanceledAt(null);
        sub = subscriptionRepository.save(sub);

        markPaid(invoice, sub, now, now);

        support.audit(user, Action.PAYMENT_SUCCESS, SubscriptionSupport.ACTOR_USER, sub.getId(), invoice.getId(),
                "PENDING", "PAID", null, plan.getCode(), invoice.getAmount(),
                "Thanh toán thành công qua VNPAY, mã giao dịch " + invoice.getGatewayTransactionId());
        support.audit(user, activationAction(invoice.getType()), SubscriptionSupport.ACTOR_USER, sub.getId(),
                invoice.getId(), fromStatus, "ACTIVE", fromPlan, plan.getCode(), invoice.getAmount(),
                "Kích hoạt gói " + plan.getName());

        support.syncProfilePlan(user, true);
        support.push(user, "SUBSCRIPTION_ACTIVATED", invoice.getId(), "PAID",
                "Gói " + plan.getName() + " đã được kích hoạt.");
    }

    private Action activationAction(Invoice.Type type) {
        return switch (type) {
            case UPGRADE -> Action.UPGRADED;
            case RECOVERY -> Action.GRACE_RECOVERED;
            default -> Action.SUBSCRIPTION_ACTIVATED;
        };
    }

    // =====================================================================
    // GIA HẠN THÀNH CÔNG
    // =====================================================================
    private void completeRenewal(Invoice invoice) {
        Subscription sub = subscriptionRepository.findWithLockById(invoice.getSubscription().getId()).orElseThrow();
        Account user = sub.getUser();
        ServicePackage plan = invoice.getPlan(); // gói được tính tiền kỳ này (có thể là gói hạ ở kỳ này)
        LocalDateTime now = Utc.now();

        boolean wasGrace = sub.getStatus() == Subscription.Status.GRACE_PERIOD;
        boolean early = sub.getStatus() == Subscription.Status.ACTIVE
                && sub.getCurrentPeriodEnd() != null && sub.getCurrentPeriodEnd().isAfter(now)
                && plan.getId().equals(sub.getPlan().getId());
        String fromPlan = sub.getPlan().getCode();
        LocalDateTime invoicePeriodStart = now;

        if (early) {
            // Gia hạn sớm: cộng nối vào cuối kỳ hiện tại, không mất ngày nào còn lại
            BigDecimal paidBefore = sub.getCurrentPeriodAmount() != null ? sub.getCurrentPeriodAmount()
                    : plan.getPrice();
            invoicePeriodStart = sub.getCurrentPeriodEnd();
            sub.setCurrentPeriodEnd(sub.getCurrentPeriodEnd().plusDays(plan.getDurationDays()));
            sub.setCurrentPeriodAmount(paidBefore.add(plan.getPrice()));
        } else {
            // Đến hạn hoặc đang ân hạn: kỳ mới tính từ NOW() (UTC)
            sub.setPlan(plan);
            sub.setPendingPlan(null);
            sub.setCurrentPeriodStart(now);
            sub.setCurrentPeriodEnd(support.periodEnd(plan, now));
            sub.setCurrentPeriodAmount(plan.getPrice());
        }
        sub.setStatus(Subscription.Status.ACTIVE);
        resetBillingState(sub);
        subscriptionRepository.save(sub);

        markPaid(invoice, sub, now, invoicePeriodStart);

        String until = sub.getCurrentPeriodEnd() == null ? "trọn đời"
                : Utc.toVietnam(sub.getCurrentPeriodEnd()).format(DATE_FMT);
        support.audit(user, Action.PAYMENT_SUCCESS, SubscriptionSupport.ACTOR_USER, sub.getId(), invoice.getId(),
                "PENDING", "PAID", null, plan.getCode(), invoice.getAmount(),
                "Thanh toán gia hạn thành công, mã giao dịch " + invoice.getGatewayTransactionId());
        support.audit(user, Action.RENEWED, SubscriptionSupport.ACTOR_USER, sub.getId(), invoice.getId(),
                wasGrace ? "GRACE_PERIOD" : "ACTIVE", "ACTIVE", fromPlan, plan.getCode(), invoice.getAmount(),
                "Gia hạn gói " + plan.getName() + " đến " + until);
        if (wasGrace) {
            support.audit(user, Action.GRACE_RECOVERED, SubscriptionSupport.ACTOR_USER, sub.getId(), invoice.getId(),
                    "GRACE_PERIOD", "ACTIVE", plan.getCode(), plan.getCode(), invoice.getAmount(),
                    "Gia hạn thành công trong thời gian ân hạn");
        }

        support.syncProfilePlan(user, true);
        emailService.sendRenewalSuccessEmail(user.getEmail(), support.displayName(user), plan.getName(),
                invoice.getAmount(), Utc.toVietnam(sub.getCurrentPeriodEnd()));
        support.push(user, "SUBSCRIPTION_RENEWED", invoice.getId(), "PAID",
                "Gia hạn gói " + plan.getName() + " thành công.");
    }

    // =====================================================================
    // HẾT HẠN -> HẠ CẤP VỀ GÓI FREE
    // =====================================================================
    @Transactional
    public void expire(Subscription sub, String reason) {
        if (sub.getStatus() == Subscription.Status.EXPIRED)
            return;

        Account user = sub.getUser();
        String fromStatus = sub.getStatus().name();
        sub.setStatus(Subscription.Status.EXPIRED);
        sub.setAutoRenew(false);
        sub.setGracePeriodEnd(null);
        sub.setPendingPlan(null);
        subscriptionRepository.save(sub);

        support.audit(user, Action.EXPIRED, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), null,
                fromStatus, "EXPIRED", sub.getPlan().getCode(), "FREEMIUM", null, reason + ". Chuyển về gói Miễn phí");
        support.syncProfilePlan(user, false);
        emailService.sendSubscriptionExpiredEmail(user.getEmail(), support.displayName(user), sub.getPlan().getName());
        support.push(user, "SUBSCRIPTION_EXPIRED", null, "EXPIRED", "Gói " + sub.getPlan().getName() + " đã hết hạn.");
    }

    // ---------------------------------------------------------------------
    private void resetBillingState(Subscription sub) {
        sub.setGracePeriodEnd(null);
        sub.setRetryCount(0);
        sub.setLastBillingAttemptAt(null);
        sub.setLastPaymentError(null);
        sub.setRenewalReminderSentAt(null);
    }

    private void markPaid(Invoice invoice, Subscription sub, LocalDateTime paidAt, LocalDateTime periodStart) {
        invoice.setSubscription(sub);
        invoice.setStatus(Invoice.Status.PAID);
        invoice.setPaidAt(paidAt);
        invoice.setPeriodStart(periodStart);
        invoice.setPeriodEnd(sub.getCurrentPeriodEnd());
        invoice.setFailureCode(null);
        invoice.setFailureMessage(null);
        invoiceRepository.save(invoice);
    }

    private String truncate(String message) {
        if (message == null)
            return null;
        return message.length() > 250 ? message.substring(0, 250) : message;
    }
}