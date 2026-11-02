package com.backend.SentinelCare.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kênh riêng theo người dùng: server gửi tới /user/{email}/queue/incidents
        config.enableSimpleBroker("/queue");
        config.setUserDestinationPrefix("/user");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Handshake đi qua Spring Security nên bắt buộc có cookie đăng nhập hợp lệ
        registry.addEndpoint("/ws-sentinel")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS()
                .setSuppressCors(true); // CORS do SecurityConfig xử lý, tránh trùng header
    }
}