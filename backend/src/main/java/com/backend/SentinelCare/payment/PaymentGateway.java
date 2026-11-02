package com.backend.SentinelCare.payment;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentGateway {

    // linkType: WALLET (liên kết ví + trừ kỳ đầu) | CARD (thẻ Visa/Mastercard + lưu
    // thẻ) | ONE_TIME (gói trọn đời)
    record PaymentLinkRequest(String linkType, String orderId, BigDecimal amount, String orderInfo,
            String partnerClientId, String customerEmail,
            String returnUrl, String ipnUrl) {
    }

    // Thông báo (IPN / URL quay về) đã kiểm tra chữ ký
    record Notification(boolean signatureValid, String orderId, long amount, int resultCode,
            boolean finalResult, boolean success, String transactionId,
            String callbackToken, String partnerClientId, String message) {
    }

    // Thông tin token sau khi giải mã. Chỉ có 4 số cuối và loại thẻ, KHÔNG có số
    // thẻ đầy đủ.
    record TokenInfo(String value, String brand, String last4, String alias) {
    }

    enum ChargeStatus {
        SUCCESS, FAILED, REAUTH_REQUIRED, UNKNOWN
    }

    record ChargeResult(ChargeStatus status, int resultCode, String transactionId, String message) {
    }

    // Tạo link/QR đăng ký auto-debit và thanh toán kỳ đầu, trả về payUrl
    String createPaymentLink(PaymentLinkRequest request);

    Notification verifyNotification(Map<String, String> params);

    // Thông báo người dùng hủy liên kết ngay trong app ví
    boolean verifyUnbindNotification(Map<String, String> params);

    String queryCallbackToken(String orderId, String partnerClientId);

    // tokenType: WALLET | CARD
    TokenInfo bindToken(String callbackToken, String orderId, String partnerClientId, String tokenType);

    // Merchant-Initiated Transaction: trừ tiền bằng token, không cần người dùng
    // thao tác
    ChargeResult chargeWithToken(String orderId, BigDecimal amount, String orderInfo,
            String partnerClientId, String token, String ipnUrl);

    // Đối soát một giao dịch (dùng khi lần trừ tiền trước bị timeout, chưa biết kết
    // quả)
    ChargeResult queryTransaction(String orderId);

    void deleteToken(String partnerClientId, String token);
}