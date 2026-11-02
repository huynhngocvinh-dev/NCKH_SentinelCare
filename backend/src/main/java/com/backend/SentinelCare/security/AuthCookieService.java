package com.backend.SentinelCare.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

import java.time.Duration;

@Component
public class AuthCookieService {

    @Value("${app.auth.cookie-name:sentinel_access_token}")
    private String cookieName;

    @Value("${app.auth.cookie-secure:false}")
    private boolean secure;

    @Value("${app.auth.cookie-same-site:Lax}")
    private String sameSite;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    // remember = true: cookie sống đúng bằng thời hạn JWT; false: cookie phiên (mất khi đóng trình duyệt)
    public ResponseCookie create(String token, boolean remember) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/");
        if (remember) {
            builder.maxAge(Duration.ofMillis(expirationMs));
        }
        return builder.build();
    }

    public ResponseCookie clear() {
        return ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();
    }

    public String resolveToken(HttpServletRequest request) {
        Cookie cookie = WebUtils.getCookie(request, cookieName);
        return cookie != null ? cookie.getValue() : null;
    }
}