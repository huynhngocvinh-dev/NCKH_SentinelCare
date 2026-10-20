package com.backend.SentinelCare.dto;

import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingRegistrationDTO implements Serializable {
    private String fullName;
    private String email;
    private String phone;
    private String passwordHash;
    private String otpCode;
}