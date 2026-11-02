package com.backend.SentinelCare.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.username:}")
    private String redisUsername;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.ssl.enabled:false}")
    private boolean isSslEnabled;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        // 1. Cấu hình thông tin kết nối cơ bản (Host & Port)
        RedisStandaloneConfiguration redisConfig = new RedisStandaloneConfiguration();
        redisConfig.setHostName(redisHost);
        redisConfig.setPort(redisPort);

        // Xử lý Username (Nếu có cấu hình thì set, nếu rỗng thì bỏ qua)
        if (redisUsername != null && !redisUsername.isBlank()) {
            redisConfig.setUsername(redisUsername);
        }

        // Xử lý Password (An toàn, không bị NPE)
        if (redisPassword != null && !redisPassword.isBlank()) {
            redisConfig.setPassword(RedisPassword.of(redisPassword));
        }

        // 2. Cấu hình Client (Lettuce) linh hoạt theo thuộc tính ssl.enabled
        LettuceClientConfiguration.LettuceClientConfigurationBuilder builder = 
                LettuceClientConfiguration.builder()
                        .commandTimeout(Duration.ofSeconds(5)) // Giới hạn Timeout 5s tránh nghẽn thread
                        .shutdownTimeout(Duration.ofMillis(100)); // Graceful shutdown khi stop app

        // Nếu bật SSL (khi deploy Cloud/Production) mới gắn SSL
        if (isSslEnabled) {
            builder.useSsl().disablePeerVerification();
        }

        LettuceClientConfiguration clientConfig = builder.build();

        return new LettuceConnectionFactory(redisConfig, clientConfig);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(LettuceConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Chuẩn hóa Serializer để chống trùng key / lỗi mã hóa JSON dữ liệu
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }
}