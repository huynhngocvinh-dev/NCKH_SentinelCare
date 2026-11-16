package com.backend.SentinelCare.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

/**
 * Dựng TwiML đọc cảnh báo bằng giọng nói. Dùng chung cho endpoint của Twilio và
 * chế độ gửi TwiML trực tiếp.
 */
@Component
public class VoiceTwimlBuilder {

    @Value("${twilio.voice.language:vi-VN}")
    private String language;

    // Để trống = dùng giọng mặc định của Twilio cho ngôn ngữ đó
    @Value("${twilio.voice.name:}")
    private String voiceName;

    public String build(String text) {
        String voiceAttr = (voiceName == null || voiceName.isBlank()) ? "" : " voice=\"" + voiceName + "\"";
        // Pause 1s để người nghe áp tai vào máy; loop=2 để đọc lặp lại 2 lần
        return "<Response><Pause length=\"1\"/>"
                + "<Say language=\"" + language + "\"" + voiceAttr + " loop=\"2\">"
                + HtmlUtils.htmlEscape(text)
                + "</Say></Response>";
    }
}