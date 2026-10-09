package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {

    List<EmergencyContact> findByPhoneNumber(String phoneNumber);

    // Tìm danh sách người thân theo patient_id và tự động sắp xếp theo thứ tự ưu tiên gọi (priorityOrder ASC)
    List<EmergencyContact> findByPatientIdOrderByPriorityOrderAsc(Long patientId);

    // Hoặc hàm tìm theo patient_id cơ bản
    List<EmergencyContact> findByPatientId(Long patientId);
}