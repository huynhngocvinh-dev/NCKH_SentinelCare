package com.backend.SentinelCare.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_logs", indexes = @Index(name = "idx_sublog_user_time", columnList = "user_id, created_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionLog {

    public enum Action {
        ORDER_CREATED, PAYMENT_SUCCESS, PAYMENT_FAILED,
        SUBSCRIPTION_ACTIVATED, UPGRADED, DOWNGRADE_SCHEDULED, DOWNGRADE_CANCELLED,
        AUTO_RENEW_ENABLED, AUTO_RENEW_DISABLED,
        RENEWAL_REMINDER_SENT, RENEWED, RENEWAL_FAILED,
        GRACE_STARTED, GRACE_RECOVERED,
        EXPIRED, CANCELLED_IMMEDIATELY,
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Account user;

    @Column(name = "subscription_id")
    private Long subscriptionId;

    @Column(name = "invoice_id")
    private Long invoiceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40, columnDefinition = "VARCHAR(40)")
    private Action action;

    @Column(name = "from_status", length = 20)
    private String fromStatus;

    @Column(name = "to_status", length = 20)
    private String toStatus;

    @Column(name = "from_package", length = 50)
    private String fromPackage;

    @Column(name = "to_package", length = 50)
    private String toPackage;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    // USER = người dùng tự thao tác, SYSTEM = job/webhook
    @Column(nullable = false, length = 10)
    private String actor;

    @Column(length = 500)
    private String message;

    // UTC
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}