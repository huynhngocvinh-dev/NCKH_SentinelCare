package com.backend.SentinelCare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync // Kích hoạt xử lý bất đồng bộ cho 25s đếm ngược và luồng gọi điện
public class SentinelCareApplication {
    public static void main(String[] args) {
        SpringApplication.run(SentinelCareApplication.class, args);
    }
}