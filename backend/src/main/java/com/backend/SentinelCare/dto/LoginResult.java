package com.backend.SentinelCare.dto;

public record LoginResult(String token, UserProfileResponse user) {
}