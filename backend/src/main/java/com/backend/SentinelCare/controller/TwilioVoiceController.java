package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.security.AckTokenService;
import com.backend.SentinelCare.service.VoiceTwimlBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Twilio gọi vào đây (khi người thân nhấc máy) để lấy TwiML nội dung cảnh báo.
 * Không cần đăng nhập, nhưng link phải có chữ ký hợp lệ và còn hạn (xem
 * AckTokenService).
 */
@Slf4j
@RestController
@RequestMapping("/api/public/twilio")
@RequiredArgsConstructor
public class TwilioVoiceController {

    private final AckTokenService tokenService;
    private final VoiceTwimlBuilder twimlBuilder;

    @GetMapping(value = "/voice-alert", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> voiceAlert(@RequestParam("text") String text,
            @RequestParam("ts") long ts,
            @RequestParam("sig") String sig) {
        if (!tokenService.verifyVoice(ts, text, sig)) {
            log.warn("[VOICE] Tu choi yeu cau lay TwiML: chu ky sai hoac link het han.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(twimlBuilder.build(text));
    }
}