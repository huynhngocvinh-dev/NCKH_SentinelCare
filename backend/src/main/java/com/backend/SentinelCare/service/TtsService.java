package com.backend.SentinelCare.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
public class TtsService {

    @Value("${google.ai.studio.api-key}")
    private String aiStudioApiKey;

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public byte[] generateVoiceAudio(String textMessage) throws IOException {
        // ObjectMapper tự escape đúng mọi ký tự đặc biệt trong nội dung cảnh báo
        String jsonPayload = objectMapper.writeValueAsString(Map.of(
                "input", Map.of("text", textMessage),
                "voice", Map.of("languageCode", "vi-VN", "name", "vi-VN-Wavenet-A"),
                "audioConfig", Map.of("audioEncoding", "MP3")
        ));

        RequestBody body = RequestBody.create(jsonPayload, MediaType.parse("application/json"));

        Request request = new Request.Builder()
                .url("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + aiStudioApiKey)
                .post(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                log.error("Google TTS trả về lỗi HTTP {}", response.code());
                return new byte[0];
            }

            // API trả JSON {"audioContent": "<base64 của file MP3>"}
            JsonNode audioContent = objectMapper.readTree(response.body().string()).get("audioContent");
            if (audioContent == null || audioContent.isNull()) {
                log.error("Google TTS không trả về audioContent");
                return new byte[0];
            }
            return Base64.getDecoder().decode(audioContent.asText());
        }
    }
}