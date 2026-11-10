package com.backend.SentinelCare.payment;

import com.backend.SentinelCare.exception.BusinessException;
import com.backend.SentinelCare.util.HmacUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

@Component
public class VnpayGateway implements PaymentGateway {

    private static final String API_VERSION = "2.1.0";
    private static final String SUCCESS_CODE = "00";
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final Set<String> SIGNATURE_FIELDS = Set.of("vnp_SecureHash", "vnp_SecureHashType");

    private static final Map<String, String> FAILURE_MESSAGES = Map.ofEntries(
            Map.entry("07", "Giao dịch bị nghi ngờ gian lận. Vui lòng liên hệ ngân hàng."),
            Map.entry("09", "Thẻ/tài khoản chưa đăng ký dịch vụ Internet Banking."),
            Map.entry("10", "Xác thực thông tin thẻ/tài khoản sai quá 3 lần."),
            Map.entry("11", "Đã hết thời gian chờ thanh toán. Vui lòng thực hiện lại."),
            Map.entry("12", "Thẻ/tài khoản đang bị khóa."),
            Map.entry("13", "Mã OTP xác thực không hợp lệ."),
            Map.entry("24", "Bạn đã hủy giao dịch."),
            Map.entry("51", "Tài khoản không đủ số dư để thanh toán."),
            Map.entry("65", "Tài khoản đã vượt hạn mức giao dịch trong ngày."),
            Map.entry("75", "Ngân hàng thanh toán đang bảo trì. Vui lòng thử lại sau."),
            Map.entry("79", "Nhập sai mật khẩu thanh toán quá số lần quy định."),
            Map.entry("99", "Lỗi không xác định từ cổng thanh toán."));

    @Value("${payment.vnpay.tmn-code:}")
    private String tmnCode;

    @Value("${payment.vnpay.hash-secret:}")
    private String hashSecret;

    @Value("${payment.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String payUrl;

    @Value("${payment.vnpay.expire-minutes:15}")
    private int expireMinutes;

    @Override
    public String createPaymentUrl(PaymentRequest request) {
        requireConfigured();
        LocalDateTime now = LocalDateTime.now(VIETNAM);

        Map<String, String> fields = new TreeMap<>(); // xếp a-z như VNPAY yêu cầu
        fields.put("vnp_Version", API_VERSION);
        fields.put("vnp_Command", "pay");
        fields.put("vnp_TmnCode", tmnCode);
        fields.put("vnp_Amount", toVnpayAmount(request.amount()));
        fields.put("vnp_CurrCode", "VND");
        fields.put("vnp_TxnRef", request.txnRef());
        fields.put("vnp_OrderInfo", toAscii(request.orderInfo()));
        fields.put("vnp_OrderType", "other");
        fields.put("vnp_Locale", "vn");
        fields.put("vnp_ReturnUrl", request.returnUrl());
        fields.put("vnp_IpAddr",
                request.clientIp() == null || request.clientIp().isBlank() ? "127.0.0.1" : request.clientIp());
        fields.put("vnp_CreateDate", now.format(TIMESTAMP));
        fields.put("vnp_ExpireDate", now.plusMinutes(expireMinutes).format(TIMESTAMP));
        if (request.bankCode() != null) {
            fields.put("vnp_BankCode", request.bankCode());
        }

        String query = toQueryString(fields);
        return payUrl + "?" + query + "&vnp_SecureHash=" + sign(query);
    }

    @Override
    public Notification verifyNotification(Map<String, String> params) {
        Map<String, String> signedFields = new TreeMap<>();
        params.forEach((key, value) -> {
            if (key.startsWith("vnp_") && !SIGNATURE_FIELDS.contains(key) && value != null && !value.isEmpty()) {
                signedFields.put(key, value);
            }
        });

        boolean valid = isConfigured()
                && tmnCode.equals(params.get("vnp_TmnCode"))
                && HmacUtil.constantTimeEquals(sign(toQueryString(signedFields)), params.get("vnp_SecureHash"));

        String responseCode = params.getOrDefault("vnp_ResponseCode", "99");
        boolean success = SUCCESS_CODE.equals(responseCode)
                && SUCCESS_CODE.equals(params.getOrDefault("vnp_TransactionStatus", SUCCESS_CODE));

        long amount = -1;
        try {
            amount = Long.parseLong(params.getOrDefault("vnp_Amount", "")) / 100;
        } catch (NumberFormatException e) {
            valid = false;
        }

        return new Notification(valid, params.get("vnp_TxnRef"), amount, success, params.get("vnp_TransactionNo"),
                responseCode, success ? null : describeFailure(responseCode));
    }

    // ---------- Chi tiết kỹ thuật ----------

    private String describeFailure(String code) {
        return FAILURE_MESSAGES.getOrDefault(code, "Thanh toán không thành công (mã VNPAY " + code + ").");
    }

    // VNPAY quy định số tiền nhân 100, không có phần thập phân
    private String toVnpayAmount(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).toBigInteger().toString();
    }

    // name=giá-trị-đã-URL-encode, nối bằng &. Cùng một chuỗi dùng để ký và để gửi
    // đi.
    private String toQueryString(Map<String, String> sortedFields) {
        StringBuilder query = new StringBuilder();
        sortedFields.forEach((name, value) -> {
            if (query.length() > 0)
                query.append('&');
            query.append(name).append('=').append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
        });
        return query.toString();
    }

    private String sign(String data) {
        return HmacUtil.hmacSha512Hex(hashSecret, data);
    }

    // VNPAY khuyến nghị nội dung tiếng Việt không dấu, không ký tự đặc biệt
    private String toAscii(String text) {
        String plain = Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").replace('đ', 'd').replace('Đ', 'D')
                .replaceAll("[^A-Za-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
        return plain.isEmpty() ? "Thanh toan" : plain;
    }

    private boolean isConfigured() {
        return !tmnCode.isBlank() && !hashSecret.isBlank();
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "GATEWAY_NOT_CONFIGURED",
                    "Cổng thanh toán VNPAY chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
        }
    }
}