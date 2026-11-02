package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.ServicePackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServicePackageRepository extends JpaRepository<ServicePackage, Integer> {
    Optional<ServicePackage> findByCode(String code);

    List<ServicePackage> findByIsActiveTrueOrderByPriceAsc();
}