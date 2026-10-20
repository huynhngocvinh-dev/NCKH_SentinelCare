package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.FallIncident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FallIncidentRepository extends JpaRepository<FallIncident, Long> {
    List<FallIncident> findAllByOrderByIncidentTimeDesc();

    // Tìm sự cố đang đếm ngược 25s của người bệnh
    Optional<FallIncident> findFirstByPatientIdAndStatusOrderByIncidentTimeDesc(
            Long patientId, FallIncident.IncidentStatus status);

    // Tìm sự cố gần nhất theo mốc thời gian & trạng thái để gộp báo động
    Optional<FallIncident> findFirstByIncidentTimeAfterAndStatusOrderByIncidentTimeDesc(
            LocalDateTime incidentTime, FallIncident.IncidentStatus status);

    // Lịch sử sự cố của 1 tài khoản (có phân trang)
    @Query("SELECT i FROM FallIncident i " +
           "LEFT JOIN i.patient p " +
           "LEFT JOIN i.cameraDevice c " +
           "LEFT JOIN c.address a " +
           "WHERE p.account.id = :accountId OR a.account.id = :accountId")
    Page<FallIncident> findByOwnerAccountId(@Param("accountId") Long accountId, Pageable pageable);

    // Sự cố có thuộc tài khoản này không (kiểm tra quyền trước khi xác nhận)
    @Query("SELECT COUNT(i) > 0 FROM FallIncident i " +
           "LEFT JOIN i.patient p " +
           "LEFT JOIN i.cameraDevice c " +
           "LEFT JOIN c.address a " +
           "WHERE i.id = :incidentId AND (p.account.id = :accountId OR a.account.id = :accountId)")
    boolean existsByIdAndOwnerAccountId(@Param("incidentId") Long incidentId,
                                        @Param("accountId") Long accountId);
}