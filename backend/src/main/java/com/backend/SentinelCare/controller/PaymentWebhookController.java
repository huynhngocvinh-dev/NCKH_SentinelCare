package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.repository.AccountRepository;
import com.backend.SentinelCare.service.InvoiceSettlementService;
import com.backend.SentinelCare.service.InvoiceSettlementService.Result;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookController {

    private final InvoiceSettlementService settlement;
    private final AccountRepository accountRepository;

    public record ReturnRequest(Map<String, String> params) {
    }

    /**
     * IPN của VNPAY (server gọi server, method GET, không có token đăng nhập).
     * VNPAY luôn cần HTTP 200 kèm RspCode; mã khác 00/02 thì VNPAY sẽ gọi lại.
     */
    @GetMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> params) {
        try {
            Result result = settlement.handleNotification(params, null);
            return ResponseEntity.ok(switch (result) {
                case OK -> ipn("00", "Confirm Success");
                case ALREADY_PROCESSED -> ipn("02", "Order already confirmed");
                case ORDER_NOT_FOUND -> ipn("01", "Order not found");
                case AMOUNT_MISMATCH -> ipn("04", "Invalid amount");
                case INVALID_SIGNATURE -> ipn("97", "Invalid signature");
                default -> ipn("99", "Unknown error");
            });
        } catch (Exception e) {
            log.error("Lỗi xử lý IPN VNPAY", e);
            return ResponseEntity.ok(ipn("99", "Unknown error"));
        }
    }

    /**
     * Người dùng quay về từ VNPAY: frontend gửi toàn bộ query vnp_* lên đây,
     * backend tự kiểm tra chữ ký rồi cập nhật hóa đơn.
     */
    @PostMapping("/return")
    public ResponseEntity<?> confirmReturn(@RequestBody ReturnRequest request, Authentication authentication) {
        if (request.params() == null || request.params().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin giao dịch."));
        }

        Result result = settlement.handleNotification(request.params(), currentUserId(authentication));

        return switch (result) {
            case INVALID_SIGNATURE ->
                ResponseEntity.badRequest().body(Map.of("message", "Chữ ký giao dịch không hợp lệ."));
            case FORBIDDEN ->
                ResponseEntity.status(403).body(Map.of("message", "Giao dịch không thuộc tài khoản này."));
            case ORDER_NOT_FOUND ->
                ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy giao dịch."));
            case AMOUNT_MISMATCH ->
                ResponseEntity.status(409).body(Map.of("message", "Số tiền không khớp hóa đơn."));
            default -> ResponseEntity.ok(Map.of("result", result.name()));
        };
    }

    private static Map<String, String> ipn(String code, String message) {
        return Map.of("RspCode", code, "Message", message);
    }

    private Long currentUserId(Authentication authentication) {
        String identifier = authentication.getName();
        Account account = accountRepository.findByEmail(identifier)
                .or(() -> accountRepository.findByPhoneNumber(identifier))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản đăng nhập!"));
        return account.getId();
    }
}