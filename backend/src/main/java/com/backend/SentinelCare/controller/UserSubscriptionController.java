package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.PurchaseRequest;
import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.model.ServicePackage;
import com.backend.SentinelCare.model.UserSubscription;
import com.backend.SentinelCare.repository.AccountRepository;
import com.backend.SentinelCare.repository.ServicePackageRepository;
import com.backend.SentinelCare.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class UserSubscriptionController {

    private final SubscriptionService subscriptionService;
    private final ServicePackageRepository packageRepository;
    private final AccountRepository accountRepository;

    // Danh sách gói dịch vụ (công khai)
    @GetMapping("/packages")
    public ResponseEntity<List<ServicePackage>> getAllPackages() {
        return ResponseEntity.ok(packageRepository.findAll());
    }

    // Mua gói cho CHÍNH tài khoản đang đăng nhập
    @PostMapping("/purchase")
    public ResponseEntity<?> purchasePackage(@RequestBody PurchaseRequest request,
                                             Authentication authentication) {
        Account account = currentAccount(authentication);
        UserSubscription sub = subscriptionService.processPackagePurchase(
                account.getId(), request.getPackageId(), request.getPaymentGateway());
        return ResponseEntity.ok(Map.of(
                "message", "Thanh toán và kích hoạt gói thành công!",
                "subscriptionId", sub.getId(),
                "packageCode", sub.getPkg().getCode(),
                "expiredAt", sub.getExpiredAt() != null ? sub.getExpiredAt().toString() : "LIFETIME"
        ));
    }

    // Hủy gói của CHÍNH tài khoản đang đăng nhập
    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(
            @RequestParam(defaultValue = "false") boolean cancelImmediately,
            Authentication authentication) {
        Account account = currentAccount(authentication);
        subscriptionService.cancelSubscription(account.getId(), cancelImmediately);
        return ResponseEntity.ok(Map.of(
                "message", cancelImmediately
                        ? "Đã hủy gói dịch vụ và quay về gói Freemium."
                        : "Đã tắt tự động gia hạn."
        ));
    }

    private Account currentAccount(Authentication authentication) {
        String identifier = authentication.getName();
        return accountRepository.findByEmail(identifier)
                .or(() -> accountRepository.findByPhoneNumber(identifier))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản đăng nhập!"));
    }
}