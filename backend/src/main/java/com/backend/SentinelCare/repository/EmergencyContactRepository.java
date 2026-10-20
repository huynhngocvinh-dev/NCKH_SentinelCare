package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {

    // Danh sách người thân của 1 tài khoản, đã xếp theo mức ưu tiên tăng dần
    List<EmergencyContact> findByAccountIdOrderByPriorityOrderAsc(Long accountId);

    boolean existsByAccountIdAndPhoneNumber(Long accountId, String phoneNumber);
}