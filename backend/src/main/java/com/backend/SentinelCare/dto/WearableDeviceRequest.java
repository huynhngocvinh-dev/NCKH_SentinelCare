package com.backend.SentinelCare.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WearableDeviceRequest {
    @NotBlank(message = "Mã serial thiết bị không được để trống")
    private String serialNumber;

    @NotBlank(message = "Họ tên người được giám sát không được để trống")
    private String subjectFullName;

    private String subjectDob;     
    private String subjectGender;    
    private String medicalHistory;   
    private String wearPosition;
}