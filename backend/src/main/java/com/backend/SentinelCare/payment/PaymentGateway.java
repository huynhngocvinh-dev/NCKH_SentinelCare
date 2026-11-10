package com.backend.SentinelCare.payment;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentGateway {

        record PaymentRequest(String txnRef, BigDecimal amount, String orderInfo,
                        String bankCode, String returnUrl, String clientIp) {
        }

        /** Kết quả (IPN hoặc URL quay về) đã được kiểm tra chữ ký. */
        record Notification(boolean signatureValid, String txnRef, long amount, boolean success,
                        String transactionNo, String responseCode, String message) {
        }

        /** Tạo URL chuyển hướng người dùng sang trang thanh toán của cổng. */
        String createPaymentUrl(PaymentRequest request);

        Notification verifyNotification(Map<String, String> params);
}