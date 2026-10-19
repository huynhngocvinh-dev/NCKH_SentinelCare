package com.backend.SentinelCare.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Component
public class AckTokenService {

    @Value("${jwt.secret}")
    private String secret;

    public String generate(Long incidentId) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(("ack:" + incidentId).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo token xác nhận sự cố", e);
        }
    }

    public boolean verify(Long incidentId, String token) {
        if (token == null || token.isBlank()) return false;
        return MessageDigest.isEqual(
                generate(incidentId).getBytes(StandardCharsets.UTF_8),
                token.getBytes(StandardCharsets.UTF_8));
    }
}