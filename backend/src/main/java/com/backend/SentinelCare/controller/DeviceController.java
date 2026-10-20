package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.CameraDeviceRequest;
import com.backend.SentinelCare.dto.WearableDeviceRequest;
import com.backend.SentinelCare.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    // 🟢 1. BỔ SUNG: API Lấy danh sách toàn bộ thiết bị (Camera & Wearable) của người dùng
    @GetMapping
    public ResponseEntity<?> getAllDevices() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        String currentUserEmail = authentication.getName();
        // Gọi service lấy danh sách thiết bị theo Email tài khoản
        return ResponseEntity.ok(deviceService.getUserDevices(currentUserEmail));
    }

    // 2. API Đăng ký Thiết bị Đeo tay
    @PostMapping("/wearable")
    public ResponseEntity<?> registerWearable(@Valid @RequestBody WearableDeviceRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập để thực hiện thao tác này!"));
        }

        String currentUserEmail = authentication.getName();
        deviceService.registerWearableDevice(request, currentUserEmail);
        return ResponseEntity.ok(Map.of("message", "Đã thêm thiết bị đeo thành công!"));
    }

    // 3. API Đăng ký Camera AI
    @PostMapping("/camera")
    public ResponseEntity<?> registerCamera(@Valid @RequestBody CameraDeviceRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập để thực hiện thao tác này!"));
        }

        String currentUserEmail = authentication.getName();
        deviceService.registerCameraDevice(request, currentUserEmail);
        return ResponseEntity.ok(Map.of("message", "Đã thêm Camera thành công!"));
    }
}