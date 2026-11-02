package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.UserPaymentMethod;
import com.backend.SentinelCare.model.UserPaymentMethod.Status;
import com.backend.SentinelCare.model.UserPaymentMethod.Type;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserPaymentMethodRepository extends JpaRepository<UserPaymentMethod, Long> {

    List<UserPaymentMethod> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, Status status);

    Optional<UserPaymentMethod> findByIdAndUserId(Long id, Long userId);

    List<UserPaymentMethod> findByPartnerClientIdAndStatus(String partnerClientId, Status status);

    long countByUserIdAndType(Long userId, Type type);
}