package com.backend.SentinelCare.model;

import com.backend.SentinelCare.util.Utc;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_payment_methods", indexes = @Index(name = "idx_upm_user", columnList = "user_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPaymentMethod {

    public enum Type { WALLET, CARD }

    // REVOKED: người dùng/hệ thống đã hủy liên kết; INVALID: cổng báo token không còn hợp lệ
    public enum Status { ACTIVE, REVOKED, INVALID }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private Account user;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String provider = "MOMO";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    // Payment Token đã MÃ HÓA (AES-GCM). Tuyệt đối không ghi log.
    @ToString.Exclude
    @Column(name = "token_encrypted", nullable = false, columnDefinition = "TEXT")
    private String tokenEncrypted;

    // Mã người dùng gửi cho cổng khi liên kết (bắt buộc khớp khi trừ tiền / hủy token)
    @Column(name = "partner_client_id", nullable = false, length = 64)
    private String partnerClientId;

    // orderId của lần liên kết đầu (MoMo dùng khi thông báo hủy liên kết)
    @Column(name = "bind_order_id", nullable = false, length = 64)
    private String bindOrderId;

    @Column(length = 20)
    private String brand;      // VISA | MASTERCARD | JCB | MOMO

    @Column(length = 4)
    private String last4;      // chỉ 4 số cuối do cổng trả về

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "is_default", nullable = false)
    private boolean defaultMethod;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @PrePersist
    void onCreate() {
        createdAt = Utc.now();
    }
}