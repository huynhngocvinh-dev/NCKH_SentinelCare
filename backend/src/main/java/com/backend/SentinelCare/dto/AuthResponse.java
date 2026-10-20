package com.backend.SentinelCare.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private String fullName;
    private String role;

    public AuthResponse(String token, String fullName, String role) {
        this.token = token;
        this.fullName = fullName;
        this.role = role;
    }
}