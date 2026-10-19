package com.backend.SentinelCare.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ReorderContactsRequest {

    @NotEmpty(message = "Danh sách thứ tự không được rỗng")
    private List<Long> orderedIds;
}