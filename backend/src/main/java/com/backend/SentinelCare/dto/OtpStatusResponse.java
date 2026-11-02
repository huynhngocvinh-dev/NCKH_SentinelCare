package com.backend.SentinelCare.dto;

public record OtpStatusResponse(boolean pending, long cooldownSeconds) {
}