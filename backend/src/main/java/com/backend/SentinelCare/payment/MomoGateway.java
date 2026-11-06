package com.backend.SentinelCare.payment;

import com.backend.SentinelCare.exception.BusinessException;
import com.backend.SentinelCare.util.HmacUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.core.JsonProcessingException;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@Slf4j
public class MomoGateway implements PaymentGateway {

    // 8000/8200: cần người dùng xác thực lại; 7000/7002/9000: đang xử lý, chưa phải
    // kết quả cuối
    private static final Set<Integer> NON_FINAL_CODES = Set.of(8000, 8200, 9000, 7000, 7002);

    private static class GatewayCommunicationException extends RuntimeException {
        final boolean network; // true = lỗi mạng/timeout; false = MoMo có phản hồi nhưng không đọc được

        GatewayCommunicationException(String message, boolean network, Throwable cause) {
            super(message, cause);
            this.network = network;
        }
    }

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .callTimeout(Duration.ofSeconds(35)) // MoMo khuyến nghị tối thiểu 30 giây
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${payment.momo.base-url:https://test-payment.momo.vn}")
    private String baseUrl;

    @Value("${payment.momo.partner-code:}")
    private String partnerCode;

    @Value("${payment.momo.access-key:}")
    private String accessKey;

    @Value("${payment.momo.secret-key:}")
    private String secretKey;

    @Value("${payment.momo.store-id:SentinelCareStore}")
    private String storeId;

    // Khóa công khai RSA của MoMo (Base64 DER, lấy tại business.momo.vn) để mã hóa
    // token khi trừ tiền
    @Value("${payment.momo.rsa-public-key:}")
    private String rsaPublicKey;

    @Value("${payment.momo.rsa-transformation:RSA/ECB/PKCS1Padding}")
    private String rsaTransformation;

    // ------------------------------------------------------------------
    // 1. TẠO LINK ĐĂNG KÝ AUTO-DEBIT + THANH TOÁN KỲ ĐẦU
    // ------------------------------------------------------------------
    @Override
    public String createPaymentLink(PaymentLinkRequest r) {
        ensureConfigured();
        long amount = r.amount().setScale(0, RoundingMode.HALF_UP).longValue();
        boolean tokenFlow = !"ONE_TIME".equals(r.linkType());
        String requestType = switch (r.linkType()) {
            case "WALLET" -> "linkWallet";
            case "CARD" -> "payWithCC";
            default -> "captureWallet";
        };
        String extraData = "";

        StringBuilder raw = new StringBuilder("accessKey=").append(accessKey)
                .append("&amount=").append(amount)
                .append("&extraData=").append(extraData)
                .append("&ipnUrl=").append(r.ipnUrl())
                .append("&orderId=").append(r.orderId())
                .append("&orderInfo=").append(r.orderInfo());
        if (tokenFlow)
            raw.append("&partnerClientId=").append(r.partnerClientId());
        raw.append("&partnerCode=").append(partnerCode)
                .append("&redirectUrl=").append(r.returnUrl())
                .append("&requestId=").append(r.orderId())
                .append("&requestType=").append(requestType);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("partnerName", "SentinelCare");
        body.put("storeId", storeId);
        body.put("requestId", r.orderId());
        body.put("amount", amount);
        body.put("orderId", r.orderId());
        body.put("orderInfo", r.orderInfo());
        body.put("redirectUrl", r.returnUrl());
        body.put("ipnUrl", r.ipnUrl());
        body.put("lang", "vi");
        body.put("requestType", requestType);
        body.put("extraData", extraData);
        if (tokenFlow) {
            body.put("partnerClientId", r.partnerClientId());
            // Ví: chỉ gửi bí danh hiển thị (không ép số điện thoại vì phải trùng với số ví
            // MoMo của người dùng)
            body.put("userInfo", "CARD".equals(r.linkType())
                    ? Map.of("email", r.customerEmail())
                    : Map.of("partnerClientAlias", r.customerEmail()));
        } else {
            body.put("autoCapture", true);
        }
        body.put("signature", sign(raw.toString()));

        JsonNode json;
        try {
            json = post("/v2/gateway/api/create", body);
        } catch (GatewayCommunicationException e) {
            log.error("[MOMO] Tạo liên kết thanh toán ({}) thất bại: {}", requestType, e.getMessage(), e.getCause());
            throw new BusinessException(HttpStatus.BAD_GATEWAY,
                    e.network ? "GATEWAY_TIMEOUT" : "GATEWAY_BAD_RESPONSE",
                    e.network
                            ? "Không kết nối được tới MoMo (lỗi mạng hoặc quá thời gian chờ). Giao dịch chưa bị trừ tiền, vui lòng thử lại."
                            : "MoMo trả về phản hồi không hợp lệ cho yêu cầu thanh toán. Vui lòng liên hệ quản trị viên.");
        }

        int code = json.path("resultCode").asInt(-1);
        String payUrl = json.path("payUrl").asText("");
        if (code != 0 || payUrl.isBlank()) {
            log.error("MoMo từ chối tạo liên kết thanh toán: {}", json);
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "GATEWAY_ERROR",
                    "MoMo không tạo được liên kết thanh toán: " + describe(code, json.path("message").asText("")));
        }
        return payUrl;
    }

    // ------------------------------------------------------------------
    // 2. KIỂM TRA CHỮ KÝ IPN / URL QUAY VỀ
    // ------------------------------------------------------------------
    @Override
    public Notification verifyNotification(Map<String, String> p) {
        // Chữ ký chuẩn (thanh toán thường, thẻ)
        String standard = "accessKey=" + accessKey
                + "&amount=" + v(p, "amount")
                + "&extraData=" + v(p, "extraData")
                + "&message=" + v(p, "message")
                + "&orderId=" + v(p, "orderId")
                + "&orderInfo=" + v(p, "orderInfo")
                + "&orderType=" + v(p, "orderType")
                + "&partnerCode=" + v(p, "partnerCode")
                + "&payType=" + v(p, "payType")
                + "&requestId=" + v(p, "requestId")
                + "&responseTime=" + v(p, "responseTime")
                + "&resultCode=" + v(p, "resultCode")
                + "&transId=" + v(p, "transId");

        // Chữ ký khi IPN kèm callbackToken + partnerClientId (liên kết ví)
        String withToken = "accessKey=" + accessKey
                + "&amount=" + v(p, "amount")
                + "&callbackToken=" + v(p, "callbackToken")
                + "&extraData=" + v(p, "extraData")
                + "&message=" + v(p, "message")
                + "&orderId=" + v(p, "orderId")
                + "&orderInfo=" + v(p, "orderInfo")
                + "&orderType=" + v(p, "orderType")
                + "&partnerClientId=" + v(p, "partnerClientId")
                + "&partnerCode=" + v(p, "partnerCode")
                + "&payType=" + v(p, "payType")
                + "&requestId=" + v(p, "requestId")
                + "&responseTime=" + v(p, "responseTime")
                + "&resultCode=" + v(p, "resultCode")
                + "&transId=" + v(p, "transId");

        String received = v(p, "signature");
        boolean valid = isConfigured()
                && partnerCode.equals(v(p, "partnerCode"))
                && (HmacUtil.constantTimeEquals(sign(standard), received)
                        || HmacUtil.constantTimeEquals(sign(withToken), received));

        int resultCode = parseInt(v(p, "resultCode"), -1);
        long amount;
        try {
            amount = Long.parseLong(v(p, "amount"));
        } catch (NumberFormatException e) {
            amount = -1;
            valid = false;
        }
        boolean finalResult = !NON_FINAL_CODES.contains(resultCode);

        return new Notification(valid, v(p, "orderId"), amount, resultCode, finalResult,
                resultCode == 0, v(p, "transId"), v(p, "callbackToken"), v(p, "partnerClientId"),
                resultCode == 0 ? null : describe(resultCode, v(p, "message")));
    }

    @Override
    public boolean verifyUnbindNotification(Map<String, String> p) {
        String raw = "accessKey=" + accessKey
                + "&orderId=" + v(p, "orderId")
                + "&partnerClientId=" + v(p, "partnerClientId")
                + "&partnerCode=" + v(p, "partnerCode")
                + "&requestId=" + v(p, "requestId")
                + "&requestType=" + v(p, "requestType")
                + "&tokenType=" + v(p, "tokenType");
        return isConfigured() && partnerCode.equals(v(p, "partnerCode"))
                && HmacUtil.constantTimeEquals(sign(raw), v(p, "signature"));
    }

    // ------------------------------------------------------------------
    // 3. LẤY PAYMENT TOKEN SAU KHI LIÊN KẾT
    // ------------------------------------------------------------------
    @Override
    public String queryCallbackToken(String orderId, String partnerClientId) {
        ensureConfigured();
        String requestId = UUID.randomUUID().toString();
        String raw = "accessKey=" + accessKey + "&orderId=" + orderId
                + "&partnerClientId=" + partnerClientId + "&partnerCode=" + partnerCode
                + "&requestId=" + requestId;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("requestId", requestId);
        body.put("orderId", orderId);
        body.put("partnerClientId", partnerClientId);
        body.put("lang", "vi");
        body.put("signature", sign(raw));

        JsonNode json = postOrThrow("/v2/gateway/api/tokenization/cbQuery", body, "TOKEN_QUERY_FAILED");
        // Tài liệu MoMo có khoảng trắng thừa ở tên trường, nên so khớp theo tên đã cắt
        // khoảng trắng
        Iterator<String> names = json.fieldNames();
        while (names.hasNext()) {
            String name = names.next();
            if (name.trim().equals("callbackToken"))
                return json.path(name).asText("");
        }
        return "";
    }

    @Override
    public TokenInfo bindToken(String callbackToken, String orderId, String partnerClientId, String tokenType) {
        ensureConfigured();
        String requestId = UUID.randomUUID().toString();
        String raw = "accessKey=" + accessKey + "&callbackToken=" + callbackToken
                + "&orderId=" + orderId + "&partnerClientId=" + partnerClientId
                + "&partnerCode=" + partnerCode + "&requestId=" + requestId;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("callbackToken", callbackToken);
        body.put("requestId", requestId);
        body.put("orderId", orderId);
        body.put("partnerClientId", partnerClientId);
        body.put("lang", "vi");
        body.put("signature", sign(raw));

        JsonNode json = postOrThrow("/v2/gateway/api/tokenization/bind", body, "TOKEN_BIND_FAILED");
        String aesToken = json.path("aesToken").asText("");
        if (aesToken.isBlank()) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "TOKEN_BIND_FAILED",
                    "MoMo không trả về token liên kết.");
        }

        try {
            JsonNode token = mapper.readTree(decryptAes(aesToken));
            String value = token.path("value").asText("");
            if (value.isBlank()) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY, "TOKEN_BIND_FAILED",
                        "Token liên kết không hợp lệ.");
            }
            if ("CARD".equals(tokenType)) {
                return new TokenInfo(value, token.path("cardType").asText("CARD"),
                        lastFour(token.path("cardNumber").asText("")), null);
            }
            String alias = token.path("userAlias").asText("");
            return new TokenInfo(value, "MOMO", lastFour(alias), alias);
        } catch (IOException e) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "TOKEN_BIND_FAILED",
                    "Không đọc được token liên kết từ MoMo.");
        }
    }

    // ------------------------------------------------------------------
    // 4. TRỪ TIỀN NGẦM BẰNG TOKEN (Merchant-Initiated Transaction)
    // ------------------------------------------------------------------
    @Override
    public ChargeResult chargeWithToken(String orderId, BigDecimal amountVnd, String orderInfo,
            String partnerClientId, String token, String ipnUrl) {
        ensureConfigured();
        long amount = amountVnd.setScale(0, RoundingMode.HALF_UP).longValue();
        String encryptedToken = encryptToken(token);

        // requestId = orderId: MoMo dùng requestId để chống xử lý trùng
        String raw = "accessKey=" + accessKey + "&amount=" + amount + "&extraData="
                + "&orderId=" + orderId + "&orderInfo=" + orderInfo
                + "&partnerClientId=" + partnerClientId + "&partnerCode=" + partnerCode
                + "&requestId=" + orderId + "&token=" + encryptedToken;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("partnerName", "SentinelCare");
        body.put("storeId", storeId);
        body.put("orderId", orderId);
        body.put("amount", amount);
        body.put("requestId", orderId);
        body.put("token", encryptedToken);
        body.put("partnerClientId", partnerClientId);
        body.put("orderInfo", orderInfo);
        body.put("autoCapture", true);
        body.put("ipnUrl", ipnUrl); // kết quả muộn (đang xử lý) sẽ về qua IPN
        body.put("extraData", "");
        body.put("lang", "vi");
        body.put("signature", sign(raw));

        try {
            return toChargeResult(post("/v2/gateway/api/tokenization/pay", body));
        } catch (GatewayCommunicationException e) {
            log.warn("Không rõ kết quả trừ tiền đơn {} (lỗi kết nối): {}", orderId, e.getMessage());
            return new ChargeResult(ChargeStatus.UNKNOWN, -1, null, "Không nhận được phản hồi từ cổng thanh toán.");
        }
    }

    @Override
    public ChargeResult queryTransaction(String orderId) {
        ensureConfigured();
        String requestId = UUID.randomUUID().toString();
        String raw = "accessKey=" + accessKey + "&orderId=" + orderId
                + "&partnerCode=" + partnerCode + "&requestId=" + requestId;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("requestId", requestId);
        body.put("orderId", orderId);
        body.put("lang", "vi");
        body.put("signature", sign(raw));

        try {
            return toChargeResult(post("/v2/gateway/api/query", body));
        } catch (GatewayCommunicationException e) {
            return new ChargeResult(ChargeStatus.UNKNOWN, -1, null, "Không nhận được phản hồi từ cổng thanh toán.");
        }
    }

    @Override
    public void deleteToken(String partnerClientId, String token) {
        ensureConfigured();
        String orderId = "DEL" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        String requestId = UUID.randomUUID().toString();
        String encryptedToken = encryptToken(token);
        String raw = "accessKey=" + accessKey + "&orderId=" + orderId
                + "&partnerClientId=" + partnerClientId + "&partnerCode=" + partnerCode
                + "&requestId=" + requestId + "&token=" + encryptedToken;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("requestId", requestId);
        body.put("orderId", orderId);
        body.put("storeId", storeId);
        body.put("token", encryptedToken);
        body.put("partnerClientId", partnerClientId);
        body.put("lang", "vi");
        body.put("signature", sign(raw));

        postOrThrow("/v2/gateway/api/tokenization/delete", body, "TOKEN_DELETE_FAILED");
    }

    // ------------------------------------------------------------------
    // Hàm hỗ trợ
    // ------------------------------------------------------------------
    private ChargeResult toChargeResult(JsonNode json) {
        int code = json.path("resultCode").asInt(-1);
        String message = json.path("message").asText("");
        String transId = json.path("transId").asText("");

        if (code == 0)
            return new ChargeResult(ChargeStatus.SUCCESS, code, transId, null);
        if (code == 8000 || code == 8200) {
            return new ChargeResult(ChargeStatus.REAUTH_REQUIRED, code, transId, describe(code, message));
        }
        if (code == -1 || code == 1000 || NON_FINAL_CODES.contains(code)) {
            return new ChargeResult(ChargeStatus.UNKNOWN, code, transId, describe(code, message));
        }
        return new ChargeResult(ChargeStatus.FAILED, code, transId, describe(code, message));
    }

    private JsonNode postOrThrow(String path, Map<String, Object> body, String errorCode) {
        try {
            JsonNode json = post(path, body);
            int code = json.path("resultCode").asInt(-1);
            if (code != 0) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY, errorCode,
                        describe(code, json.path("message").asText("")));
            }
            return json;
        } catch (GatewayCommunicationException e) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "GATEWAY_TIMEOUT",
                    "Không kết nối được cổng MoMo, vui lòng thử lại.");
        }
    }

    private JsonNode post(String path, Map<String, Object> body) {
        String url = baseUrl + path;
        try {
            RequestBody requestBody = RequestBody.create(
                    mapper.writeValueAsString(body), MediaType.parse("application/json; charset=UTF-8"));
            Request request = new Request.Builder().url(url).post(requestBody).build();

            try (Response response = httpClient.newCall(request).execute()) {
                String text = response.body() != null ? response.body().string() : "";
                if (text.isBlank()) {
                    throw new GatewayCommunicationException(
                            "MoMo trả về phản hồi rỗng (HTTP " + response.code() + ") tại " + url, false, null);
                }
                try {
                    return mapper.readTree(text);
                } catch (JsonProcessingException e) {
                    throw new GatewayCommunicationException("MoMo trả về dữ liệu không phải JSON (HTTP "
                            + response.code() + ") tại " + url + ": " + abbreviate(text), false, e);
                }
            }
        } catch (IOException e) {
            throw new GatewayCommunicationException("Lỗi mạng khi gọi " + url + ": "
                    + e.getClass().getSimpleName() + " - " + e.getMessage(), true, e);
        }
    }

    private String abbreviate(String text) {
        String oneLine = text.replaceAll("\\s+", " ").trim();
        return oneLine.length() > 300 ? oneLine.substring(0, 300) + "..." : oneLine;
    }

    private String sign(String raw) {
        return HmacUtil.hmacSha256Hex(secretKey, raw);
    }

    // Token trả về dạng AES-CBC (IV = 16 byte 0), khóa là secretKey: giải mã theo
    // tài liệu MoMo
    private String decryptAes(String encrypted) {
        try {
            byte[] key = secretKey.getBytes(StandardCharsets.UTF_8);
            if (key.length != 16 && key.length != 24 && key.length != 32) {
                throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "MOMO_KEY_INVALID",
                        "Khóa bí mật MoMo có độ dài không phù hợp để giải mã token.");
            }
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new IvParameterSpec(new byte[16]));
            return new String(cipher.doFinal(Base64.getDecoder().decode(encrypted)), StandardCharsets.UTF_8);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "TOKEN_DECRYPT_FAILED",
                    "Không giải mã được token từ MoMo.");
        }
    }

    // Khi trừ tiền / hủy token: MoMo yêu cầu gửi chuỗi JSON {value,
    // requireSecurityCode} mã hóa RSA bằng khóa công khai MoMo
    private String encryptToken(String tokenValue) {
        if (rsaPublicKey == null || rsaPublicKey.isBlank()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "MOMO_RSA_MISSING",
                    "Chưa cấu hình khóa công khai RSA của MoMo (MOMO_RSA_PUBLIC_KEY).");
        }
        try {
            String json = mapper.writeValueAsString(Map.of("value", tokenValue, "requireSecurityCode", false));
            String pem = rsaPublicKey.replaceAll("-----(BEGIN|END) PUBLIC KEY-----", "").replaceAll("\\s", "");
            PublicKey key = KeyFactory.getInstance("RSA")
                    .generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(pem)));
            Cipher cipher = Cipher.getInstance(rsaTransformation);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            return Base64.getEncoder().encodeToString(cipher.doFinal(json.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "MOMO_RSA_INVALID",
                    "Không mã hóa được token bằng khóa RSA của MoMo. Kiểm tra MOMO_RSA_PUBLIC_KEY.");
        }
    }

    private boolean isConfigured() {
        return !partnerCode.isBlank() && !accessKey.isBlank() && !secretKey.isBlank();
    }

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "GATEWAY_NOT_CONFIGURED",
                    "Cổng thanh toán MoMo chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
        }
    }

    private String describe(int code, String fallback) {
        return switch (code) {
            case 1001 -> "Tài khoản không đủ số dư để thanh toán.";
            case 1002 -> "Giao dịch bị ngân hàng phát hành thẻ từ chối. Vui lòng dùng phương thức khác.";
            case 1003, 1006 -> "Bạn đã hủy giao dịch.";
            case 1004 -> "Số tiền vượt hạn mức giao dịch.";
            case 1005 -> "Đã hết thời gian chờ thanh toán. Vui lòng thực hiện lại.";
            case 2001, 2012 -> "Phương thức thanh toán đã bị hủy liên kết hoặc không còn hợp lệ.";
            case 2007 -> "Phương thức thanh toán đang bị tạm khóa.";
            case 3001 -> "Bạn đã từ chối ủy quyền thanh toán tự động.";
            case 4010, 4017, 4018 -> "Mã OTP xác thực không hợp lệ.";
            case 4011, 4019 -> "Mã OTP chưa được gửi hoặc đã hết hạn.";
            case 4015 -> "Xác thực 3D Secure không thành công.";
            case 4016 -> "Nhập sai quá nhiều lần, vui lòng thử lại sau 1 ngày.";
            case 8000 -> "Giao dịch cần bạn xác nhận lại trên ví MoMo.";
            case 8200 -> "Giao dịch cần xác thực hai lớp (OTP).";
            default -> "Thanh toán không thành công"
                    + (fallback == null || fallback.isBlank() ? "" : ": " + fallback) + " (mã " + code + ").";
        };
    }

    private String lastFour(String masked) {
        String digits = masked == null ? "" : masked.replaceAll("\\D", "");
        return digits.length() <= 4 ? digits : digits.substring(digits.length() - 4);
    }

    private int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private String v(Map<String, String> p, String key) {
        String value = p.get(key);
        return value == null ? "" : value;
    }
}