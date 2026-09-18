package com.backend.SentinelCare.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmergencyContactRequest {
    @NotBlank(message = "Họ tên là bắt buộc")
    private String fullName;
    private String email;
    private String activationPhone;
    private String relationship;
    private Integer priorityOrder;
}
