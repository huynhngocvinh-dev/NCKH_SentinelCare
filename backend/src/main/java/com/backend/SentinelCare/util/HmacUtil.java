package com.backend.SentinelCare.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class HmacUtil {

    private static final String HMAC_SHA512 = "HmacSHA512";

    private HmacUtil() {
    }

    /** Chữ ký HMAC-SHA512. */
    public static String hmacSha512Hex(String key, String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA512);
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_SHA512));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tính chữ ký HMAC-SHA512", e);
        }
    }

    /** So sánh chữ ký trong thời gian không đổi (chống timing attack). */
    public static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false; // thiếu chữ ký thì không bao giờ hợp lệ
        }
        return MessageDigest.isEqual(
                a.toLowerCase().getBytes(StandardCharsets.UTF_8),
                b.toLowerCase().getBytes(StandardCharsets.UTF_8));
    }
}