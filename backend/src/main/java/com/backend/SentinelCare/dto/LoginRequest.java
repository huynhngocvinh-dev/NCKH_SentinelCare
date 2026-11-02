package com.backend.SentinelCare.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    // Email hoặc số điện thoại
    @NotBlank(message = "Email hoặc số điện thoại không được để trống")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    // Ghi nhớ đăng nhập trên thiết bị này (mặc định bật)
    private boolean remember = true;
}