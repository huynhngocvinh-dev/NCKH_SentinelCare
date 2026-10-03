package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.PackageRequest;
import com.backend.SentinelCare.model.Feature;
import com.backend.SentinelCare.model.ServicePackage;
import com.backend.SentinelCare.repository.FeatureRepository;
import com.backend.SentinelCare.repository.ServicePackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;

@RestController
@RequestMapping("/api/admin/packages")
@RequiredArgsConstructor
public class AdminPackageController {

    private final ServicePackageRepository packageRepository;
    private final FeatureRepository featureRepository;

    @GetMapping
    public ResponseEntity<List<ServicePackage>> getAllPackages() {
        return ResponseEntity.ok(packageRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<ServicePackage> createPackage(@RequestBody PackageRequest dto) {
        List<Feature> features = featureRepository.findAllById(dto.getFeatureIds());

        ServicePackage pkg = ServicePackage.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .price(dto.getPrice())
                .durationDays(dto.getDurationDays())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .features(new HashSet<>(features))
                .build();

        return ResponseEntity.ok(packageRepository.save(pkg));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServicePackage> updatePackage(
            @PathVariable Integer id,
            @RequestBody PackageRequest dto) {
        ServicePackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("goi dich vu khong ton tai"));

        List<Feature> features = featureRepository.findAllById(dto.getFeatureIds());

        pkg.setName(dto.getName());
        pkg.setPrice(dto.getPrice());
        pkg.setDurationDays(dto.getDurationDays());
        if (dto.getIsActive() != null) pkg.setIsActive(dto.getIsActive());
        pkg.setFeatures(new HashSet<>(features));

        return ResponseEntity.ok(packageRepository.save(pkg));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> disablePackage(@PathVariable Integer id) {
        ServicePackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("goi dich vu khong ton tai"));
        
        // Soft delete: Ẩn gói để giữ lịch sử giao dịch người dùng
        pkg.setIsActive(false);
        packageRepository.save(pkg);

        return ResponseEntity.ok("da vo hieu hoa goi dich vu thanh cong!");
    }
}