package com.backend.SentinelCare.service;

import com.backend.SentinelCare.dto.EmergencyContactRequest;
import com.backend.SentinelCare.model.EmergencyContact;
import com.backend.SentinelCare.repository.EmergencyContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmergencyContactService {

    private final EmergencyContactRepository contactRepository;

    @Transactional
    public EmergencyContact addEmergencyContact(EmergencyContactRequest request) {
        EmergencyContact contact = new EmergencyContact();
        contact.setContactName(request.getFullName());
        contact.setPhoneNumber(request.getActivationPhone());
        contact.setRelationship(request.getRelationship());
        contact.setEmail(request.getEmail());
        contact.setPriorityOrder(request.getPriorityOrder());
        
        return contactRepository.save(contact);
    }
}