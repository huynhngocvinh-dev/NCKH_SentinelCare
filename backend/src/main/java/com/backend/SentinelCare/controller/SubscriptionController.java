package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.SubscriptionDtos.*;
import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.model.ServicePackage;
import com.backend.SentinelCare.repository.AccountRepository;
import com.backend.SentinelCare.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final AccountRepository accountRepository;

    @GetMapping("/plans")
    public ResponseEntity<List<ServicePackage>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getPlans());
    }

    @GetMapping("/me")
    public ResponseEntity<MySubscriptionResponse> me(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getMySubscription(currentUserId(authentication)));
    }

    @GetMapping("/quote")
    public ResponseEntity<QuoteResponse> quote(@RequestParam("plan_id") Integer planId, Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.quote(currentUserId(authentication), planId));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<SubscribeResponse> subscribe(@Valid @RequestBody SubscribeRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.subscribe(currentUserId(authentication), request));
    }

    @PostMapping("/cancel-auto-renew")
    public ResponseEntity<MySubscriptionResponse> cancelAutoRenew(@RequestBody CancelAutoRenewRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.cancelAutoRenew(currentUserId(authentication), request));
    }

    @PostMapping("/resume-auto-renew")
    public ResponseEntity<MySubscriptionResponse> resumeAutoRenew(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.resumeAutoRenew(currentUserId(authentication)));
    }

    @DeleteMapping("/pending-change")
    public ResponseEntity<?> cancelPendingChange(Authentication authentication) {
        subscriptionService.cancelPendingChange(currentUserId(authentication));
        return ResponseEntity.ok(Map.of("message", "Đã hủy thay đổi gói đang chờ hiệu lực."));
    }

    @GetMapping("/invoices")
    public ResponseEntity<Map<String, Object>> invoices(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        return ResponseEntity.ok(toPage(subscriptionService.getInvoices(currentUserId(authentication), page, size)));
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<InvoiceResponse> invoice(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getInvoice(currentUserId(authentication), id));
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<List<PaymentMethodResponse>> paymentMethods(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getPaymentMethods(currentUserId(authentication)));
    }

    @DeleteMapping("/payment-methods/{id}")
    public ResponseEntity<?> removePaymentMethod(@PathVariable Long id, Authentication authentication) {
        subscriptionService.removePaymentMethod(currentUserId(authentication), id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa phương thức thanh toán. Gói sẽ không tự động gia hạn."));
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> history(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        return ResponseEntity.ok(toPage(subscriptionService.getHistory(currentUserId(authentication), page, size)));
    }

    private Map<String, Object> toPage(Page<?> result) {
        return Map.of(
                "content", result.getContent(),
                "page", result.getNumber(),
                "size", result.getSize(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "last", result.isLast());
    }

    private Long currentUserId(Authentication authentication) {
        String identifier = authentication.getName();
        Account account = accountRepository.findByEmail(identifier)
                .or(() -> accountRepository.findByPhoneNumber(identifier))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản đăng nhập!"));
        return account.getId();
    }
}