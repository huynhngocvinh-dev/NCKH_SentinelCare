package com.backend.SentinelCare.model;

import com.backend.SentinelCare.util.Utc;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices", uniqueConstraints = @UniqueConstraint(name = "uk_invoices_idempotency", columnNames = "idempotency_key"), indexes = @Index(name = "idx_invoices_user_time", columnList = "user_id, created_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    public enum Type {
        INITIAL, UPGRADE, RENEWAL, RECOVERY
    }

    public enum Status {
        PENDING, PAID, FAILED, CANCELED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private Account user;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private ServicePackage plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    // Số tiền thực thu = listPrice - prorationCredit
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "list_price", precision = 12, scale = 2)
    private BigDecimal listPrice;

    @Column(name = "proration_credit", precision = 12, scale = 2)
    private BigDecimal prorationCredit;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "VND";

    // Kênh thanh toán đã chọn: xem PaymentChannel.
    @Column(name = "method_type", length = 20)
    private String methodType;

    @ToString.Exclude

    // Chống trừ tiền trùng: RENEW_{    subscription_id}_{yyyyMMdd của
    // current_period_end, UTC}
    @Column(name = "idempotency_key", nullable = false, length = 100)
    private String idempotencyKey;

    // orderId gửi sang cổng ở lần thử gần nhất: {prefix}{invoiceId}A{attempt}
    @Column(name = "gateway_order_id", length = 64)
    private String gatewayOrderId;

    @Column(name = "gateway_transaction_id", length = 64)
    private String gatewayTransactionId;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(name = "attempt_count")
    private Integer attemptCount;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    @Column(name = "period_start")
    private LocalDateTime periodStart;

    @Column(name = "period_end")
    private LocalDateTime periodEnd;

    @Column(name = "failure_code", length = 20)
    private String failureCode;

    @Column(name = "failure_message", length = 255)
    private String failureMessage;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null)
            createdAt = Utc.now();
    }
}