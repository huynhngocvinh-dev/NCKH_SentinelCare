package com.backend.SentinelCare.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Set;

@Data
public class PackageRequest {
    private String code;
    private String name;
    private BigDecimal price;
    private Integer durationDays;
    private Boolean isActive;
    private Set<Integer> featureIds;
}