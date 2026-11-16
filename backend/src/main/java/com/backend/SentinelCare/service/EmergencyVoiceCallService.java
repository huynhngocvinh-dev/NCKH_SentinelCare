package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.EmergencyContact;
import com.backend.SentinelCare.model.FallIncident.CallEscalationStatus;
import com.backend.SentinelCare.repository.FallIncidentRepository;
import com.backend.SentinelCare.security.AckTokenService;
import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.http.HttpMethod;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.rest.api.v2010.account.CallCreator;
import com.twilio.type.PhoneNumber;
import com.twilio.type.Twiml;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

/**
 * Gọi điện cảnh báo té ngã qua Twilio. Twilio tự đọc nội dung bằng TTS.
 * Chỉ gọi hàm này cho tài khoản có quyền gọi điện (kiểm tra ở
 * IncidentNotificationService).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyVoiceCallService {

    private static final long POLL_INTERVAL_MS = 2000;
    private static final long PAUSE_BETWEEN_CONTACTS_MS = 2000;

    private final FallIncidentRepository incidentRepository;
    private final AckTokenService tokenService;
    private final VoiceTwimlBuilder twimlBuilder;

    @Value("${twilio.account-sid:}")
    private String accountSid;
    @Value("${twilio.auth-token:}")
    private String authToken;
    @Value("${twilio.phone-number:}")
    private String fromNumber;
    // true: Twilio tự gọi về endpoint của backend để lấy nội dung (cần
    // app.public-base-url truy cập được từ internet)
    // false: gửi TwiML trực tiếp trong request tạo cuộc gọi (cần tài khoản Twilio
    // đã nâng cấp)
    @Value("${twilio.call.use-webhook:true}")
    private boolean useWebhook;
    @Value("${app.public-base-url:}")
    private String publicBaseUrl;
    @Value("${twilio.call.ring-seconds:30}")
    private int ringSeconds;
    @Value("${twilio.call.max-wait-seconds:90}")
    private int maxWaitSeconds;

    private boolean configured;

    @PostConstruct
    void init() {
        configured = !accountSid.isBlank() && !authToken.isBlank() && !fromNumber.isBlank();
        if (configured) {
            Twilio.init(accountSid, authToken);
            if (useWebhook && (publicBaseUrl.isBlank() || publicBaseUrl.contains("localhost")
                    || publicBaseUrl.contains("127.0.0.1"))) {
                log.warn("[TWILIO] Che do webhook nhung app.public-base-url ({}) khong truy cap duoc tu internet. "
                        + "Twilio se khong lay duoc noi dung cuoc goi, hay dung ngrok/Cloudflare Tunnel.",
                        publicBaseUrl);
            }
        } else {
            log.warn(
                    "[TWILIO] Chua cau hinh twilio.account-sid / auth-token / phone-number, tinh nang goi dien bi tat.");
        }
    }

    /**
     * Gọi lần lượt theo độ ưu tiên, dừng khi có người nghe máy.
     * Việc người dùng bấm "Xác nhận" KHÔNG làm dừng vòng gọi.
     */
    @Async
    public void triggerEscalationCallWorkflow(Long incidentId, List<EmergencyContact> contacts, String alertText) {
        if (!configured || contacts == null || contacts.isEmpty()) {
            log.warn("[VOICE] Su co {}: khong the goi (thieu cau hinh Twilio hoac chua co nguoi lien he).", incidentId);
            updateStatus(incidentId, CallEscalationStatus.ESCALATION_STOPPED);
            return;
        }

        List<EmergencyContact> sorted = contacts.stream()
                .sorted(Comparator.comparing(EmergencyContact::getPriorityOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        boolean attempted = false;
        for (EmergencyContact contact : sorted) {
            String to = toE164(contact.getPhoneNumber());
            if (to == null) {
                log.warn("[VOICE] Bo qua '{}': so dien thoai khong hop le.", contact.getContactName());
                continue;
            }

            attempted = true;
            updateStatus(incidentId, CallEscalationStatus.CALLING);
            log.info("[VOICE] Su co {} - goi uu tien {}: {} ({})",
                    incidentId, contact.getPriorityOrder(), contact.getContactName(), mask(to));

            if (placeCallAndWaitAnswer(to, alertText)) {
                updateStatus(incidentId, CallEscalationStatus.CALL_CONNECTED);
                log.info("[VOICE] Su co {} - {} da nghe may.", incidentId, contact.getContactName());
                return;
            }

            updateStatus(incidentId, CallEscalationStatus.CALL_TIMEOUT);
            try {
                Thread.sleep(PAUSE_BETWEEN_CONTACTS_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }

        if (!attempted) {
            updateStatus(incidentId, CallEscalationStatus.ESCALATION_STOPPED);
        }
    }

    /**
     * 0338851434 / 84338851434 / +84 338 851 434 -> +84338851434. Không hợp lệ ->
     * null.
     */
    public static String toE164(String raw) {
        if (raw == null)
            return null;
        String s = raw.replaceAll("[^\\d+]", "");
        if (s.startsWith("00"))
            s = "+" + s.substring(2);
        if (!s.startsWith("+")) {
            if (s.startsWith("84"))
                s = "+" + s;
            else if (s.startsWith("0"))
                s = "+84" + s.substring(1);
            else
                return null;
        }
        return s.matches("\\+\\d{8,15}") ? s : null;
    }

    // ---------- Chi tiết kỹ thuật ----------

    /**
     * Link Twilio sẽ gọi để lấy nội dung. Mỗi cuộc gọi một link riêng, có chữ ký và
     * hạn dùng.
     */
    private URI buildVoiceUri(String alertText) {
        long ts = Instant.now().getEpochSecond();
        String base = publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
        return URI.create(base + "/api/public/twilio/voice-alert"
                + "?text=" + encode(alertText)
                + "&ts=" + ts
                + "&sig=" + tokenService.signVoice(ts, alertText));
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
    // sử dụng đoạn thoại twilio cung cấp
    private boolean placeCallAndWaitAnswer(String to, String alertText) {
        try {
            PhoneNumber toNumber = new PhoneNumber(to);
            PhoneNumber from = new PhoneNumber(fromNumber);
    
            // Chế độ Trial: bắt buộc dùng URL mẫu của Twilio, không dùng webhook ngoài hay setTimeout
            URI uri = useWebhook
                    ? buildVoiceUri(alertText)
                    : URI.create("https://webhooks.twilio.com/v1/Voice/Template/voice_text_to_speech");
    
            Call call = Call.creator(toNumber, from, uri).create();
            return waitUntilAnswered(call.getSid());
        } catch (ApiException e) {
            log.error("[VOICE] Twilio tu choi cuoc goi toi {}: code={} - {}", mask(to), e.getCode(), e.getMessage());
        } catch (Exception e) {
            log.error("[VOICE] Loi khi goi Twilio toi {}", mask(to), e);
        }
        return false;
    }
    // nâng cấp twilio mới dùng được truyền đoạn thoại
    // private boolean placeCallAndWaitAnswer(String to, String alertText) {
    //     try {
    //         PhoneNumber toNumber = new PhoneNumber(to);
    //         PhoneNumber from = new PhoneNumber(fromNumber);

    //         CallCreator creator = useWebhook
    //                 ? Call.creator(toNumber, from, buildVoiceUri(alertText)).setMethod(HttpMethod.GET)
    //                 : Call.creator(toNumber, from, new Twiml(twimlBuilder.build(alertText)));

    //         Call call = creator.setTimeout(ringSeconds).create();
    //         return waitUntilAnswered(call.getSid());
    //     } catch (ApiException e) {
    //         log.error("[VOICE] Twilio tu choi cuoc goi toi {}: code={} - {}", mask(to), e.getCode(), e.getMessage());
    //     } catch (Exception e) {
    //         log.error("[VOICE] Loi khi goi Twilio toi {}", mask(to), e);
    //     }
    //     return false;
    // }

    /**
     * create() chỉ trả về "queued", nên phải hỏi lại trạng thái để biết có người
     * nghe máy hay không.
     */
    private boolean waitUntilAnswered(String sid) {
        long deadline = System.currentTimeMillis() + maxWaitSeconds * 1000L;
        try {
            while (System.currentTimeMillis() < deadline) {
                Call call = Call.fetcher(sid).fetch();
                Call.Status status = call.getStatus();
                if (status == Call.Status.IN_PROGRESS)
                    return true;
                if (status == Call.Status.COMPLETED)
                    return durationOf(call) > 0;
                if (status == Call.Status.BUSY || status == Call.Status.FAILED
                        || status == Call.Status.NO_ANSWER || status == Call.Status.CANCELED) {
                    return false;
                }
                Thread.sleep(POLL_INTERVAL_MS);
            }
            Call.updater(sid).setStatus(Call.UpdateStatus.CANCELED).update(); // quá hạn: hủy cuộc gọi
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.error("[VOICE] Loi khi kiem tra trang thai cuoc goi {}", sid, e);
        }
        return false;
    }

    private int durationOf(Call call) {
        try {
            return call.getDuration() == null ? 0 : Integer.parseInt(call.getDuration());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private void updateStatus(Long incidentId, CallEscalationStatus status) {
        incidentRepository.findById(incidentId).ifPresent(incident -> {
            incident.setCallEscalationStatus(status);
            incidentRepository.save(incident);
        });
    }

    private String mask(String phone) {
        return phone.length() <= 6 ? "***" : phone.substring(0, 5) + "****" + phone.substring(phone.length() - 2);
    }
}