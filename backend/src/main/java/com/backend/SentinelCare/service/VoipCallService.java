package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.EmergencyContact;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import okhttp3.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class VoipCallService {

    private final TtsService ttsService;
    private final OkHttpClient httpClient = new OkHttpClient();

    @Value("${stringee.key.sid:}")
    private String stringeeKeySid;

    @Value("${stringee.key.secret:}")
    private String stringeeKeySecret;

    @Value("${stringee.from.number:}")
    private String stringeeFromNumber;

    @Async
    public void triggerEscalationCallWorkflow(List<EmergencyContact> contacts, String patientName, String location, String timeStr) {
        if (contacts == null || contacts.isEmpty()) {
            log.warn("⚠️ Không có danh sách người liên hệ khẩn cấp nào được đăng ký.");
            return;
        }

        // 1. Soạn nội dung cảnh báo động bằng Tiếng Việt chuẩn
        String alertText = String.format(
                "Cảnh báo khẩn cấp từ Sentinel Care! Người thân %s vừa bị phát hiện té ngã tại %s vào lúc %s. Vui lòng kiểm tra ngay!",
                patientName, location, timeStr
        );

        log.info("🎙️ Nội dung thông báo cuộc gọi: {}", alertText);

        // 2. Lặp qua danh sách người thân theo thứ tự ưu tiên
        for (EmergencyContact contact : contacts) {
            String phoneNumber = contact.getPhoneNumber();
            if (phoneNumber == null || phoneNumber.isBlank()) continue;

            log.info("📞 [CUỘC GỌI] Đang thực hiện cuộc gọi tới người thân: {} ({})",
                    contact.getContactName(), phoneNumber);

            // Thực hiện cuộc gọi thật qua Stringee API
            boolean callSuccess = makeRealGsmCall(phoneNumber, alertText);

            if (callSuccess) {
                log.info("Cuộc gọi tới người thân {} ({}) đã khởi tạo thành công!", contact.getContactName(), phoneNumber);
                break; // Đã kết nối được cuộc gọi khẩn cấp
            } else {
                log.warn("❌ Không thể kết nối cuộc gọi tới người thân {}. Chuyển sang số tiếp theo...", contact.getContactName());
            }
        }
    }

    /**
     * Gọi API Stringee để quay số cuộc gọi GSM thật và đọc văn bản bằng giọng nói AI (TTS)
     */
    private boolean makeRealGsmCall(String toPhoneNumber, String textToRead) {
        try {
            // Chuyển định dạng số điện thoại Việt Nam (ví dụ: 0912345678 -> 84912345678)
            String formattedPhone = toPhoneNumber.trim();
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "84" + formattedPhone.substring(1);
            }

            // Tạo Stringee JWT Token
            String jwtToken = generateStringeeJwtToken();

            // Cấu hình Call Logic (NCCO) của Stringee để phát giọng nói Text-to-Speech
            String jsonPayload = String.format("""
                {
                  "from": {
                    "type": "external",
                    "number": "%s",
                    "alias": "%s"
                  },
                  "to": [
                    {
                      "type": "external",
                      "number": "%s",
                      "alias": "%s"
                    }
                  ],
                  "actions": [
                    {
                      "action": "talk",
                      "text": "%s",
                      "voice": "vi",
                      "speed": 0,
                      "loop": 2
                    }
                  ]
                }
                """, 
                stringeeFromNumber, stringeeFromNumber,
                formattedPhone, formattedPhone,
                textToRead.replace("\"", "\\\"")
            );

            RequestBody body = RequestBody.create(jsonPayload, MediaType.parse("application/json"));
            Request request = new Request.Builder()
                    .url("https://api.stringee.com/v1/call/callout")
                    .addHeader("X-STRINGEE-AUTH", jwtToken)
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String responseStr = response.body().string();
                    log.info("📡 Phản hồi từ Stringee Gateway: {}", responseStr);
                    return responseStr.contains("\"r\":0"); // "r":0 tương ứng với thành công trong Stringee API
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi thực hiện cuộc gọi GSM thật qua Stringee: ", e);
        }
        return false;
    }

    /**
     * Tạo JWT Token xác thực cho Stringee API
     */
    private String generateStringeeJwtToken() {
        Algorithm algorithm = Algorithm.HMAC256(stringeeKeySecret);
        Instant now = Instant.now();
        
        return JWT.create()
                .withHeader(java.util.Map.of("typ", "JWT", "alg", "HS256", "cty", "stringee-api;v=1"))
                .withClaim("iss", stringeeKeySid)
                .withClaim("rest_api", true)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(now.plusSeconds(3600)))
                .sign(algorithm);
    }
}