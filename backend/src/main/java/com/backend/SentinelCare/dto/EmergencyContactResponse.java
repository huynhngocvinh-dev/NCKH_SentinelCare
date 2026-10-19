package com.backend.SentinelCare.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmergencyContactResponse {
    private Long id;
    private String contactName;
    private String relationship;
    private String phoneNumber;
    private String email;
    private Integer priorityOrder;
    private boolean accountOwner;
}