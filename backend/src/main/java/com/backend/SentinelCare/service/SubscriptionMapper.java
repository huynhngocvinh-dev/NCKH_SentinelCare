package com.backend.SentinelCare.service;

import com.backend.SentinelCare.dto.SubscriptionDtos.*;
import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.payment.PaymentChannel;
import com.backend.SentinelCare.service.SubscriptionPolicy.Decision;
import com.backend.SentinelCare.util.Utc;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class SubscriptionMapper {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final SubscriptionPolicy policy;
    private final SubscriptionSupport support;

    public MySubscriptionResponse toMyResponse(Subscription sub, LocalDateTime now, Supplier<ServicePackage> freePlan) {
        // Chưa có gói hoặc gói đã hết hạn: đang dùng gói Free
        if (!policy.isEntitled(sub, now)) {
            ServicePackage free = freePlan.get();
            return new MySubscriptionResponse(free.getId(), free.getCode(), free.getName(), free.getPrice(),
                    free.getDurationDays(), "FREE", false, null, null, 0, false, false, null, null, null, null,
                    toFeatures(free));
        }

        ServicePackage plan = sub.getPlan();
        ServicePackage next = sub.getPendingPlan() != null ? sub.getPendingPlan() : plan;
        boolean upcomingRenewal = sub.isAutoRenew() && sub.getStatus() == Subscription.Status.ACTIVE
                && sub.getCurrentPeriodEnd() != null;

        return new MySubscriptionResponse(
                plan.getId(), plan.getCode(), plan.getName(), plan.getPrice(), plan.getDurationDays(),
                sub.getStatus().name(), sub.getCurrentPeriodEnd() == null,
                Utc.toInstant(sub.getCurrentPeriodStart()), Utc.toInstant(sub.getCurrentPeriodEnd()),
                policy.remainingDays(sub, now), sub.isAutoRenew(), policy.canRenewNow(sub, now),
                Utc.toInstant(sub.getGracePeriodEnd()), sub.getLastPaymentError(),
                upcomingRenewal
                        ? new NextBilling(next.getName(), next.getPrice(), Utc.toInstant(sub.getCurrentPeriodEnd()))
                        : null,
                sub.getPendingPlan() == null ? null
                        : new PendingChange(next.getId(), next.getCode(), next.getName(),
                                next.getPrice(), Utc.toInstant(sub.getCurrentPeriodEnd())),
                toFeatures(plan));
    }

    public QuoteResponse toQuoteResponse(Subscription sub, ServicePackage target, Decision decision,
            LocalDateTime now) {
        String currentName = policy.isEntitled(sub, now) ? sub.getPlan().getName() : "Miễn phí";
        return new QuoteResponse(decision.type().name(), decision.allowed(), decision.reason(), currentName,
                target.getId(), target.getCode(), target.getName(),
                decision.listPrice(), decision.credit(), decision.due(), decision.remainingDays(),
                Utc.toInstant(decision.effectiveAt()), target.getDurationDays() != null,
                describe(decision, sub, target));
    }

    public InvoiceResponse toInvoiceResponse(Invoice i) {
        return new InvoiceResponse(i.getId(), String.format("INV-%06d", i.getId()), i.getType().name(),
                i.getStatus().name(), i.getAmount(), i.getListPrice(), i.getProrationCredit(), i.getCurrency(),
                i.getPlan().getName(), PaymentChannel.labelOf(i.getMethodType()),
                Utc.toInstant(i.getPeriodStart()), Utc.toInstant(i.getPeriodEnd()),
                Utc.toInstant(i.getCreatedAt()), Utc.toInstant(i.getPaidAt()), i.getFailureMessage());
    }

    public SubscriptionLogResponse toLogResponse(SubscriptionLog l) {
        return new SubscriptionLogResponse(l.getId(), l.getAction().name(), l.getFromStatus(), l.getToStatus(),
                l.getFromPackage(), l.getToPackage(), l.getAmount(), l.getActor(), l.getMessage(),
                Utc.toInstant(l.getCreatedAt()));
    }

    public List<FeatureDto> toFeatures(ServicePackage plan) {
        return plan.getFeatures().stream()
                .sorted(Comparator.comparing(Feature::getId))
                .map(f -> new FeatureDto(f.getId(), f.getCode(), f.getName()))
                .toList();
    }

    // Câu giải thích cho người dùng trước khi thanh toán
    private String describe(Decision d, Subscription sub, ServicePackage target) {
        if (!d.allowed())
            return d.reason();
        return switch (d.type()) {
            case INITIAL -> "Gói " + target.getName() + " được kích hoạt ngay sau khi bạn thanh toán kỳ đầu tiên.";
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
}