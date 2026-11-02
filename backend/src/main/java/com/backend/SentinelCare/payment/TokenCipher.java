package com.backend.SentinelCare.payment;

import com.backend.SentinelCare.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class TokenCipher {

    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    // Chuỗi Base64 của khóa 32 byte. Tạo bằng: openssl rand -base64 32
    @Value("${payment.token-key:}")
    private String base64Key;

    public String encrypt(String plain) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(
                    ByteBuffer.allocate(iv.length + encrypted.length).put(iv).put(encrypted).array());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Không thể mã hóa token thanh toán", e);
        }
    }

    public String decrypt(String encrypted) {
        try {
            byte[] all = Base64.getDecoder().decode(encrypted);
            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(all, 0, iv, 0, IV_LENGTH);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            return new String(cipher.doFinal(all, IV_LENGTH, all.length - IV_LENGTH), StandardCharsets.UTF_8);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Không thể giải mã token thanh toán", e);
        }
    }

    private SecretKeySpec key() {
        if (base64Key == null || base64Key.isBlank()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "PAYMENT_KEY_MISSING",
                    "Hệ thống chưa cấu hình khóa mã hóa token thanh toán (PAYMENT_TOKEN_KEY).");
        }
        byte[] raw = Base64.getDecoder().decode(base64Key.trim());
        if (raw.length != 32) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "PAYMENT_KEY_INVALID",
                    "PAYMENT_TOKEN_KEY phải là chuỗi Base64 của đúng 32 byte.");
        }
        return new SecretKeySpec(raw, "AES");
    }
}