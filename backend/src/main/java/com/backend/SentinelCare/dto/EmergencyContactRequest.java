package com.backend.SentinelCare.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class EmergencyContactRequest {

    @NotBlank(message = "Họ tên là bắt buộc")
    private String fullName;

    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Số điện thoại là bắt buộc")
    @Pattern(
        regexp = "^(0[35789]\\d{8}|\\+84[35789]\\d{8})$",
        message = "Số điện thoại không đúng định dạng"
    )
    private String activationPhone;

    private String relationship;

    @Min(value = 1, message = "Mức ưu tiên phải từ 1 trở lên")
    private Integer priorityOrder;
}