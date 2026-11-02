package com.backend.SentinelCare.service;

import com.backend.SentinelCare.dto.SubscriptionDtos.*;
import com.backend.SentinelCare.exception.BusinessException;
import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.model.SubscriptionLog.Action;
import com.backend.SentinelCare.payment.PaymentGateway;
import com.backend.SentinelCare.payment.PaymentGateway.PaymentLinkRequest;
import com.backend.SentinelCare.payment.TokenCipher;
import com.backend.SentinelCare.repository.*;
import com.backend.SentinelCare.util.Utc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubscriptionService {

    private static final BigDecimal MIN_CHARGE = BigDecimal.valueOf(1000); // tối thiểu theo quy định cổng
    private static final BigDecimal MAX_CARD_CHARGE = BigDecimal.valueOf(10_000_000);
    private static final Set<String> METHODS = Set.of("MOMO_WALLET", "MOMO_CARD");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public enum ChangeType {
        INITIAL, UPGRADE, DOWNGRADE, RECOVERY, SAME_PLAN
    }

    private record Decision(ChangeType type, boolean allowed, String reason, BigDecimal listPrice,
            BigDecimal credit, BigDecimal due, long remainingDays, LocalDateTime effectiveAt) {
        Decision withDue(BigDecimal newDue) {
            return new Decision(type, allowed, reason, listPrice, credit, newDue, remainingDays, effectiveAt);
        }
    }

    private record Prepared(Long invoiceId, String orderId, BigDecimal amount, String orderInfo,
            String partnerClientId, String email, String linkType, SubscribeResponse immediate) {
        static Prepared immediate(SubscribeResponse response) {
            return new Prepared(null, null, null, null, null, null, null, response);
        }
    }

    private final ServicePackageRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserPaymentMethodRepository paymentMethodRepository;
    private final SubscriptionLogRepository logRepository;
    private final AccountRepository accountRepository;
    private final PaymentGateway gateway;
    private final InvoiceSettlementService settlement;
    private final SubscriptionSupport support;
    private final TokenCipher tokenCipher;
    private final PlatformTransactionManager transactionManager;

    @Value("${payment.order-prefix:SC}")
    private String orderPrefix;

    @Value("${app.public-base-url:http://localhost:8080}")
    private String publicBaseUrl;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${billing.entitlement-slack-hours:24}")
    private int slackHours;

    @Value("${billing.revoke-token-on-cancel:false}")
    private boolean revokeTokenOnCancel;

    // =====================================================================
    // 1. TRUY VẤN
    // =====================================================================

    public List<ServicePackage> getPlans() {
        return planRepository.findByIsActiveTrueOrderByPriceAsc();
    }

    @Transactional(readOnly = true)
    public MySubscriptionResponse getMySubscription(Long userId) {
        Subscription sub = subscriptionRepository.findByUserId(userId).orElse(null);
        return toMyResponse(sub, Utc.now());
    }

    // Quyền dùng tính năng. Gói đang ân hạn (GRACE_PERIOD) vẫn giữ nguyên quyền
    // lợi.
    public boolean hasFeatureAccess(Long userId, String featureCode) {
        LocalDateTime now = Utc.now();
        ServicePackage plan = subscriptionRepository.findByUserId(userId)
                .filter(s -> isEntitled(s, now))
                .map(Subscription::getPlan)
                .orElseGet(this::freePlan);
        return plan != null && plan.getFeatures().stream().anyMatch(f -> f.getCode().equalsIgnoreCase(featureCode));
    }

    @Transactional(readOnly = true)
    public QuoteResponse quote(Long userId, Integer planId) {
        ServicePackage target = loadPlan(planId);
        Subscription sub = subscriptionRepository.findByUserId(userId).orElse(null);
        LocalDateTime now = Utc.now();
        Decision d = decide(sub, target, now);
        String currentName = isEntitled(sub, now) ? sub.getPlan().getName() : "Miễn phí";

        return new QuoteResponse(d.type().name(), d.allowed(), d.reason(), currentName,
                target.getId(), target.getCode(), target.getName(),
                d.listPrice(), d.credit(), d.due(), d.remainingDays(), Utc.toInstant(d.effectiveAt()),
                target.getDurationDays() != null, summary(d, sub, target));
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getInvoices(Long userId, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        return invoiceRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(Math.max(page, 0), safeSize))
                .map(this::toInvoiceResponse);
    }

    // Trang kết quả thanh toán theo dõi hóa đơn cho tới khi hết PENDING
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(Long userId, Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .filter(i -> i.getUser().getId().equals(userId))
                .map(this::toInvoiceResponse)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "INVOICE_NOT_FOUND",
                        "Không tìm thấy hóa đơn."));
    }

    @Transactional(readOnly = true)
    public List<PaymentMethodResponse> getPaymentMethods(Long userId) {
        return paymentMethodRepository
                .findByUserIdAndStatusOrderByCreatedAtDesc(userId, UserPaymentMethod.Status.ACTIVE)
                .stream().map(this::toMethodResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<SubscriptionLogResponse> getHistory(Long userId, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        return logRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(Math.max(page, 0), safeSize))
                .map(l -> new SubscriptionLogResponse(l.getId(), l.getAction().name(), l.getFromStatus(),
                        l.getToStatus(),
                        l.getFromPackage(), l.getToPackage(), l.getAmount(), l.getActor(), l.getMessage(),
                        Utc.toInstant(l.getCreatedAt())));
    }

    // =====================================================================
    // 2. ĐĂNG KÝ / NÂNG / HẠ GÓI (POST /api/v1/subscriptions/subscribe)
    // Bước 1 (transaction): kiểm tra, tạo hóa đơn PENDING
    // Bước 2 (ngoài transaction): gọi MoMo tạo link/QR đăng ký auto-debit
    // Bước 3 (transaction): lưu paymentUrl. Gói chỉ kích hoạt khi IPN về
    // (InvoiceSettlementService).
    // =====================================================================
    public SubscribeResponse subscribe(Long userId, SubscribeRequest request) {
        String methodType = request.paymentMethod() == null ? ""
                : request.paymentMethod().trim().toUpperCase(Locale.ROOT);

        Prepared prepared = new TransactionTemplate(transactionManager)
                .execute(status -> prepare(userId, request, methodType));
        if (prepared.immediate() != null) {
            return prepared.immediate();
        }

        String paymentUrl;
        try {
            paymentUrl = gateway.createPaymentLink(new PaymentLinkRequest(
                    prepared.linkType(), prepared.orderId(), prepared.amount(), prepared.orderInfo(),
                    prepared.partnerClientId(), prepared.email(),
                    frontendBaseUrl + "/thanh-toan/ket-qua/" + prepared.invoiceId(),
                    publicBaseUrl + "/api/v1/payments/momo/ipn"));
        } catch (BusinessException e) {
            failInvoice(prepared.invoiceId(), e.getCode(), e.getMessage());
            throw e;
        }

        new TransactionTemplate(transactionManager)
                .executeWithoutResult(status -> invoiceRepository.findById(prepared.invoiceId()).ifPresent(inv -> {
                    inv.setPaymentUrl(paymentUrl);
                    invoiceRepository.save(inv);
                }));

        return new SubscribeResponse("PENDING_PAYMENT", prepared.invoiceId(), paymentUrl, prepared.amount(),
                "Chuyển sang MoMo để xác thực ủy quyền và thanh toán kỳ đầu tiên.", null);
    }

    private Prepared prepare(Long userId, SubscribeRequest request, String methodType) {
        Account user = accountRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND",
                        "Không tìm thấy tài khoản."));
        ServicePackage target = loadPlan(request.planId());
        LocalDateTime now = Utc.now();

        if (!Boolean.TRUE.equals(target.getIsActive())) {
            throw new BusinessException(HttpStatus.CONFLICT, "PLAN_INACTIVE", "Gói dịch vụ này hiện đã ngừng bán.");
        }
        if (support.isFree(target)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "FREE_PLAN",
                    "Gói Miễn phí không cần thanh toán. Để quay về gói Miễn phí, hãy hủy gia hạn tự động.");
        }

        boolean recurring = target.getDurationDays() != null;
        Subscription sub = subscriptionRepository.findWithLockByUserId(userId).orElse(null);
        Decision d = decide(sub, target, now);
        if (!d.allowed()) {
            throw new BusinessException(HttpStatus.CONFLICT, "CHANGE_NOT_ALLOWED", d.reason());
        }

        // Hạ gói: giữ nguyên gói hiện tại đến hết kỳ đã trả tiền, gói mới bắt đầu ở kỳ
        // sau
        if (d.type() == ChangeType.DOWNGRADE) {
            sub.setPendingPlan(target);
            subscriptionRepository.save(sub);
            String message = "Bạn vẫn dùng đủ quyền lợi gói " + sub.getPlan().getName() + " đến hết "
                    + Utc.toVietnam(sub.getCurrentPeriodEnd()).format(DATE_FMT) + ". Gói " + target.getName()
                    + " bắt đầu từ kỳ tiếp theo.";
            support.audit(user, Action.DOWNGRADE_SCHEDULED, SubscriptionSupport.ACTOR_USER, sub.getId(), null,
                    sub.getStatus().name(), sub.getStatus().name(), sub.getPlan().getCode(), target.getCode(), null,
                    message);
            return Prepared.immediate(new SubscribeResponse("DOWNGRADE_SCHEDULED", null, null, BigDecimal.ZERO,
                    message, Utc.toInstant(sub.getCurrentPeriodEnd())));
        }

        if (recurring && !Boolean.TRUE.equals(request.autoRenewConsent())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "CONSENT_REQUIRED",
                    "Vui lòng đồng ý cho phép tự động gia hạn gói dịch vụ để tiếp tục.");
        }

        Invoice.Type invoiceType = switch (d.type()) {
            case UPGRADE -> Invoice.Type.UPGRADE;
            case RECOVERY -> Invoice.Type.RECOVERY;
            default -> Invoice.Type.INITIAL;
        };

        // Nâng gói mà phần quy đổi đã đủ trả giá gói mới: kích hoạt ngay, giữ phương
        // thức hiện có
        if (d.type() == ChangeType.UPGRADE && d.due().signum() == 0) {
            Invoice free = invoiceRepository.save(Invoice.builder()
                    .user(user).subscription(sub).plan(target).type(invoiceType).status(Invoice.Status.PENDING)
                    .amount(BigDecimal.ZERO).listPrice(d.listPrice()).prorationCredit(d.credit())
                    .methodType("TOKEN").idempotencyKey("UPG_" + userId + "_" + uuid12())
                    .attemptCount(0).build());
            settlement.activateWithoutPayment(free);
            return Prepared.immediate(new SubscribeResponse("ACTIVATED", free.getId(), null, BigDecimal.ZERO,
                    "Nâng cấp thành công. Phần thời gian còn lại của gói cũ đã được quy đổi đủ để trả gói mới.", null));
        }

        if (!METHODS.contains(methodType)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_PAYMENT_METHOD",
                    "Vui lòng chọn phương thức thanh toán: Ví MoMo hoặc Thẻ Visa/Mastercard.");
        }

        Decision charge = d;
        if (charge.due().signum() > 0 && charge.due().compareTo(MIN_CHARGE) < 0) {
            charge = charge.withDue(MIN_CHARGE);
        }
        if ("MOMO_CARD".equals(methodType) && charge.due().compareTo(MAX_CARD_CHARGE) > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "AMOUNT_TOO_LARGE",
                    "Thanh toán bằng thẻ qua MoMo giới hạn 10.000.000đ mỗi giao dịch. Vui lòng chọn Ví MoMo.");
        }

        // Hóa đơn đang chờ: dùng lại nếu y hệt (bấm 2 lần / quay lại trang), ngược lại
        // hủy để tránh thanh toán nhầm
        for (Invoice pending : invoiceRepository.findByUserIdAndStatus(userId, Invoice.Status.PENDING)) {
            if (pending.getType() == Invoice.Type.RENEWAL)
                continue;
            boolean reusable = pending.getPaymentUrl() != null
                    && pending.getPlan().getId().equals(target.getId())
                    && methodType.equals(pending.getMethodType())
                    && pending.getAmount().compareTo(charge.due()) == 0
                    && pending.getCreatedAt().isAfter(now.minusMinutes(14));
            if (reusable) {
                return Prepared.immediate(new SubscribeResponse("PENDING_PAYMENT", pending.getId(),
                        pending.getPaymentUrl(),
                        pending.getAmount(), "Bạn đang có một giao dịch chờ thanh toán. Tiếp tục để hoàn tất.", null));
            }
            pending.setStatus(Invoice.Status.CANCELED);
            pending.setFailureMessage("Được thay thế bằng giao dịch mới.");
            invoiceRepository.save(pending);
        }

        boolean card = "MOMO_CARD".equals(methodType);
        String partnerClientId = null;
        if (recurring || card) {
            UserPaymentMethod.Type type = card ? UserPaymentMethod.Type.CARD : UserPaymentMethod.Type.WALLET;
            long next = paymentMethodRepository.countByUserIdAndType(userId, type) + 1;
            partnerClientId = (card ? "C" : "W") + userId + "-" + next;
        }

        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .user(user).subscription(sub).plan(target).type(invoiceType).status(Invoice.Status.PENDING)
                .amount(charge.due()).listPrice(charge.listPrice()).prorationCredit(charge.credit())
                .methodType(methodType).partnerClientId(partnerClientId)
                .idempotencyKey("SUB_" + userId + "_" + target.getId() + "_" + uuid12())
                .attemptCount(1)
                .autoRenewConsent(recurring).consentAt(recurring ? now : null)
                .build());
        invoice.setGatewayOrderId(orderPrefix + invoice.getId() + "A1");
        invoiceRepository.save(invoice);

        support.audit(user, Action.ORDER_CREATED, SubscriptionSupport.ACTOR_USER, sub == null ? null : sub.getId(),
                invoice.getId(), null, "PENDING", sub == null ? null : sub.getPlan().getCode(), target.getCode(),
                charge.due(), "Tạo hóa đơn " + invoiceType + " qua " + methodType
                        + (recurring ? " (đã đồng ý ủy quyền tự động gia hạn)" : ""));

        String linkType = card ? "CARD" : (recurring ? "WALLET" : "ONE_TIME");
        return new Prepared(invoice.getId(), invoice.getGatewayOrderId(), charge.due(),
                "SentinelCare - " + target.getName(), partnerClientId, user.getEmail(), linkType, null);
    }

    private void failInvoice(Long invoiceId, String code, String message) {
        new TransactionTemplate(transactionManager)
                .executeWithoutResult(status -> invoiceRepository.findById(invoiceId).ifPresent(inv -> {
                    inv.setStatus(Invoice.Status.FAILED);
                    inv.setFailureCode(code);
                    inv.setFailureMessage(
                            message != null && message.length() > 250 ? message.substring(0, 250) : message);
                    invoiceRepository.save(inv);
                    support.audit(inv.getUser(), Action.PAYMENT_FAILED, SubscriptionSupport.ACTOR_SYSTEM, null,
                            inv.getId(),
                            "PENDING", "FAILED", null, inv.getPlan().getCode(), inv.getAmount(), message);
                }));
    }

    // =====================================================================
    // 3. HỦY / BẬT LẠI TỰ ĐỘNG GIA HẠN
    // =====================================================================

    // Không xóa bản ghi, không xóa Payment Token (trừ khi chính sách bắt buộc:
    // billing.revoke-token-on-cancel=true)
    @Transactional
    public MySubscriptionResponse cancelAutoRenew(Long userId, CancelAutoRenewRequest request) {
        Subscription sub = lockSubscription(userId);
        LocalDateTime now = Utc.now();
        if (!isEntitled(sub, now)) {
            throw new BusinessException(HttpStatus.CONFLICT, "NO_ACTIVE_SUBSCRIPTION",
                    "Bạn chưa có gói trả phí đang hoạt động.");
        }
        if (!sub.isAutoRenew()) {
            throw new BusinessException(HttpStatus.CONFLICT, "ALREADY_DISABLED", "Tự động gia hạn đã được tắt.");
        }

        sub.setAutoRenew(false);
        sub.setPendingPlan(null);
        sub.setCancelReason(truncate(request.reason(), 100));
        sub.setCancelFeedback(truncate(request.feedback(), 500));
        sub.setCanceledAt(now);

        if (revokeTokenOnCancel && sub.getPaymentMethod() != null) {
            revokeAtGateway(sub.getPaymentMethod());
            sub.setPaymentMethod(null);
        }
        subscriptionRepository.save(sub);

        String endText = sub.getCurrentPeriodEnd() == null ? ""
                : " Gói dùng được đến hết " + Utc.toVietnam(sub.getCurrentPeriodEnd()).format(DATE_FMT) + ".";
        support.audit(sub.getUser(), Action.AUTO_RENEW_DISABLED, SubscriptionSupport.ACTOR_USER, sub.getId(), null,
                sub.getStatus().name(), sub.getStatus().name(), sub.getPlan().getCode(), sub.getPlan().getCode(), null,
                "Hủy tự động gia hạn" + (request.reason() == null ? "" : ". Lý do: " + request.reason()) + "."
                        + endText);
        return toMyResponse(sub, now);
    }

    @Transactional
    public MySubscriptionResponse resumeAutoRenew(Long userId) {
        Subscription sub = lockSubscription(userId);
        LocalDateTime now = Utc.now();
        if (sub.getStatus() != Subscription.Status.ACTIVE || !isEntitled(sub, now)) {
            throw new BusinessException(HttpStatus.CONFLICT, "NO_ACTIVE_SUBSCRIPTION",
                    "Chỉ bật lại được khi gói đang hoạt động.");
        }
        if (sub.isAutoRenew()) {
            return toMyResponse(sub, now);
        }
        UserPaymentMethod method = sub.getPaymentMethod();
        if (sub.getCurrentPeriodEnd() == null || method == null
                || method.getStatus() != UserPaymentMethod.Status.ACTIVE) {
            throw new BusinessException(HttpStatus.CONFLICT, "PAYMENT_METHOD_REQUIRED",
                    "Phương thức thanh toán đã bị hủy liên kết. Vui lòng liên kết lại khi gia hạn gói.");
        }

        sub.setAutoRenew(true);
        sub.setCancelReason(null);
        sub.setCancelFeedback(null);
        sub.setCanceledAt(null);
        subscriptionRepository.save(sub);

        support.audit(sub.getUser(), Action.AUTO_RENEW_ENABLED, SubscriptionSupport.ACTOR_USER, sub.getId(), null,
                "ACTIVE", "ACTIVE", sub.getPlan().getCode(), sub.getPlan().getCode(), null,
                "Bật lại tự động gia hạn bằng " + method.getDisplayName());
        return toMyResponse(sub, now);
    }

    @Transactional
    public void cancelPendingChange(Long userId) {
        Subscription sub = lockSubscription(userId);
        if (sub.getPendingPlan() == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "NOTHING_SCHEDULED",
                    "Không có thay đổi gói nào đang chờ hiệu lực.");
        }
        String planCode = sub.getPendingPlan().getCode();
        sub.setPendingPlan(null);
        subscriptionRepository.save(sub);
        support.audit(sub.getUser(), Action.DOWNGRADE_CANCELLED, SubscriptionSupport.ACTOR_USER, sub.getId(), null,
                sub.getStatus().name(), sub.getStatus().name(), sub.getPlan().getCode(), planCode, null,
                "Người dùng hủy lịch hạ gói");
    }

    // =====================================================================
    // 4. PHƯƠNG THỨC THANH TOÁN
    // =====================================================================

    @Transactional
    public void removePaymentMethod(Long userId, Long methodId) {
        UserPaymentMethod method = paymentMethodRepository.findByIdAndUserId(methodId, userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "METHOD_NOT_FOUND",
                        "Không tìm thấy phương thức thanh toán."));
        if (method.getStatus() != UserPaymentMethod.Status.ACTIVE)
            return;

        Subscription sub = subscriptionRepository.findWithLockByUserId(userId).orElse(null);
        if (sub != null && sub.getPaymentMethod() != null && sub.getPaymentMethod().getId().equals(method.getId())) {
            sub.setAutoRenew(false);
            sub.setPendingPlan(null);
            sub.setPaymentMethod(null);
            subscriptionRepository.save(sub);
        }
        revokeAtGateway(method);
        support.audit(method.getUser(), Action.PAYMENT_METHOD_REMOVED, SubscriptionSupport.ACTOR_USER,
                sub == null ? null : sub.getId(), null, "ACTIVE", "REVOKED", null, null, null,
                "Xóa phương thức " + method.getDisplayName() + ". Gói sẽ không tự gia hạn.");
    }

    // MoMo báo người dùng đã hủy liên kết ngay trong app ví: thu hồi token và tắt
    // tự động gia hạn
    @Transactional
    public void onPaymentMethodUnbound(String partnerClientId) {
        for (UserPaymentMethod method : paymentMethodRepository
                .findByPartnerClientIdAndStatus(partnerClientId, UserPaymentMethod.Status.ACTIVE)) {
            method.setStatus(UserPaymentMethod.Status.REVOKED);
            method.setRevokedAt(Utc.now());
            paymentMethodRepository.save(method);

            for (Subscription sub : subscriptionRepository.findByPaymentMethodId(method.getId())) {
                sub.setAutoRenew(false);
                sub.setPendingPlan(null);
                sub.setPaymentMethod(null);
                subscriptionRepository.save(sub);
                support.audit(sub.getUser(), Action.AUTO_RENEW_DISABLED, SubscriptionSupport.ACTOR_SYSTEM, sub.getId(),
                        null,
                        sub.getStatus().name(), sub.getStatus().name(), sub.getPlan().getCode(),
                        sub.getPlan().getCode(), null,
                        "Bạn đã hủy liên kết " + method.getDisplayName()
                                + " trong ứng dụng MoMo, gói sẽ không tự gia hạn.");
                support.push(sub.getUser(), "PAYMENT_METHOD_UNBOUND", null, sub.getStatus().name(),
                        "Phương thức thanh toán đã bị hủy liên kết, gói sẽ không tự gia hạn.");
            }
        }
    }

    // =====================================================================
    // 5. HÀM HỖ TRỢ
    // =====================================================================

    private Decision decide(Subscription sub, ServicePackage target, LocalDateTime now) {
        BigDecimal list = target.getPrice();

        if (support.isFree(target)) {
            return new Decision(ChangeType.DOWNGRADE, false,
                    "Để quay về gói Miễn phí, hãy hủy gia hạn tự động trong mục Gói của tôi. Gói trả phí vẫn dùng được đến hết kỳ đã thanh toán.",
                    list, BigDecimal.ZERO, BigDecimal.ZERO, 0, null);
        }
        if (!isEffective(sub, now)) {
            return new Decision(ChangeType.INITIAL, true, null, list, BigDecimal.ZERO, list, 0, null);
        }

        ServicePackage current = sub.getPlan();
        long remaining = remainingDays(sub, now);

        if (current.getId().equals(target.getId())) {
            if (sub.getStatus() == Subscription.Status.GRACE_PERIOD) {
                return new Decision(ChangeType.RECOVERY, true, null, list, BigDecimal.ZERO, list, 0, null);
            }
            return new Decision(ChangeType.SAME_PLAN, false, "Bạn đang sử dụng gói này.", list,
                    BigDecimal.ZERO, BigDecimal.ZERO, remaining, null);
        }

        if (target.getPrice().compareTo(current.getPrice()) > 0) {
            BigDecimal credit = prorationCredit(sub, now).min(list);
            return new Decision(ChangeType.UPGRADE, true, null, list, credit, list.subtract(credit), remaining, null);
        }

        // Hạ gói: áp dụng từ kỳ tiếp theo
        if (sub.getCurrentPeriodEnd() == null) {
            return new Decision(ChangeType.DOWNGRADE, false,
                    "Gói trọn đời không có chu kỳ thanh toán nên không thể hạ gói. Vui lòng liên hệ CSKH.",
                    list, BigDecimal.ZERO, BigDecimal.ZERO, remaining, null);
        }
        if (sub.getStatus() == Subscription.Status.GRACE_PERIOD) {
            return new Decision(ChangeType.DOWNGRADE, false,
                    "Gói đang quá hạn thanh toán. Vui lòng thanh toán gói hiện tại trước khi đổi gói.",
                    list, BigDecimal.ZERO, BigDecimal.ZERO, remaining, null);
        }
        if (!sub.isAutoRenew() || sub.getPaymentMethod() == null
                || sub.getPaymentMethod().getStatus() != UserPaymentMethod.Status.ACTIVE) {
            return new Decision(ChangeType.DOWNGRADE, false,
                    "Để hạ xuống gói trả phí thấp hơn, bạn cần đang bật tự động gia hạn (để thu tiền gói mới ở kỳ sau).",
                    list, BigDecimal.ZERO, BigDecimal.ZERO, remaining, null);
        }
        return new Decision(ChangeType.DOWNGRADE, true, null, list, BigDecimal.ZERO, BigDecimal.ZERO,
                remaining, sub.getCurrentPeriodEnd());
    }

    // Quy đổi: số tiền đã trả cho kỳ × thời gian còn lại / tổng thời gian kỳ (làm
    // tròn đồng)
    private BigDecimal prorationCredit(Subscription sub, LocalDateTime now) {
        if (sub.getCurrentPeriodEnd() == null)
            return BigDecimal.ZERO;
        BigDecimal paid = sub.getCurrentPeriodAmount() != null ? sub.getCurrentPeriodAmount()
                : sub.getPlan().getPrice();
        if (paid == null || paid.signum() <= 0)
            return BigDecimal.ZERO;

        long total = Duration.between(sub.getCurrentPeriodStart(), sub.getCurrentPeriodEnd()).getSeconds();
        long remaining = Duration.between(now, sub.getCurrentPeriodEnd()).getSeconds();
        if (total <= 0 || remaining <= 0)
            return BigDecimal.ZERO;

        return paid.multiply(BigDecimal.valueOf(remaining)).divide(BigDecimal.valueOf(total), 0, RoundingMode.HALF_UP);
    }

    // Gói đang còn hiệu lực theo kỳ thanh toán (dùng để quyết định mua mới / nâng /
    // hạ)
    private boolean isEffective(Subscription sub, LocalDateTime now) {
        if (sub == null)
            return false;
        return switch (sub.getStatus()) {
            case ACTIVE -> sub.getCurrentPeriodEnd() == null || sub.getCurrentPeriodEnd().isAfter(now);
            case GRACE_PERIOD -> sub.getGracePeriodEnd() != null && sub.getGracePeriodEnd().isAfter(now);
            case EXPIRED -> false;
        };
    }

    // Quyền lợi dịch vụ: giữ thêm một khoảng nhỏ phòng khi job chậm vài giờ, tránh
    // tắt cảnh báo té ngã oan
    private boolean isEntitled(Subscription sub, LocalDateTime now) {
        if (sub == null)
            return false;
        return switch (sub.getStatus()) {
            case ACTIVE ->
                sub.getCurrentPeriodEnd() == null || sub.getCurrentPeriodEnd().isAfter(now.minusHours(slackHours));
            case GRACE_PERIOD -> sub.getGracePeriodEnd() != null && sub.getGracePeriodEnd().isAfter(now);
            case EXPIRED -> false;
        };
    }

    private long remainingDays(Subscription sub, LocalDateTime now) {
        if (sub == null || sub.getCurrentPeriodEnd() == null || !sub.getCurrentPeriodEnd().isAfter(now))
            return 0;
        return (long) Math.ceil(Duration.between(now, sub.getCurrentPeriodEnd()).toHours() / 24.0);
    }

    private String summary(Decision d, Subscription sub, ServicePackage target) {
        if (!d.allowed())
            return d.reason();
        return switch (d.type()) {
            case INITIAL ->
                "Gói " + target.getName() + " được kích hoạt ngay sau khi xác thực ủy quyền và thanh toán kỳ đầu tiên.";
            case UPGRADE -> d.credit().signum() > 0
                    ? "Nâng cấp có hiệu lực ngay. " + d.remainingDays() + " ngày còn lại của gói "
                            + sub.getPlan().getName()
                            + " được quy đổi thành " + support.money(d.credit()) + " trừ vào giá gói mới."
                    : "Nâng cấp có hiệu lực ngay sau khi thanh toán.";
            case DOWNGRADE -> "Bạn vẫn dùng đủ quyền lợi gói " + sub.getPlan().getName() + " đến hết "
                    + Utc.toVietnam(d.effectiveAt()).format(DATE_FMT) + ". Gói " + target.getName()
                    + " bắt đầu từ kỳ tiếp theo.";
            case RECOVERY -> "Thanh toán ngay để khôi phục gói " + target.getName() + " và giữ nguyên quyền lợi.";
            case SAME_PLAN -> d.reason();
        };
    }

    private MySubscriptionResponse toMyResponse(Subscription sub, LocalDateTime now) {
        // Chưa có gói, hoặc gói đã EXPIRED: đang dùng gói Free
        if (sub == null || !isEntitled(sub, now)) {
            ServicePackage free = freePlan();
            if (free == null) {
                throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "FREEMIUM_MISSING",
                        "Lỗi cấu hình: không tìm thấy gói FREEMIUM trong hệ thống.");
            }
            return new MySubscriptionResponse(free.getId(), free.getCode(), free.getName(), free.getPrice(),
                    free.getDurationDays(), "FREE", false, null, null, 0, false, null, null, null, null, null,
                    toFeatures(free));
        }

        ServicePackage plan = sub.getPlan();
        boolean willRenew = sub.isAutoRenew() && sub.getStatus() == Subscription.Status.ACTIVE
                && sub.getCurrentPeriodEnd() != null;
        ServicePackage next = sub.getPendingPlan() != null ? sub.getPendingPlan() : plan;

        return new MySubscriptionResponse(
                plan.getId(), plan.getCode(), plan.getName(), plan.getPrice(), plan.getDurationDays(),
                sub.getStatus().name(), sub.getCurrentPeriodEnd() == null,
                Utc.toInstant(sub.getCurrentPeriodStart()), Utc.toInstant(sub.getCurrentPeriodEnd()),
                remainingDays(sub, now), sub.isAutoRenew(), Utc.toInstant(sub.getGracePeriodEnd()),
                sub.getLastPaymentError(),
                sub.getPaymentMethod() == null ? null : toMethodResponse(sub.getPaymentMethod()),
                willRenew ? new NextBilling(next.getName(), next.getPrice(), Utc.toInstant(sub.getCurrentPeriodEnd()))
                        : null,
                sub.getPendingPlan() == null ? null
                        : new PendingChange(next.getId(), next.getCode(), next.getName(),
                                next.getPrice(), Utc.toInstant(sub.getCurrentPeriodEnd())),
                toFeatures(plan));
    }

    private List<FeatureDto> toFeatures(ServicePackage plan) {
        return plan.getFeatures().stream()
                .sorted(Comparator.comparing(Feature::getId))
                .map(f -> new FeatureDto(f.getId(), f.getCode(), f.getName()))
                .toList();
    }

    private PaymentMethodResponse toMethodResponse(UserPaymentMethod m) {
        return new PaymentMethodResponse(m.getId(), m.getType().name(), m.getBrand(), m.getLast4(),
                m.getDisplayName(), m.getStatus().name(), m.isDefaultMethod(), Utc.toInstant(m.getCreatedAt()));
    }

    private InvoiceResponse toInvoiceResponse(Invoice i) {
        String label = i.getPaymentMethod() != null ? i.getPaymentMethod().getDisplayName()
                : "MOMO_CARD".equals(i.getMethodType()) ? "Thẻ Visa/Mastercard (qua MoMo)"
                        : "MOMO_WALLET".equals(i.getMethodType()) ? "Ví MoMo"
                                : "TOKEN".equals(i.getMethodType()) ? "Phương thức đã liên kết" : null;
        return new InvoiceResponse(i.getId(), String.format("INV-%06d", i.getId()), i.getType().name(),
                i.getStatus().name(), i.getAmount(), i.getListPrice(), i.getProrationCredit(), i.getCurrency(),
                i.getPlan().getName(), label, Utc.toInstant(i.getPeriodStart()), Utc.toInstant(i.getPeriodEnd()),
                Utc.toInstant(i.getCreatedAt()), Utc.toInstant(i.getPaidAt()), i.getFailureMessage());
    }

    private void revokeAtGateway(UserPaymentMethod method) {
        try {
            gateway.deleteToken(method.getPartnerClientId(), tokenCipher.decrypt(method.getTokenEncrypted()));
        } catch (Exception e) {
            log.warn("Không thu hồi được token {} ở cổng thanh toán: {}", method.getId(), e.getMessage());
        }
        method.setStatus(UserPaymentMethod.Status.REVOKED);
        method.setRevokedAt(Utc.now());
        paymentMethodRepository.save(method);
    }

    private Subscription lockSubscription(Long userId) {
        return subscriptionRepository.findWithLockByUserId(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "NO_SUBSCRIPTION",
                        "Bạn chưa có gói trả phí nào."));
    }

    private ServicePackage loadPlan(Integer planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PLAN_NOT_FOUND",
                        "Gói dịch vụ không tồn tại."));
    }

    private ServicePackage freePlan() {
        return planRepository.findByCode("FREEMIUM").orElse(null);
    }

    private String uuid12() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String truncate(String value, int max) {
        if (value == null)
            return null;
        String trimmed = value.trim();
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }
}