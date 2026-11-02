package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.*;
import com.backend.SentinelCare.security.AuthCookieService;
import com.backend.SentinelCare.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    // 1. Đăng ký (Gửi OTP đến Email)
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerPendingUser(request));
    }

    // 2. Gửi lại OTP (chỉ sau khi hết 60s): xóa OTP cũ trong Redis, tạo OTP mới
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        return ResponseEntity.ok(authService.resendOtp(request.getEmail()));
    }

    // 2b. Trạng thái OTP: còn yêu cầu đăng ký không, còn bao nhiêu giây mới được gửi lại
    @GetMapping("/otp-status")
    public ResponseEntity<OtpStatusResponse> otpStatus(@RequestParam String email) {
        return ResponseEntity.ok(authService.getOtpStatus(email));
    }

    // 3. Xác thực OTP từ Email
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtpAndCreateAccount(request));
    }

    // 4. Đăng nhập: JWT đặt vào HttpOnly Cookie, body chỉ trả thông tin user
    @PostMapping("/login")
    public ResponseEntity<UserProfileResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResult result = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.create(result.token(), request.isRemember()).toString())
                .body(result.user());
    }

    // 5. Đăng xuất: xóa cookie phiên
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.clear().toString())
                .body(Map.of("message", "Đã đăng xuất."));
    }

    // 6. Kiểm tra phiên hiện tại (frontend gọi khi tải trang)
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Phiên đăng nhập không hợp lệ!"));
        }
        return ResponseEntity.ok(authService.getUserProfileByPhone(authentication.getName()));
    }
}