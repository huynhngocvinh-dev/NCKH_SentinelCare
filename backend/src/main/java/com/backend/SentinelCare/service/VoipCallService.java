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

    private final OkHttpClient httpClient = new OkHttpClient();

    @Value("${stringee.key.sid:}")
    private String stringeeKeySid;

    @Value("${stringee.key.secret:}")
    private String stringeeKeySecret;

    @Value("${stringee.from.number:}")
    private String stringeeFromNumber;

    @Async
    public void triggerEscalationCallWorkflow(List<EmergencyContact> contacts, String alertText) {
        if (contacts == null || contacts.isEmpty()) {
            log.warn("⚠️ Không có danh sách người liên hệ khẩn cấp nào được đăng ký.");
            return;
        }

        log.info("🎙️ Nội dung thông báo cuộc gọi GSM: {}", alertText);

        // Lặp qua danh sách người thân theo thứ tự ưu tiên
        for (EmergencyContact contact : contacts) {
            String phoneNumber = contact.getPhoneNumber();
            if (phoneNumber == null || phoneNumber.isBlank()) continue;

            log.info("📞 [CUỘC GỌI GSM] Đang thực hiện cuộc gọi tới: {} ({})",
                    contact.getContactName(), phoneNumber);

            boolean callSuccess = makeRealGsmCall(phoneNumber, alertText);

            if (callSuccess) {
                log.info("Cuộc gọi tới người thân {} ({}) đã khởi tạo thành công!", contact.getContactName(), phoneNumber);
                break; // Ngắt vòng lặp khi cuộc gọi đã phát thành công
            } else {
                log.warn("❌ Không thể kết nối cuộc gọi tới người thân {}. Chuyển sang số tiếp theo...", contact.getContactName());
            }
        }
    }

    private boolean makeRealGsmCall(String toPhoneNumber, String textToRead) {
        try {
            if (stringeeFromNumber == null || stringeeFromNumber.isBlank()) {
                log.warn("⚠️ [VOIP SIMULATE] Chưa cấu hình stringee.from.number. Giả lập phát cuộc gọi thành công!");
                return true; 
            }

            String formattedPhone = toPhoneNumber.trim();
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "84" + formattedPhone.substring(1);
            }

            String jwtToken = generateStringeeJwtToken();

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
                    return responseStr.contains("\"r\":0");
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi thực hiện cuộc gọi GSM qua Stringee: ", e);
        }
        return false;
    }

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