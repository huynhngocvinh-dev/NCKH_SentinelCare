package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.ServicePackage;
import com.backend.SentinelCare.model.Subscription;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Luật nghiệp vụ của gói dịch vụ. Chỉ tính toán, không truy cập CSDL. Mọi mốc
 * thời gian là UTC.
 */
@Component
public class SubscriptionPolicy {

    public enum ChangeType {
        INITIAL, UPGRADE, DOWNGRADE, RECOVERY, SAME_PLAN
    }

    public record Decision(ChangeType type, boolean allowed, String reason, BigDecimal listPrice,
            BigDecimal credit, BigDecimal due, long remainingDays, LocalDateTime effectiveAt) {

        static Decision allowed(ChangeType type, BigDecimal listPrice, BigDecimal credit, BigDecimal due,
                long remainingDays, LocalDateTime effectiveAt) {
            return new Decision(type, true, null, listPrice, credit, due, remainingDays, effectiveAt);
        }

        static Decision rejected(ChangeType type, String reason, BigDecimal listPrice, long remainingDays) {
            return new Decision(type, false, reason, listPrice, BigDecimal.ZERO, BigDecimal.ZERO, remainingDays, null);
        }

        public Decision withDue(BigDecimal newDue) {
            return new Decision(type, allowed, reason, listPrice, credit, newDue, remainingDays, effectiveAt);
        }
    }

    private static final String FREE_PLAN_HINT = "Để quay về gói Miễn phí, hãy hủy gia hạn trong mục Gói của tôi. Gói trả phí vẫn dùng được đến hết kỳ đã thanh toán.";
    private static final String SAME_PLAN_HINT = "Bạn đang sử dụng gói này. Muốn gia hạn thêm, hãy vào mục Gói của tôi khi sắp đến hạn.";
    private static final String LIFETIME_HINT = "Gói trọn đời không có chu kỳ thanh toán nên không thể hạ gói. Vui lòng liên hệ CSKH.";
    private static final String GRACE_HINT = "Gói đang quá hạn thanh toán. Vui lòng gia hạn gói hiện tại trước khi đổi gói.";
    private static final String RENEWAL_REQUIRED_HINT = "Để hạ xuống gói trả phí thấp hơn, bạn cần đang bật gia hạn (để thu tiền gói mới ở kỳ sau).";

    @Value("${billing.entitlement-slack-hours:24}")
    private int entitlementSlackHours;

    @Value("${billing.renew-window-days:7}")
    private int renewWindowDays;

    @Value("${payment.min-charge:5000}")
    private long minCharge;

    // ---------------------------------------------------------------------
    // Quyết định mua / nâng / hạ gói
    // ---------------------------------------------------------------------
    public Decision decide(Subscription sub, ServicePackage target, LocalDateTime now) {
        BigDecimal list = target.getPrice();

        if (isFree(target)) {
            return Decision.rejected(ChangeType.DOWNGRADE, FREE_PLAN_HINT, list, 0);
        }
        if (!isEffective(sub, now)) {
            return Decision.allowed(ChangeType.INITIAL, list, BigDecimal.ZERO, list, 0, null);
        }

        long remaining = remainingDays(sub, now);
        if (sub.getPlan().getId().equals(target.getId())) {
            return decideSamePlan(sub, list, remaining);
        }
        if (target.getPrice().compareTo(sub.getPlan().getPrice()) > 0) {
            return decideUpgrade(sub, list, remaining, now);
        }
        return decideDowngrade(sub, list, remaining);
    }

    private Decision decideSamePlan(Subscription sub, BigDecimal list, long remaining) {
        if (sub.getStatus() == Subscription.Status.GRACE_PERIOD) {
            return Decision.allowed(ChangeType.RECOVERY, list, BigDecimal.ZERO, list, 0, null);
        }
        return Decision.rejected(ChangeType.SAME_PLAN, SAME_PLAN_HINT, list, remaining);
    }

    // Nâng gói: hiệu lực ngay, thời gian còn lại của gói cũ được quy đổi thành tiền
    private Decision decideUpgrade(Subscription sub, BigDecimal list, long remaining, LocalDateTime now) {
        BigDecimal credit = prorationCredit(sub, now).min(list);
        return Decision.allowed(ChangeType.UPGRADE, list, credit, list.subtract(credit), remaining, null);
    }

    // Hạ gói: giữ gói hiện tại đến hết kỳ đã trả tiền, gói mới bắt đầu ở kỳ sau
    private Decision decideDowngrade(Subscription sub, BigDecimal list, long remaining) {
        if (sub.getCurrentPeriodEnd() == null) {
            return Decision.rejected(ChangeType.DOWNGRADE, LIFETIME_HINT, list, remaining);
        }
        if (sub.getStatus() == Subscription.Status.GRACE_PERIOD) {
            return Decision.rejected(ChangeType.DOWNGRADE, GRACE_HINT, list, remaining);
        }
        if (!sub.isAutoRenew()) {
            return Decision.rejected(ChangeType.DOWNGRADE, RENEWAL_REQUIRED_HINT, list, remaining);
        }
        return Decision.allowed(ChangeType.DOWNGRADE, list, BigDecimal.ZERO, BigDecimal.ZERO,
                remaining, sub.getCurrentPeriodEnd());
    }

    // Quy đổi: số tiền đã trả cho kỳ × thời gian còn lại / tổng thời gian kỳ (làm
    // tròn đồng)
    public BigDecimal prorationCredit(Subscription sub, LocalDateTime now) {
        if (sub.getCurrentPeriodEnd() == null)
            return BigDecimal.ZERO;

        BigDecimal paid = sub.getCurrentPeriodAmount() != null ? sub.getCurrentPeriodAmount()
                : sub.getPlan().getPrice();
        long totalSeconds = Duration.between(sub.getCurrentPeriodStart(), sub.getCurrentPeriodEnd()).getSeconds();
        long remainingSeconds = Duration.between(now, sub.getCurrentPeriodEnd()).getSeconds();
        if (paid == null || paid.signum() <= 0 || totalSeconds <= 0 || remainingSeconds <= 0) {
            return BigDecimal.ZERO;
        }
        return paid.multiply(BigDecimal.valueOf(remainingSeconds))
                .divide(BigDecimal.valueOf(totalSeconds), 0, RoundingMode.HALF_UP);
    }

    // Cổng thanh toán có số tiền tối thiểu mỗi giao dịch
    public BigDecimal chargeableAmount(BigDecimal due) {
        BigDecimal min = BigDecimal.valueOf(minCharge);
        return due.signum() > 0 && due.compareTo(min) < 0 ? min : due;
    }

    // ---------------------------------------------------------------------
    // Trạng thái gói
    // ---------------------------------------------------------------------

    /**
     * Gói đang còn hiệu lực theo kỳ thanh toán (dùng để quyết định mua mới / nâng /
     * hạ).
     */
    public boolean isEffective(Subscription sub, LocalDateTime now) {
        if (sub == null)
            return false;
        return switch (sub.getStatus()) {
            case ACTIVE -> sub.getCurrentPeriodEnd() == null || sub.getCurrentPeriodEnd().isAfter(now);
            case GRACE_PERIOD -> sub.getGracePeriodEnd() != null && sub.getGracePeriodEnd().isAfter(now);
            case EXPIRED -> false;
        };
    }

    /**
     * Quyền dùng dịch vụ: gói ân hạn vẫn được dùng; thêm khoảng đệm nhỏ phòng khi
     * cron chậm, tránh tắt cảnh báo té ngã oan.
     */
    public boolean isEntitled(Subscription sub, LocalDateTime now) {
        if (sub == null)
            return false;
        return switch (sub.getStatus()) {
            case ACTIVE -> sub.getCurrentPeriodEnd() == null
                    || sub.getCurrentPeriodEnd().isAfter(now.minusHours(entitlementSlackHours));
            case GRACE_PERIOD -> sub.getGracePeriodEnd() != null && sub.getGracePeriodEnd().isAfter(now);
            case EXPIRED -> false;
        };
    }

    /**
     * Gia hạn được khi đang ân hạn, hoặc còn không quá renewWindowDays ngày (gia
     * hạn sớm).
     */
    public boolean canRenewNow(Subscription sub, LocalDateTime now) {
        if (sub == null || sub.getCurrentPeriodEnd() == null)
            return false;
        return switch (sub.getStatus()) {
            case GRACE_PERIOD -> sub.getGracePeriodEnd() != null && sub.getGracePeriodEnd().isAfter(now);
            case ACTIVE -> sub.getPendingPlan() == null && remainingDays(sub, now) <= renewWindowDays;
            case EXPIRED -> false;
        };
    }

    public long remainingDays(Subscription sub, LocalDateTime now) {
        if (sub == null || sub.getCurrentPeriodEnd() == null || !sub.getCurrentPeriodEnd().isAfter(now))
            return 0;
        return (long) Math.ceil(Duration.between(now, sub.getCurrentPeriodEnd()).toHours() / 24.0);
    }

    public boolean isFree(ServicePackage plan) {
        return plan.getPrice() == null || plan.getPrice().signum() == 0;
    }
}