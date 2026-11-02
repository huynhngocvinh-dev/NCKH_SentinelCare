package com.backend.SentinelCare.config;

import com.backend.SentinelCare.security.CsrfHeaderFilter;
import com.backend.SentinelCare.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    private CsrfHeaderFilter csrfHeaderFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF mặc định của Spring tắt vì dùng JWT cookie SameSite + CsrfHeaderFilter
                // (header X-Requested-With)
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Chưa đăng nhập / cookie hết hạn -> 401 để frontend tự đăng xuất
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Đăng ký / đăng nhập / đăng xuất
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/verify-otp",
                                "/api/auth/resend-otp",
                                "/api/auth/otp-status",
                                "/api/auth/logout")
                        .permitAll()

                        // Thiết bị gọi vào: xác thực bằng header X-Device-Key trong controller
                        .requestMatchers(HttpMethod.POST,
                                "/api/incidents/webhook/camera",
                                "/api/incidents/iot-event")
                        .permitAll()

                        // Link xác nhận trong email: xác thực bằng token ký HMAC
                        .requestMatchers(HttpMethod.GET, "/api/v1/subscriptions/plans").permitAll()
                        // Webhook MoMo (IPN, thông báo hủy liên kết): xác thực bằng chữ ký HMAC trong
                        // controller
                        .requestMatchers(HttpMethod.POST, "/api/v1/payments/momo/ipn", "/api/v1/payments/momo/unbind")
                        .permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/subscriptions/packages").permitAll()
                        .requestMatchers("/api/admin/packages/**").hasRole("ADMIN")

                        // Mọi endpoint còn lại (kể cả /ws-sentinel/**) bắt buộc đăng nhập
                        .anyRequest().authenticated())

                .addFilterBefore(csrfHeaderFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Có cookie (credentials) thì KHÔNG được dùng "*", chỉ cho đúng origin frontend
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}