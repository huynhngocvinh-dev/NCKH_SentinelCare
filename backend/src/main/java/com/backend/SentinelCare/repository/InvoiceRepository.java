package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.Invoice;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByIdempotencyKey(String idempotencyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Invoice> findWithLockById(Long id);

    Page<Invoice> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Invoice> findByUserIdAndStatus(Long userId, Invoice.Status status);

    // Hóa đơn người dùng bỏ dở (không phải gia hạn tự động)
    List<Invoice> findByStatusAndTypeInAndCreatedAtBefore(Invoice.Status status,
            Collection<Invoice.Type> types,
            LocalDateTime before);
}