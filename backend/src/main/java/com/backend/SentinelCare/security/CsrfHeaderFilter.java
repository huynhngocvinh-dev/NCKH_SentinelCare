package com.backend.SentinelCare.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class CsrfHeaderFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return SAFE_METHODS.contains(request.getMethod())
                || path.equals("/api/incidents/webhook/camera") // xác thực bằng X-Device-Key
                || path.equals("/api/incidents/iot-event") // xác thực bằng X-Device-Key
                || path.startsWith("/ws-sentinel") // WebSocket đã kiểm tra Origin
                || path.equals("/api/v1/payments/momo/ipn") // xác thực bằng chữ ký HMAC của MoMo
                || path.equals("/api/v1/payments/momo/unbind");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!"XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Yêu cầu thiếu header bảo vệ CSRF (X-Requested-With).\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}