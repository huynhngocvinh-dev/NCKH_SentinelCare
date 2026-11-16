package com.backend.SentinelCare.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

/**
 * Ký và kiểm tra các liên kết công khai (không cần đăng nhập):
 * link xác nhận sự cố trong email, và link Twilio lấy nội dung cuộc gọi.
 */
@Component
public class AckTokenService {

    // Link nội dung cuộc gọi chỉ có hiệu lực trong khoảng này (đủ cho đổ chuông +
    // chờ)
    private static final long VOICE_LINK_TTL_SECONDS = 600;

    @Value("${jwt.secret}")
    private String secret;

    // ---------- Link xác nhận sự cố trong email ----------

    public String generate(Long incidentId) {
        return hmac("ack:" + incidentId);
    }

    public boolean verify(Long incidentId, String token) {
        if (token == null || token.isBlank())
            return false;
        return safeEquals(generate(incidentId), token);
    }

    // ---------- Link nội dung cuộc gọi cho Twilio ----------

    /**
     * Chữ ký cho (thời điểm tạo link + nội dung đọc), chống sửa nội dung và chống
     * dùng lại về sau.
     */
    public String signVoice(long epochSeconds, String text) {
        return hmac("voice:" + epochSeconds + ":" + text);
    }

    public boolean verifyVoice(long epochSeconds, String text, String sig) {
        if (sig == null || sig.isBlank() || text == null)
            return false;
        long age = Instant.now().getEpochSecond() - epochSeconds;
        if (age < -60 || age > VOICE_LINK_TTL_SECONDS)
            return false;
        return safeEquals(signVoice(epochSeconds, text), sig);
    }

    // ---------- Chi tiết kỹ thuật ----------

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo chữ ký", e);
        }
    }

    private boolean safeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}