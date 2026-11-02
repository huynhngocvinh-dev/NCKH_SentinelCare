package com.backend.SentinelCare.model;

import com.backend.SentinelCare.util.Utc;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "subscriptions",
    uniqueConstraints = @UniqueConstraint(name = "uk_subscriptions_user", columnNames = "user_id")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    public enum Status { ACTIVE, GRACE_PERIOD, EXPIRED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private Account user;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private ServicePackage plan;

    // Hạ gói: gói này sẽ bắt đầu ở kỳ thanh toán tiếp theo
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pending_plan_id")
    private ServicePackage pendingPlan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
    private Status status;

    // TẤT CẢ thời gian dưới đây lưu theo UTC
    @Column(name = "current_period_start", nullable = false)
    private LocalDateTime currentPeriodStart;

    // null = gói trọn đời
    @Column(name = "current_period_end")
    private LocalDateTime currentPeriodEnd;

    // Số tiền đã trả cho kỳ hiện tại (dùng để quy đổi khi nâng gói)
    @Column(name = "current_period_amount", precision = 12, scale = 2)
    private BigDecimal currentPeriodAmount;

    @Column(name = "auto_renew", nullable = false)
    private boolean autoRenew;

    // Phương thức (token) dùng để trừ tiền tự động
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payment_method_id")
    private UserPaymentMethod paymentMethod;

    // Hết hạn ân hạn (chỉ có khi GRACE_PERIOD)
    @Column(name = "grace_period_end")
    private LocalDateTime gracePeriodEnd;

    @Column(name = "retry_count")
    private Integer retryCount;

    @Column(name = "last_billing_attempt_at")
    private LocalDateTime lastBillingAttemptAt;

    @Column(name = "last_payment_error", length = 255)
    private String lastPaymentError;

    @Column(name = "renewal_reminder_sent_at")
    private LocalDateTime renewalReminderSentAt;

    // Thu thập feedback khi người dùng hủy gia hạn
    @Column(name = "cancel_reason", length = 100)
    private String cancelReason;

    @Column(name = "cancel_feedback", length = 500)
    private String cancelFeedback;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = Utc.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Utc.now();
    }
}