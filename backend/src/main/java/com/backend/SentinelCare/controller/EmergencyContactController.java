package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.EmergencyContactRequest;
import com.backend.SentinelCare.model.EmergencyContact;
import com.backend.SentinelCare.repository.EmergencyContactRepository;
import com.backend.SentinelCare.service.EmergencyContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency-contacts")
@RequiredArgsConstructor
public class EmergencyContactController {

    private final EmergencyContactService contactService;
    private final EmergencyContactRepository contactRepository;

    @GetMapping
    public ResponseEntity<List<EmergencyContact>> getAllContacts() {
        // Hoặc gọi từ contactService.getAllContacts() tùy theo logic của bạn
        List<EmergencyContact> contacts = contactRepository.findAll();
        return ResponseEntity.ok(contacts);
    }

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
        EmergencyContact contact = contactService.addEmergencyContact(request);
        return ResponseEntity.ok(contact);
    }
}