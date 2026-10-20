package com.backend.SentinelCare.dto;

import lombok.Data;

@Data
public class PurchaseRequest {
    private Integer packageId;
    private String paymentGateway; 
}