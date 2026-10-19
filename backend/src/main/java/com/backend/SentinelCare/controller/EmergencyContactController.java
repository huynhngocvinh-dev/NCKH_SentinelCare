package com.backend.SentinelCare.controller;

import com.backend.SentinelCare.dto.EmergencyContactRequest;
import com.backend.SentinelCare.dto.EmergencyContactResponse;
import com.backend.SentinelCare.dto.ReorderContactsRequest;
import com.backend.SentinelCare.service.EmergencyContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency-contacts")
@RequiredArgsConstructor
public class EmergencyContactController {

    private final EmergencyContactService contactService;

    @GetMapping
    public ResponseEntity<List<EmergencyContactResponse>> getMyContacts(Authentication authentication) {
        return ResponseEntity.ok(contactService.getContacts(authentication.getName()));
    }

    // Tra cứu SĐT đã có tài khoản SentinelCare chưa (chỉ trả tên, không trả email)
    @GetMapping("/check-phone")
    public ResponseEntity<?> checkPhoneExistence(@RequestParam String phone) {
        return contactService.findRegisteredFullName(phone)
                .<ResponseEntity<?>>map(name -> ResponseEntity.ok(Map.of(
                        "registered", true,
                        "contactName", name)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EmergencyContactResponse> addContact(
            @Valid @RequestBody EmergencyContactRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(contactService.addContact(request, authentication.getName()));
    }

    // Đổi thứ tự ưu tiên: body { "orderedIds": [3, 1, 2] }
    @PutMapping("/reorder")
    public ResponseEntity<List<EmergencyContactResponse>> reorder(
            @Valid @RequestBody ReorderContactsRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(contactService.reorder(request.getOrderedIds(), authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContact(@PathVariable Long id, Authentication authentication) {
        contactService.deleteContact(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Đã xóa người thân khỏi danh sách."));
    }
}