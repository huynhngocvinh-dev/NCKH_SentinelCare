package com.backend.SentinelCare.service;

import com.backend.SentinelCare.dto.SubscriptionDtos.*;
import com.backend.SentinelCare.exception.BusinessException;
import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.model.SubscriptionLog.Action;
import com.backend.SentinelCare.payment.PaymentChannel;
import com.backend.SentinelCare.payment.PaymentGateway;
import com.backend.SentinelCare.payment.PaymentGateway.PaymentRequest;
import com.backend.SentinelCare.repository.*;
import com.backend.SentinelCare.service.SubscriptionPolicy.Decision;
import com.backend.SentinelCare.util.Utc;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Link VNPAY hết hạn sau 15 phút: chỉ dùng lại link còn đủ thời gian
    private static final int PAYMENT_URL_REUSE_MINUTES = 14;

    private final ServicePackageRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final SubscriptionLogRepository logRepository;
    private final AccountRepository accountRepository;
    private final PaymentGateway gateway;
    private final InvoiceSettlementService settlement;
    private final SubscriptionBillingService billingService;
    private final SubscriptionPolicy policy;
    private final SubscriptionMapper mapper;
    private final SubscriptionSupport support;

    @Value("${payment.order-prefix:SC}")
    private String orderPrefix;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    // =====================================================================
    // 1. TRUY VẤN
    // =====================================================================

    public java.util.List<ServicePackage> getPlans() {
        return planRepository.findByIsActiveTrueOrderByPriceAsc();
    }

    @Transactional(readOnly = true)
    public MySubscriptionResponse getMySubscription(Long userId) {
        Subscription sub = subscriptionRepository.findByUserId(userId).orElse(null);
        return mapper.toMyResponse(sub, Utc.now(), this::freePlan);
    }

    // Quyền dùng tính năng. Gói đang ân hạn (GRACE_PERIOD) vẫn giữ nguyên quyền
    // lợi.
    public boolean hasFeatureAccess(Long userId, String featureCode) {
        LocalDateTime now = Utc.now();
        ServicePackage plan = subscriptionRepository.findByUserId(userId)
                .filter(sub -> policy.isEntitled(sub, now))
                .map(Subscription::getPlan)
                .orElseGet(this::freePlan);
        return plan.getFeatures().stream().anyMatch(f -> f.getCode().equalsIgnoreCase(featureCode));
    }

    @Transactional(readOnly = true)
    public QuoteResponse quote(Long userId, Integer planId) {
        ServicePackage target = loadPlan(planId);
        Subscription sub = subscriptionRepository.findByUserId(userId).orElse(null);
        LocalDateTime now = Utc.now();
        return mapper.toQuoteResponse(sub, target, policy.decide(sub, target, now), now);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getInvoices(Long userId, int page, int size) {
        return invoiceRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest(page, size))
                .map(mapper::toInvoiceResponse);
    }

    // Trang kết quả thanh toán theo dõi hóa đơn cho tới khi hết PENDING
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(Long userId, Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .filter(invoice -> invoice.getUser().getId().equals(userId))
                .map(mapper::toInvoiceResponse)
                .orElseThrow(() -> notFound("INVOICE_NOT_FOUND", "Không tìm thấy hóa đơn."));
    }

    @Transactional(readOnly = true)
    public Page<SubscriptionLogResponse> getHistory(Long userId, int page, int size) {
        return logRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest(page, size))
                .map(mapper::toLogResponse);
    }

    // =====================================================================
    // 2. ĐĂNG KÝ / NÂNG / HẠ GÓI (POST /api/v1/subscriptions/subscribe)
    // Tạo hóa đơn PENDING + URL VNPAY. Gói chỉ kích hoạt khi VNPAY báo về
    // (InvoiceSettlementService).
    // =====================================================================
    @Transactional
    public SubscribeResponse subscribe(Long userId, SubscribeRequest request, String clientIp) {
        PaymentChannel channel = PaymentChannel.from(request.paymentMethod());
        Account user = loadUser(userId);
        ServicePackage target = loadSellablePlan(request.planId());
        LocalDateTime now = Utc.now();

        Subscription sub = subscriptionRepository.findWithLockByUserId(userId).orElse(null);
        Decision decision = policy.decide(sub, target, now);
        if (!decision.allowed()) {
            throw conflict("CHANGE_NOT_ALLOWED", decision.reason());
        }

        return switch (decision.type()) {
            case DOWNGRADE -> scheduleDowngrade(user, sub, target);
            case INITIAL, UPGRADE, RECOVERY -> checkout(user, sub, target, decision, channel, clientIp, now);
            case SAME_PLAN -> throw conflict("CHANGE_NOT_ALLOWED", decision.reason());
        };
    }

    private SubscribeResponse checkout(Account user, Subscription sub, ServicePackage target, Decision decision,
            PaymentChannel channel, String clientIp, LocalDateTime now) {
        // Phần quy đổi đã đủ trả giá gói mới: kích hoạt ngay, không cần thu tiền
        if (decision.type() == SubscriptionPolicy.ChangeType.UPGRADE && decision.due().signum() == 0) {
            return activateFromCredit(user, sub, target, decision);
        }

        BigDecimal amount = policy.chargeableAmount(decision.due());
        Invoice reusable = cancelSupersededInvoices(user.getId(), target, channel, amount, now);
        if (reusable != null) {
            return pendingPayment(reusable, "Bạn đang có một giao dịch chờ thanh toán. Tiếp tục để hoàn tất.");
        }

        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .user(user).subscription(sub).plan(target)
                .type(invoiceTypeOf(decision.type())).status(Invoice.Status.PENDING)
                .amount(amount).listPrice(decision.listPrice()).prorationCredit(decision.credit())
                .idempotencyKey("SUB_" + user.getId() + "_" + target.getId() + "_" + randomSuffix())
                .attemptCount(0)
                .build());
        return beginPaymentAttempt(invoice, channel, clientIp,
                "Chuyển sang VNPAY để thanh toán kỳ đầu tiên.");
    }

    private SubscribeResponse activateFromCredit(Account user, Subscription sub, ServicePackage target,
            Decision decision) {
        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .user(user).subscription(sub).plan(target).type(Invoice.Type.UPGRADE).status(Invoice.Status.PENDING)
                .amount(BigDecimal.ZERO).listPrice(decision.listPrice()).prorationCredit(decision.credit())
                .idempotencyKey("UPG_" + user.getId() + "_" + randomSuffix()).attemptCount(0)
                .build());
        settlement.activateWithoutPayment(invoice);
        return new SubscribeResponse("ACTIVATED", invoice.getId(), null, BigDecimal.ZERO,
                "Nâng cấp thành công. Phần thời gian còn lại của gói cũ đã được quy đổi đủ để trả gói mới.", null);
    }

    // Hạ gói: giữ nguyên gói hiện tại đến hết kỳ đã trả tiền, gói mới bắt đầu ở kỳ
    // sau
    private SubscribeResponse scheduleDowngrade(Account user, Subscription sub, ServicePackage target) {
        sub.setPendingPlan(target);
        subscriptionRepository.save(sub);

        String message = "Bạn vẫn dùng đủ quyền lợi gói " + sub.getPlan().getName() + " đến hết "
                + Utc.toVietnam(sub.getCurrentPeriodEnd()).format(DATE_FMT) + ". Gói " + target.getName()
                + " bắt đầu từ kỳ tiếp theo.";
        support.audit(user, Action.DOWNGRADE_SCHEDULED, SubscriptionSupport.ACTOR_USER, sub.getId(), null,
                sub.getStatus().name(), sub.getStatus().name(), sub.getPlan().getCode(), target.getCode(), null,
                message);
        return new SubscribeResponse("DOWNGRADE_SCHEDULED", null, null, BigDecimal.ZERO, message,
                Utc.toInstant(sub.getCurrentPeriodEnd()));
    }

    // =====================================================================
    // 3. GIA HẠN: trong ân hạn hoặc gia hạn sớm (POST /api/v1/subscriptions/renew)
    // =====================================================================
    @Transactional
    public SubscribeResponse renew(Long userId, RenewRequest request, String clientIp) {
        PaymentChannel channel = PaymentChannel.from(request == null ? null : request.paymentMethod());
        Subscription sub = lockSubscription(userId);
        LocalDateTime now = Utc.now();

        if (!policy.canRenewNow(sub, now)) {
            throw conflict("NOT_DUE", notDueMessage(sub));
        }

        ServicePackage next = sub.getPendingPlan() != null ? sub.getPendingPlan() : sub.getPlan();
        Invoice invoice = billingService.ensureRenewalInvoice(sub, next);
        if (invoice.getStatus() == Invoice.Status.PAID) {
            throw conflict("ALREADY_PAID", "Kỳ này đã được gia hạn.");
        }
        if (isReusable(invoice, channel, now)) {
            return pendingPayment(invoice, "Bạn đang có một giao dịch gia hạn chờ thanh toán. Tiếp tục để hoàn tất.");
        }
        return beginPaymentAttempt(invoice, channel, clientIp, "Chuyển sang VNPAY để gia hạn gói.");
    }

    private String notDueMessage(Subscription sub) {
        return sub.getPendingPlan() != null && sub.getStatus() == Subscription.Status.ACTIVE
                ? "Gói mới sẽ bắt đầu từ kỳ tiếp theo. Bạn sẽ được nhắc gia hạn khi đến hạn."
                : "Chưa đến kỳ gia hạn. Bạn sẽ nhận được nhắc nhở khi gói gần đến hạn.";
    }

    // =====================================================================
    // 4. HỦY / BẬT LẠI GIA HẠN
    // =====================================================================

    // Không xóa bản ghi. Khi đến hạn, gói tự chuyển EXPIRED và về gói Free.
    @Transactional
    public MySubscriptionResponse cancelAutoRenew(Long userId, CancelAutoRenewRequest request) {
        Subscription sub = lockSubscription(userId);
        LocalDateTime now = Utc.now();
        if (!policy.isEntitled(sub, now)) {
            throw conflict("NO_ACTIVE_SUBSCRIPTION", "Bạn chưa có gói trả phí đang hoạt động.");
        }
        if (!sub.isAutoRenew()) {
            throw conflict("ALREADY_DISABLED", "Gia hạn đã được tắt.");
        }

        sub.setAutoRenew(false);
        sub.setPendingPlan(null);
        sub.setCancelReason(truncate(request.reason(), 100));
        sub.setCancelFeedback(truncate(request.feedback(), 500));
        sub.setCanceledAt(now);
        subscriptionRepository.save(sub);

        String endText = sub.getCurrentPeriodEnd() == null ? ""
                : " Gói dùng được đến hết " + Utc.toVietnam(sub.getCurrentPeriodEnd()).format(DATE_FMT) + ".";
        support.audit(sub.getUser(), Action.AUTO_RENEW_DISABLED, SubscriptionSupport.ACTOR_USER, sub.getId(), null,
                sub.getStatus().name(), sub.getStatus().name(), sub.getPlan().getCode(), sub.getPlan().getCode(), null,
                "Hủy gia hạn" + (request.reason() == null ? "" : ". Lý do: " + request.reason()) + "." + endText);
        return mapper.toMyResponse(sub, now, this::freePlan);
    }

    @Transactional
    public MySubscriptionResponse resumeAutoRenew(Long userId) {
        Subscription sub = lockSubscription(userId);
        LocalDateTime now = Utc.now();
        if (sub.getStatus() != Subscription.Status.ACTIVE || !policy.isEntitled(sub, now)
                || sub.getCurrentPeriodEnd() == null) {
            throw conflict("NO_ACTIVE_SUBSCRIPTION", "Chỉ bật lại được khi gói theo kỳ đang hoạt động.");
        }
        if (sub.isAutoRenew()) {
            return mapper.toMyResponse(sub, now, this::freePlan);
        }

        sub.setAutoRenew(true);
        sub.setCancelReason(null);
        sub.setCancelFeedback(null);
        sub.setCanceledAt(null);
        subscriptionRepository.save(sub);

        support.audit(sub.getUser(), Action.AUTO_RENEW_ENABLED, SubscriptionSupport.ACTOR_USER, sub.getId(), null,
                "ACTIVE", "ACTIVE", sub.getPlan().getCode(), sub.getPlan().getCode(), null, "Bật lại gia hạn");
        return mapper.toMyResponse(sub, now, this::freePlan);
    }

    @Transactional
    public void cancelPendingChange(Long userId) {
        Subscription sub = lockSubscription(userId);
        if (sub.getPendingPlan() == null) {
            throw conflict("NOTHING_SCHEDULED", "Không có thay đổi gói nào đang chờ hiệu lực.");
        }
        String planCode = sub.getPendingPlan().getCode();
        sub.setPendingPlan(null);
        subscriptionRepository.save(sub);
        support.audit(sub.getUser(), Action.DOWNGRADE_CANCELLED, SubscriptionSupport.ACTOR_USER, sub.getId(), null,
                sub.getStatus().name(), sub.getStatus().name(), sub.getPlan().getCode(), planCode, null,
                "Người dùng hủy lịch hạ gói");
    }

    // =====================================================================
    // 5. THANH TOÁN: dùng chung cho subscribe và renew
    // =====================================================================

    /**
     * Mỗi lần thử có một mã giao dịch riêng (VNPAY không cho trùng mã trong ngày).
     */
    private SubscribeResponse beginPaymentAttempt(Invoice invoice, PaymentChannel channel, String clientIp,
            String message) {
        int attempt = (invoice.getAttemptCount() == null ? 0 : invoice.getAttemptCount()) + 1;
        String txnRef = orderPrefix + invoice.getId() + "A" + attempt;

        String paymentUrl = gateway.createPaymentUrl(new PaymentRequest(
                txnRef, invoice.getAmount(), "SentinelCare " + invoice.getPlan().getName(),
                channel.vnpayBankCode(), frontendBaseUrl + "/thanh-toan/ket-qua/" + invoice.getId(), clientIp));

        invoice.setAttemptCount(attempt);
        invoice.setGatewayOrderId(txnRef);
        invoice.setStatus(Invoice.Status.PENDING);
        invoice.setMethodType(channel.name());
        invoice.setPaymentUrl(paymentUrl);
        invoice.setLastAttemptAt(Utc.now());
        invoice.setFailureCode(null);
        invoice.setFailureMessage(null);
        invoiceRepository.save(invoice);

        Long subscriptionId = invoice.getSubscription() == null ? null : invoice.getSubscription().getId();
        support.audit(invoice.getUser(), Action.ORDER_CREATED, SubscriptionSupport.ACTOR_USER, subscriptionId,
                invoice.getId(), null, "PENDING", null, invoice.getPlan().getCode(), invoice.getAmount(),
                (attempt == 1 ? "Tạo hóa đơn " : "Thanh toán lại hóa đơn (lần " + attempt + ") ")
                        + invoice.getType() + " qua " + channel.label());
        return pendingPayment(invoice, message);
    }

    private SubscribeResponse pendingPayment(Invoice invoice, String message) {
        return new SubscribeResponse("PENDING_PAYMENT", invoice.getId(), invoice.getPaymentUrl(),
                invoice.getAmount(), message, null);
    }

    // Hóa đơn còn chờ, cùng kênh, link còn hạn: dùng lại link cũ để người dùng
    // không thanh toán hai lần
    private boolean isReusable(Invoice invoice, PaymentChannel channel, LocalDateTime now) {
        return invoice.getStatus() == Invoice.Status.PENDING
                && invoice.getPaymentUrl() != null
                && channel.name().equals(invoice.getMethodType())
                && invoice.getLastAttemptAt() != null
                && invoice.getLastAttemptAt().isAfter(now.minusMinutes(PAYMENT_URL_REUSE_MINUTES));
    }

    /**
     * Giữ lại hóa đơn chờ y hệt (nếu có), hủy các hóa đơn chờ khác để tránh thanh
     * toán nhầm.
     */
    private Invoice cancelSupersededInvoices(Long userId, ServicePackage target, PaymentChannel channel,
            BigDecimal amount, LocalDateTime now) {
        Invoice reusable = null;
        for (Invoice pending : invoiceRepository.findByUserIdAndStatus(userId, Invoice.Status.PENDING)) {
            if (pending.getType() == Invoice.Type.RENEWAL)
                continue; // hóa đơn gia hạn được giữ riêng
            boolean identical = pending.getPlan().getId().equals(target.getId())
                    && pending.getAmount().compareTo(amount) == 0
                    && isReusable(pending, channel, now);
            if (reusable == null && identical) {
                reusable = pending;
                continue;
            }
            pending.setStatus(Invoice.Status.CANCELED);
            pending.setFailureMessage("Được thay thế bằng giao dịch mới.");
            invoiceRepository.save(pending);
        }
        return reusable;
    }

    private Invoice.Type invoiceTypeOf(SubscriptionPolicy.ChangeType type) {
        return switch (type) {
            case UPGRADE -> Invoice.Type.UPGRADE;
            case RECOVERY -> Invoice.Type.RECOVERY;
            default -> Invoice.Type.INITIAL;
        };
    }

    // =====================================================================
    // 6. HÀM HỖ TRỢ
    // =====================================================================

    private PageRequest pageRequest(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
    }

    private Account loadUser(Long userId) {
        return accountRepository.findById(userId)
                .orElseThrow(() -> notFound("USER_NOT_FOUND", "Không tìm thấy tài khoản."));
    }

    private ServicePackage loadPlan(Integer planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> notFound("PLAN_NOT_FOUND", "Gói dịch vụ không tồn tại."));
    }

    private ServicePackage loadSellablePlan(Integer planId) {
        ServicePackage plan = loadPlan(planId);
        if (!Boolean.TRUE.equals(plan.getIsActive())) {
            throw conflict("PLAN_INACTIVE", "Gói dịch vụ này hiện đã ngừng bán.");
        }
        if (policy.isFree(plan)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "FREE_PLAN",
                    "Gói Miễn phí không cần thanh toán. Để quay về gói Miễn phí, hãy hủy gia hạn.");
        }
        return plan;
    }

    private ServicePackage freePlan() {
        return planRepository.findByCode("FREEMIUM").orElseThrow(() -> new BusinessException(
                HttpStatus.INTERNAL_SERVER_ERROR, "FREEMIUM_MISSING",
                "Lỗi cấu hình: không tìm thấy gói FREEMIUM trong hệ thống."));
    }

    private Subscription lockSubscription(Long userId) {
        return subscriptionRepository.findWithLockByUserId(userId)
                .orElseThrow(() -> notFound("NO_SUBSCRIPTION", "Bạn chưa có gói trả phí nào."));
    }

    private BusinessException notFound(String code, String message) {
        return new BusinessException(HttpStatus.NOT_FOUND, code, message);
    }

    private BusinessException conflict(String code, String message) {
        return new BusinessException(HttpStatus.CONFLICT, code, message);
    }

    private String randomSuffix() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String truncate(String value, int max) {
        if (value == null)
            return null;
        String trimmed = value.trim();
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }
}