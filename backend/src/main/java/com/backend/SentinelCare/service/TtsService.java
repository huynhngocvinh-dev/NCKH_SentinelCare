package com.backend.SentinelCare.service;

import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class TtsService {

    @Value("${google.ai.studio.api-key}")
    private String aiStudioApiKey;

    private final OkHttpClient httpClient = new OkHttpClient();

    public byte[] generateVoiceAudio(String textMessage) throws IOException {
        String jsonPayload = String.format("""
            {
              "input": { "text": "%s" },
              "voice": { "languageCode": "vi-VN", "name": "vi-VN-Wavenet-A" },
              "audioConfig": { "audioEncoding": "MP3" }
            }
            """, textMessage.replace("\"", "\\\""));

        RequestBody body = RequestBody.create(jsonPayload, MediaType.parse("application/json"));

        Request request = new Request.Builder()
                .url("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + aiStudioApiKey)
                .post(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                return response.body().bytes();
            }
        }
        return new byte[0];
    }
}