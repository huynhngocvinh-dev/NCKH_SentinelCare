package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.PurchaseRequest;
import com.backend.SentinelCare.model.ServicePackage;
import com.backend.SentinelCare.model.UserSubscription;
import com.backend.SentinelCare.repository.ServicePackageRepository;
import com.backend.SentinelCare.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class UserSubscriptionController {

    private final SubscriptionService subscriptionService;
    private final ServicePackageRepository packageRepository;

    /**
     * Lấy danh sách tất cả các gói dịch vụ
     */
    @GetMapping("/packages")
    public ResponseEntity<List<ServicePackage>> getAllPackages() {
        return ResponseEntity.ok(packageRepository.findAll());
    }

    /**
     * Mua / Đăng ký gói dịch vụ
     */
    @PostMapping("/purchase")
    public ResponseEntity<?> purchasePackage(
            @RequestParam Long userId,
            @RequestBody PurchaseRequest request) {
        UserSubscription sub = subscriptionService.processPackagePurchase(
                userId, request.getPackageId(), request.getPaymentGateway());
        return ResponseEntity.ok(Map.of(
                "message", "Thanh toán và kích hoạt gói thành công!",
                "subscriptionId", sub.getId(),
                "packageCode", sub.getPkg().getCode(),
                "expiredAt", sub.getExpiredAt() != null ? sub.getExpiredAt().toString() : "LIFETIME"
        ));
    }

    /**
     * Hủy gói dịch vụ
     */
    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "false") boolean cancelImmediately) {
        subscriptionService.cancelSubscription(userId, cancelImmediately);
        return ResponseEntity.ok(Map.of(
                "message", cancelImmediately ? "Đã hủy gói dịch vụ và quay về gói Freemium." : "Đã tắt tự động gia hạn."
        ));
    }
}