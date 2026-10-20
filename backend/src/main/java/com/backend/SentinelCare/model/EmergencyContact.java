package com.backend.SentinelCare.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "emergency_contacts",
    uniqueConstraints = @UniqueConstraint(columnNames = {"account_id", "phone_number"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tài khoản chủ sở hữu danh sách người thân này
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "contact_name", length = 100, nullable = false)
    private String contactName;

    @Column(length = 50)
    private String relationship;

    @Column(name = "phone_number", length = 20, nullable = false)
    private String phoneNumber;

    @Column(name = "priority_order")
    private Integer priorityOrder;

    @Column(name = "email", length = 255)
    private String email;

    // true = đây chính là chủ tài khoản (mặc định ưu tiên 1, không được xóa)
    @Column(name = "account_owner", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean accountOwner;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}