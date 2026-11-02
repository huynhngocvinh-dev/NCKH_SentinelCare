package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.model.SubscriptionLog.Action;
import com.backend.SentinelCare.payment.PaymentGateway;
import com.backend.SentinelCare.payment.PaymentGateway.Notification;
import com.backend.SentinelCare.payment.PaymentGateway.TokenInfo;
import com.backend.SentinelCare.payment.TokenCipher;
import com.backend.SentinelCare.repository.InvoiceRepository;
import com.backend.SentinelCare.repository.SubscriptionRepository;
import com.backend.SentinelCare.repository.UserPaymentMethodRepository;
import com.backend.SentinelCare.util.Utc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class InvoiceSettlementService {

    public enum Result {
        OK, INVALID_SIGNATURE, ORDER_NOT_FOUND, AMOUNT_MISMATCH, FORBIDDEN, ALREADY_PROCESSED
    }

    private static final Set<String> INVALID_TOKEN_CODES = Set.of("2001", "2007", "2012");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserPaymentMethodRepository paymentMethodRepository;
    private final PaymentGateway gateway;
    private final TokenCipher tokenCipher;
    private final SubscriptionSupport support;
    private final EmailService emailService;

    @Value("${billing.grace-days:3}")
    private int graceDays;

    @Value("${payment.order-prefix:SC}")
    private String orderPrefix;

    // =====================================================================
    // 1. WEBHOOK (IPN) VÀ URL QUAY VỀ TỪ MOMO
    // Xử lý một lần duy nhất: MoMo có thể gửi lặp, người dùng có thể F5 trang kết
    // quả.
    // =====================================================================
    @Transactional
    public Result handleNotification(Map<String, String> params, Long expectedUserId) {
        Notification n = gateway.verifyNotification(params);
        if (!n.signatureValid()) {
            return Result.INVALID_SIGNATURE;
        }

        Long invoiceId = parseInvoiceId(n.orderId());
        Invoice invoice = invoiceId == null ? null : invoiceRepository.findWithLockById(invoiceId).orElse(null);
        if (invoice == null)
            return Result.ORDER_NOT_FOUND;

        if (expectedUserId != null && !invoice.getUser().getId().equals(expectedUserId)) {
            return Result.FORBIDDEN;
        }
        // Chống sửa số tiền: phải đúng số tiền của hóa đơn
        if (invoice.getAmount().longValue() != n.amount()) {
            log.warn("Sai số tiền hóa đơn {}: cổng báo {}, hóa đơn {}", invoice.getId(), n.amount(),
                    invoice.getAmount());
            return Result.AMOUNT_MISMATCH;
        }
        if (invoice.getStatus() == Invoice.Status.PAID)
            return Result.ALREADY_PROCESSED;
        if (!n.finalResult())
            return Result.OK; // đang xử lý: chờ thông báo kết quả cuối

        boolean renewal = invoice.getType() == Invoice.Type.RENEWAL;
        if (!n.success()) {
            if (renewal)
                applyRenewalFailure(invoice, String.valueOf(n.resultCode()), n.message());
            else
                markFailed(invoice, String.valueOf(n.resultCode()), n.message());
            return Result.OK;
        }

        if (renewal)
            applyRenewalSuccess(invoice, n.transactionId());
        else
            activateFromPayment(invoice, n);
        return Result.OK;
    }

    private void markFailed(Invoice invoice, String code, String message) {
        invoice.setStatus(Invoice.Status.FAILED);
        invoice.setFailureCode(code);
        invoice.setFailureMessage(truncate(message));
        invoiceRepository.save(invoice);

        Account user = invoice.getUser();
        support.audit(user, Action.PAYMENT_FAILED, SubscriptionSupport.ACTOR_USER, null, invoice.getId(),
                "PENDING", "FAILED", null, invoice.getPlan().getCode(), invoice.getAmount(), message);
        support.push(user, "PAYMENT_FAILED", invoice.getId(), "FAILED", message);
    }

    // ---------------------------------------------------------------------
    // Thanh toán lần đầu / nâng gói / thanh toán lại khi ân hạn thành công
    // ---------------------------------------------------------------------
    private void activateFromPayment(Invoice invoice, Notification n) {
        invoice.setGatewayTransactionId(n.transactionId());

        UserPaymentMethod method = null;
        boolean wantsAutoRenew = invoice.getPlan().getDurationDays() != null
                && Boolean.TRUE.equals(invoice.getAutoRenewConsent());
        if (wantsAutoRenew) {
            method = tryStorePaymentMethod(invoice, n);
        }
        applyActivation(invoice, method, Utc.now());
    }

    // Lấy Payment Token từ MoMo rồi lưu (đã mã hóa). Thanh toán đã thành công nên
    // nếu bước này lỗi
    // vẫn kích hoạt gói, chỉ là chưa bật được tự động gia hạn.
    private UserPaymentMethod tryStorePaymentMethod(Invoice invoice, Notification n) {
        Account user = invoice.getUser();
        try {
            String partnerClientId = invoice.getPartnerClientId();
            String callbackToken = n.callbackToken();
            if (callbackToken == null || callbackToken.isBlank()) {
                callbackToken = gateway.queryCallbackToken(n.orderId(), partnerClientId);
            }
            if (callbackToken == null || callbackToken.isBlank()) {
                throw new IllegalStateException(
                        "Không nhận được mã liên kết (người dùng có thể đã không lưu phương thức)");
            }

            boolean card = "MOMO_CARD".equals(invoice.getMethodType());
            TokenInfo token = gateway.bindToken(callbackToken, n.orderId(), partnerClientId, card ? "CARD" : "WALLET");

            // Chỉ một phương thức mặc định
            paymentMethodRepository
                    .findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), UserPaymentMethod.Status.ACTIVE)
                    .forEach(old -> {
                        old.setDefaultMethod(false);
                        paymentMethodRepository.save(old);
                    });

            String brand = token.brand() == null ? "MOMO" : token.brand().toUpperCase();
            String label = (card ? brand : "Ví MoMo") + (token.last4().isBlank() ? "" : " •••• " + token.last4());

            UserPaymentMethod method = paymentMethodRepository.save(UserPaymentMethod.builder()
                    .user(user)
                    .type(card ? UserPaymentMethod.Type.CARD : UserPaymentMethod.Type.WALLET)
                    .status(UserPaymentMethod.Status.ACTIVE)
                    .tokenEncrypted(tokenCipher.encrypt(token.value()))
                    .partnerClientId(partnerClientId)
                    .bindOrderId(n.orderId())
                    .brand(brand)
                    .last4(token.last4())
                    .displayName(label)
                    .defaultMethod(true)
                    .build());

            support.audit(user, Action.PAYMENT_METHOD_ADDED, SubscriptionSupport.ACTOR_USER, null, invoice.getId(),
                    null, "ACTIVE", null, invoice.getPlan().getCode(), null,
                    "Liên kết " + label + " để tự động gia hạn");
            return method;
        } catch (Exception e) {
            log.error("Thanh toán đơn {} thành công nhưng chưa lưu được phương thức tự động gia hạn: {}",
                    invoice.getId(), e.getMessage());
            support.audit(user, Action.AUTO_RENEW_DISABLED, SubscriptionSupport.ACTOR_SYSTEM, null, invoice.getId(),
                    null, null, null, invoice.getPlan().getCode(), null,
                    "Thanh toán thành công nhưng chưa bật được tự động gia hạn: " + e.getMessage());
            return null;
        }
    }

    // Tạo hoặc cập nhật bản ghi subscriptions của người dùng (mỗi người một bản
    // ghi)
    private Subscription applyActivation(Invoice invoice, UserPaymentMethod newMethod, LocalDateTime now) {
        Account user = invoice.getUser();
        ServicePackage plan = invoice.getPlan();

        Subscription sub = subscriptionRepository.findWithLockByUserId(user.getId())
                .orElseGet(() -> Subscription.builder().user(user).build());
        String fromStatus = sub.getId() == null ? null : sub.getStatus().name();
        String fromPlan = sub.getPlan() == null ? null : sub.getPlan().getCode();

        boolean recurring = plan.getDurationDays() != null;
        UserPaymentMethod existing = sub.getPaymentMethod();
        boolean existingUsable = existing != null && existing.getStatus() == UserPaymentMethod.Status.ACTIVE;

        UserPaymentMethod effective = newMethod != null ? newMethod : (existingUsable ? existing : null);
        boolean autoRenew = recurring && effective != null
                && (newMethod != null ? Boolean.TRUE.equals(invoice.getAutoRenewConsent()) : sub.isAutoRenew());

        sub.setPlan(plan);
        sub.setPendingPlan(null);
        sub.setStatus(Subscription.Status.ACTIVE);
        sub.setCurrentPeriodStart(now); // NOW() (UTC)
        sub.setCurrentPeriodEnd(support.periodEnd(plan, now)); // NOW() + 30 ngày / 1 năm, null nếu trọn đời
        sub.setCurrentPeriodAmount(plan.getPrice());
        sub.setAutoRenew(autoRenew); // TRUE khi đã liên kết thành công
        sub.setPaymentMethod(effective);
        sub.setGracePeriodEnd(null);
        sub.setRetryCount(0);
        sub.setLastPaymentError(null);
        sub.setRenewalReminderSentAt(null);
        sub.setCancelReason(null);
        sub.setCancelFeedback(null);
        sub.setCanceledAt(null);
        sub = subscriptionRepository.save(sub);

        invoice.setSubscription(sub);
        invoice.setPaymentMethod(effective);
        invoice.setStatus(Invoice.Status.PAID);
        invoice.setPaidAt(now);
        invoice.setPeriodStart(now);
        invoice.setPeriodEnd(sub.getCurrentPeriodEnd());
        invoice.setFailureCode(null);
        invoice.setFailureMessage(null);
        invoiceRepository.save(invoice);

        support.audit(user, Action.PAYMENT_SUCCESS, SubscriptionSupport.ACTOR_USER, sub.getId(), invoice.getId(),
                "PENDING", "PAID", null, plan.getCode(), invoice.getAmount(),
                "Thanh toán thành công qua MoMo, mã giao dịch " + invoice.getGatewayTransactionId());

        Action action = switch (invoice.getType()) {
            case UPGRADE -> Action.UPGRADED;
            case RECOVERY -> Action.GRACE_RECOVERED;
            default -> Action.SUBSCRIPTION_ACTIVATED;
        };
        support.audit(user, action, SubscriptionSupport.ACTOR_USER, sub.getId(), invoice.getId(),
                fromStatus, "ACTIVE", fromPlan, plan.getCode(), invoice.getAmount(),
                "Kích hoạt gói " + plan.getName()
                        + (autoRenew ? ", đã bật tự động gia hạn" : ", chưa bật tự động gia hạn"));

        support.syncProfilePlan(user, true);
        support.push(user, "SUBSCRIPTION_ACTIVATED", invoice.getId(), "PAID",
                autoRenew ? "Gói " + plan.getName() + " đã được kích hoạt."
                        : "Gói " + plan.getName() + " đã kích hoạt nhưng chưa bật được tự động gia hạn.");
        return sub;
    }

    // Nâng gói mà phần quy đổi đã đủ trả giá gói mới: không cần thu tiền, giữ
    // phương thức hiện có
    @Transactional
    public void activateWithoutPayment(Invoice invoice) {
        invoice.setGatewayTransactionId("CREDIT_" + invoice.getId());
        applyActivation(invoice, null, Utc.now());
    }

    // =====================================================================
    // 2. GIA HẠN TỰ ĐỘNG (SubscriptionBillingService gọi sau khi trừ tiền ngầm)
    // =====================================================================
    @Transactional
    public void settleRenewalSuccess(Long invoiceId, String transactionId) {
        Invoice invoice = invoiceRepository.findWithLockById(invoiceId).orElse(null);
        if (invoice == null || invoice.getStatus() == Invoice.Status.PAID)
            return; // đã xử lý (idempotent)
        applyRenewalSuccess(invoice, transactionId);
    }

    @Transactional
    public void settleRenewalFailure(Long invoiceId, String code, String message) {
        Invoice invoice = invoiceRepository.findWithLockById(invoiceId).orElse(null);
        if (invoice == null || invoice.getStatus() == Invoice.Status.PAID)
            return;
        applyRenewalFailure(invoice, code, message);
    }

    private void applyRenewalSuccess(Invoice invoice, String transactionId) {
        Subscription sub = subscriptionRepository.findWithLockById(invoice.getSubscription().getId()).orElseThrow();
        Account user = sub.getUser();
        ServicePackage plan = invoice.getPlan(); // gói được tính tiền (có thể là gói hạ ở kỳ này)
        LocalDateTime now = Utc.now();
        boolean wasGrace = sub.getStatus() == Subscription.Status.GRACE_PERIOD;
        String fromPlan = sub.getPlan().getCode();

        sub.setPlan(plan);
        sub.setPendingPlan(null);
        sub.setStatus(Subscription.Status.ACTIVE);
        sub.setCurrentPeriodStart(now); // kỳ mới: NOW() (UTC)
        sub.setCurrentPeriodEnd(support.periodEnd(plan, now)); // NOW() + 30 ngày / 1 năm
        sub.setCurrentPeriodAmount(plan.getPrice());
        sub.setGracePeriodEnd(null);
        sub.setRetryCount(0);
        sub.setLastPaymentError(null);
        sub.setRenewalReminderSentAt(null);
        subscriptionRepository.save(sub);

        invoice.setStatus(Invoice.Status.PAID);
        invoice.setPaidAt(now);
        invoice.setGatewayTransactionId(transactionId);
        invoice.setPeriodStart(now);
        invoice.setPeriodEnd(sub.getCurrentPeriodEnd());
        invoice.setFailureCode(null);
        invoice.setFailureMessage(null);
        invoiceRepository.save(invoice);

        support.audit(user, Action.PAYMENT_SUCCESS, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), invoice.getId(),
                "PENDING", "PAID", null, plan.getCode(), invoice.getAmount(),
                "Trừ tiền tự động thành công, mã giao dịch " + transactionId);
        support.audit(user, Action.RENEWED, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), invoice.getId(),
                wasGrace ? "GRACE_PERIOD" : "ACTIVE", "ACTIVE", fromPlan, plan.getCode(), invoice.getAmount(),
                "Gia hạn gói " + plan.getName() + " đến "
                        + (sub.getCurrentPeriodEnd() == null ? "trọn đời"
                                : Utc.toVietnam(sub.getCurrentPeriodEnd()).format(DATE_FMT)));
        if (wasGrace) {
            support.audit(user, Action.GRACE_RECOVERED, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), invoice.getId(),
                    "GRACE_PERIOD", "ACTIVE", plan.getCode(), plan.getCode(), invoice.getAmount(),
                    "Thu tiền thành công trong thời gian ân hạn");
        }

        support.syncProfilePlan(user, true);
        emailService.sendRenewalSuccessEmail(user.getEmail(), support.displayName(user), plan.getName(),
                invoice.getAmount(), Utc.toVietnam(sub.getCurrentPeriodEnd()));
        support.push(user, "SUBSCRIPTION_RENEWED", invoice.getId(), "PAID",
                "Gia hạn gói " + plan.getName() + " thành công.");
    }

    private void applyRenewalFailure(Invoice invoice, String code, String message) {
        Subscription sub = subscriptionRepository.findWithLockById(invoice.getSubscription().getId()).orElseThrow();
        Account user = sub.getUser();
        ServicePackage plan = invoice.getPlan();
        LocalDateTime now = Utc.now();
        String shortMessage = truncate(message);

        invoice.setStatus(Invoice.Status.FAILED);
        invoice.setFailureCode(code);
        invoice.setFailureMessage(shortMessage);
        invoiceRepository.save(invoice);

        if (sub.getStatus() == Subscription.Status.EXPIRED)
            return;

        // Token bị cổng báo không còn hợp lệ: đánh dấu để người dùng đổi phương thức
        UserPaymentMethod method = sub.getPaymentMethod();
        if (method != null && INVALID_TOKEN_CODES.contains(code)) {
            method.setStatus(UserPaymentMethod.Status.INVALID);
            method.setRevokedAt(now);
            paymentMethodRepository.save(method);
        }

        int retries = (sub.getRetryCount() == null ? 0 : sub.getRetryCount()) + 1;
        sub.setRetryCount(retries);
        sub.setLastPaymentError(shortMessage);

        support.audit(user, Action.PAYMENT_FAILED, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), invoice.getId(),
                "PENDING", "FAILED", null, plan.getCode(), invoice.getAmount(), message);
        support.audit(user, Action.RENEWAL_FAILED, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), invoice.getId(),
                sub.getStatus().name(), sub.getStatus().name(), sub.getPlan().getCode(), plan.getCode(),
                invoice.getAmount(), "Gia hạn lần " + retries + " thất bại: " + message);

        if (sub.getStatus() == Subscription.Status.ACTIVE) {
            // Vào ân hạn: vẫn giữ quyền truy cập dịch vụ
            LocalDateTime graceEnd = sub.getCurrentPeriodEnd().plusDays(graceDays);
            if (graceEnd.isBefore(now.plusDays(1)))
                graceEnd = now.plusDays(1);
            sub.setStatus(Subscription.Status.GRACE_PERIOD);
            sub.setGracePeriodEnd(graceEnd);

            support.audit(user, Action.GRACE_STARTED, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(), null,
                    "ACTIVE", "GRACE_PERIOD", sub.getPlan().getCode(), sub.getPlan().getCode(), null,
                    "Bắt đầu ân hạn đến " + Utc.toVietnam(graceEnd).format(DATE_FMT) + ", vẫn giữ nguyên quyền lợi");
            emailService.sendPaymentFailedEmail(user.getEmail(), support.displayName(user), sub.getPlan().getName(),
                    invoice.getAmount(), message, Utc.toVietnam(graceEnd));
        }
        subscriptionRepository.save(sub);
        support.push(user, "PAYMENT_FAILED", invoice.getId(), "FAILED", message);
    }

    // =====================================================================
    // 3. HẾT HẠN -> HẠ CẤP VỀ GÓI FREE
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
    private Long parseInvoiceId(String orderId) {
        if (orderId == null)
            return null;
        Matcher matcher = Pattern.compile("^" + Pattern.quote(orderPrefix) + "(\\d+)A\\d+$").matcher(orderId);
        return matcher.matches() ? Long.valueOf(matcher.group(1)) : null;
    }

    private String truncate(String message) {
        if (message == null)
            return null;
        return message.length() > 250 ? message.substring(0, 250) : message;
    }
}