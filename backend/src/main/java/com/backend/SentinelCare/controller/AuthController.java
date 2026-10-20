package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.*;
import com.backend.SentinelCare.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 1. Đăng ký (Gửi OTP đến Email)
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerPendingUser(request));
    }

    // 2. Gửi lại OTP qua Email (Khóa 60s cooldown)
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestParam String email) {
        return ResponseEntity.ok(authService.resendOtp(email));
    }

    // 3. Xác thực OTP từ Email
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtpAndCreateAccount(request));
    }

    // 4. Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(403).body("Phiên đăng nhập không hợp lệ!");
        }
        
        // authentication.getName() sẽ trả về phoneNumber (Subject đã lưu trong JWT)
        String phoneNumber = authentication.getName();
        
        // Gọi hàm lấy thông tin user từ AuthService (hoặc trả về DTO tương ứng)
        return ResponseEntity.ok(authService.getUserProfileByPhone(phoneNumber));
    }
}