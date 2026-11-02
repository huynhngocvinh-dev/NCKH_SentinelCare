package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.payment.PaymentGateway;
import com.backend.SentinelCare.repository.AccountRepository;
import com.backend.SentinelCare.service.InvoiceSettlementService;
import com.backend.SentinelCare.service.InvoiceSettlementService.Result;
import com.backend.SentinelCare.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookController {

    private final InvoiceSettlementService settlement;
    private final SubscriptionService subscriptionService;
    private final PaymentGateway gateway;
    private final AccountRepository accountRepository;

    public record ReturnRequest(Map<String, String> params) {
    }

    // ---------- MoMo IPN (POST JSON) ----------
    @PostMapping("/momo/ipn")
    public ResponseEntity<Void> momoIpn(@RequestBody Map<String, Object> body) {
        try {
            Result result = settlement.handleNotification(toStringMap(body), null);
            return switch (result) {
                case INVALID_SIGNATURE, AMOUNT_MISMATCH, FORBIDDEN -> ResponseEntity.badRequest().build();
                // OK / ALREADY_PROCESSED / ORDER_NOT_FOUND: trả 204 để MoMo không gửi lại vô
                // hạn
                default -> ResponseEntity.noContent().build();
            };
        } catch (Exception e) {
            log.error("Lỗi xử lý IPN MoMo", e);
            return ResponseEntity.status(500).build(); // MoMo sẽ gửi lại
        }
    }

    // ---------- MoMo báo người dùng hủy liên kết trong app ví ----------
    @PostMapping("/momo/unbind")
    public ResponseEntity<Void> momoUnbind(@RequestBody Map<String, Object> body) {
        try {
            Map<String, String> params = toStringMap(body);
            if (!gateway.verifyUnbindNotification(params)) {
                return ResponseEntity.badRequest().build();
            }
            subscriptionService.onPaymentMethodUnbound(params.get("partnerClientId"));
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Lỗi xử lý thông báo hủy liên kết MoMo", e);
            return ResponseEntity.status(500).build();
        }
    }

    // ---------- Người dùng quay về từ MoMo: backend tự kiểm tra chữ ký rồi cập
    // nhật hóa đơn ----------
    @PostMapping("/return")
    public ResponseEntity<?> confirmReturn(@RequestBody ReturnRequest request, Authentication authentication) {
        if (request.params() == null || request.params().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin giao dịch."));
        }
        Long userId = currentUserId(authentication);
        Result result = settlement.handleNotification(request.params(), userId);

        return switch (result) {
            case INVALID_SIGNATURE ->
                ResponseEntity.badRequest().body(Map.of("message", "Chữ ký giao dịch không hợp lệ."));
            case FORBIDDEN ->
                ResponseEntity.status(403).body(Map.of("message", "Giao dịch không thuộc tài khoản này."));
            case ORDER_NOT_FOUND -> ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy giao dịch."));
            case AMOUNT_MISMATCH -> ResponseEntity.status(409).body(Map.of("message", "Số tiền không khớp hóa đơn."));
            default -> ResponseEntity.ok(Map.of("result", result.name()));
        };
    }

    private Map<String, String> toStringMap(Map<String, Object> body) {
        Map<String, String> result = new HashMap<>();
        body.forEach((key, value) -> result.put(key, value == null ? "" : String.valueOf(value)));
        return result;
    }

    private Long currentUserId(Authentication authentication) {
        String identifier = authentication.getName();
        Account account = accountRepository.findByEmail(identifier)
                .or(() -> accountRepository.findByPhoneNumber(identifier))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản đăng nhập!"));
        return account.getId();
    }
}