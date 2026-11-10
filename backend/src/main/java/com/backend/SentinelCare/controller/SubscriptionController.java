package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.SubscriptionDtos.*;
import com.backend.SentinelCare.model.ServicePackage;
import com.backend.SentinelCare.security.CurrentUserResolver;
import com.backend.SentinelCare.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final CurrentUserResolver currentUser;

    @GetMapping("/plans")
    public ResponseEntity<List<ServicePackage>> plans() {
        return ResponseEntity.ok(subscriptionService.getPlans());
    }

    @GetMapping("/me")
    public ResponseEntity<MySubscriptionResponse> me(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getMySubscription(currentUser.requireUserId(authentication)));
    }

    @GetMapping("/quote")
    public ResponseEntity<QuoteResponse> quote(@RequestParam("plan_id") Integer planId, Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.quote(currentUser.requireUserId(authentication), planId));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<SubscribeResponse> subscribe(@Valid @RequestBody SubscribeRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(subscriptionService.subscribe(
                currentUser.requireUserId(authentication), request, clientIp(httpRequest)));
    }

    // Gia hạn trong ân hạn hoặc gia hạn sớm: trả về URL VNPAY
    @PostMapping("/renew")
    public ResponseEntity<SubscribeResponse> renew(@RequestBody(required = false) RenewRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(subscriptionService.renew(
                currentUser.requireUserId(authentication), request, clientIp(httpRequest)));
    }

    @PostMapping("/cancel-auto-renew")
    public ResponseEntity<MySubscriptionResponse> cancelAutoRenew(@RequestBody CancelAutoRenewRequest request,
            Authentication authentication) {
        return ResponseEntity
                .ok(subscriptionService.cancelAutoRenew(currentUser.requireUserId(authentication), request));
    }

    @PostMapping("/resume-auto-renew")
    public ResponseEntity<MySubscriptionResponse> resumeAutoRenew(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.resumeAutoRenew(currentUser.requireUserId(authentication)));
    }

    @DeleteMapping("/pending-change")
    public ResponseEntity<Map<String, String>> cancelPendingChange(Authentication authentication) {
        subscriptionService.cancelPendingChange(currentUser.requireUserId(authentication));
        return ResponseEntity.ok(Map.of("message", "Đã hủy thay đổi gói đang chờ hiệu lực."));
    }

    @GetMapping("/invoices")
    public ResponseEntity<Map<String, Object>> invoices(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        return ResponseEntity
                .ok(toPage(subscriptionService.getInvoices(currentUser.requireUserId(authentication), page, size)));
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<InvoiceResponse> invoice(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getInvoice(currentUser.requireUserId(authentication), id));
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> history(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        return ResponseEntity
                .ok(toPage(subscriptionService.getHistory(currentUser.requireUserId(authentication), page, size)));
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

    // VNPAY yêu cầu IPv4: đổi loopback IPv6 về 127.0.0.1
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
        return ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) ? "127.0.0.1" : ip;
    }
}