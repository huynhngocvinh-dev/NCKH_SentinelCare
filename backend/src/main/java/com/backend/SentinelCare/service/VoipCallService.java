package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.EmergencyContact;
import com.backend.SentinelCare.model.FallIncident;
import com.backend.SentinelCare.repository.FallIncidentRepository;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import okhttp3.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class VoipCallService {

    private final OkHttpClient httpClient = new OkHttpClient();
    private final FallIncidentRepository incidentRepository;

    @Value("${stringee.key.sid:}")
    private String stringeeKeySid;

    @Value("${stringee.key.secret:}")
    private String stringeeKeySecret;

    @Value("${stringee.from.number:}")
    private String stringeeFromNumber;

    /**
     * Luồng gọi điện leo thang xoay vòng theo độ ưu tiên tích hợp lớp Trạng thái mới
     */
    @Async
    public void triggerEscalationCallWorkflow(Long incidentId, List<EmergencyContact> contacts, String alertText) {
        if (contacts == null || contacts.isEmpty()) {
            log.warn("⚠️ Không có danh sách người liên hệ khẩn cấp nào được đăng ký.");
            updateCallStatus(incidentId, FallIncident.CallEscalationStatus.ESCALATION_STOPPED);
            return;
        }

        List<EmergencyContact> sortedContacts = contacts.stream()
                .filter(c -> c.getPhoneNumber() != null && !c.getPhoneNumber().isBlank())
                .sorted(Comparator.comparing(EmergencyContact::getPriorityOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        log.info("🎙️ Bắt đầu luồng gọi điện GSM xoay vòng cho Sự cố ID {}", incidentId);

        for (EmergencyContact contact : sortedContacts) {
            // Kiểm tra trạng thái sự cố trước khi BẮT ĐẦU cuộc gọi mới
            Optional<FallIncident> currentIncidentOpt = incidentRepository.findById(incidentId);
            if (currentIncidentOpt.isPresent() && currentIncidentOpt.get().getStatus() == FallIncident.IncidentStatus.ACKNOWLEDGED) {
                log.info("🛑 Sự cố ID {} đã được ACKNOWLEDGED. Không chuyển sang gọi người ưu tiên tiếp theo nữa.", incidentId);
                updateCallStatus(incidentId, FallIncident.CallEscalationStatus.ESCALATION_STOPPED);
                break;
            }

            String phoneNumber = contact.getPhoneNumber();
            log.info("📞 [CALLING] [Priority {}] Đang gọi tới: {} ({})",
                    contact.getPriorityOrder(), contact.getContactName(), phoneNumber);

            // Cập nhật trạng thái cuộc gọi sang CALLING
            updateCallStatus(incidentId, FallIncident.CallEscalationStatus.CALLING);

            // Thực hiện cuộc gọi
            boolean callSuccess = makeRealGsmCall(phoneNumber, alertText);

            if (callSuccess) {
                // Đã bắt máy / kết nối cuộc gọi thành công
                updateCallStatus(incidentId, FallIncident.CallEscalationStatus.CALL_CONNECTED);
                log.info("✅ [CALL_CONNECTED] Cuộc gọi tới người thân {} đã kết nối và phát xong thông báo!", contact.getContactName());
                
                // Sau khi cuộc gọi hiện tại hoàn tất thành công, dừng xoay vòng gọi tiếp
                break; 
            } else {
                // Không nghe máy / bận / timeout
                updateCallStatus(incidentId, FallIncident.CallEscalationStatus.CALL_TIMEOUT);
                log.warn("⏱️ [CALL_TIMEOUT] Người thân {} không nghe/bận. Chuẩn bị chuyển sang priority tiếp theo...", contact.getContactName());
                
                try {
                    Thread.sleep(3000); // Tạm dừng 3s trước khi gọi số tiếp theo
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    private void updateCallStatus(Long incidentId, FallIncident.CallEscalationStatus status) {
        incidentRepository.findById(incidentId).ifPresent(incident -> {
            incident.setCallEscalationStatus(status);
            incidentRepository.save(incident);
        });
    }

    private boolean makeRealGsmCall(String toPhoneNumber, String textToRead) {
        try {
            if (stringeeFromNumber == null || stringeeFromNumber.isBlank()) {
                log.warn("⚠️️ [VOIP SIMULATE] Chưa cấu hình stringee.from.number. Giả lập gọi thành công!");
                return true; 
            }

            String formattedPhone = toPhoneNumber.trim();
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "84" + formattedPhone.substring(1);
            }

            String jwtToken = generateStringeeJwtToken();

            String jsonPayload = String.format("""
                {
                  "from": { "type": "external", "number": "%s", "alias": "%s" },
                  "to": [ { "type": "external", "number": "%s", "alias": "%s" } ],
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