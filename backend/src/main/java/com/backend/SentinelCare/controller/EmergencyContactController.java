package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.EmergencyContactRequest;
import com.backend.SentinelCare.model.EmergencyContact;
import com.backend.SentinelCare.repository.EmergencyContactRepository;
import com.backend.SentinelCare.service.EmergencyContactService; // 🟢 Đã đổi import
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency-contacts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EmergencyContactController {

    // 🟢 Tiêm EmergencyContactService thay cho DeviceService
    private final EmergencyContactService contactService;
    private final EmergencyContactRepository contactRepository;

    @GetMapping("/check-phone")
    public ResponseEntity<?> checkPhoneExistence(@RequestParam String phone) {
        List<EmergencyContact> contacts = contactRepository.findByPhoneNumber(phone);
        if (!contacts.isEmpty()) {
            return ResponseEntity.ok(contacts.get(0));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<EmergencyContact> addContact(@Valid @RequestBody EmergencyContactRequest request) {
        // 🟢 Gọi hàm từ contactService
        EmergencyContact contact = contactService.addEmergencyContact(request);
        return ResponseEntity.ok(contact);
    }
}