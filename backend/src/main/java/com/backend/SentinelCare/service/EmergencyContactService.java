package com.backend.SentinelCare.service;

import com.backend.SentinelCare.dto.EmergencyContactRequest;
import com.backend.SentinelCare.dto.EmergencyContactResponse;
import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.model.EmergencyContact;
import com.backend.SentinelCare.model.UserProfile;
import com.backend.SentinelCare.repository.AccountRepository;
import com.backend.SentinelCare.repository.EmergencyContactRepository;
import com.backend.SentinelCare.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmergencyContactService {

    private final EmergencyContactRepository contactRepository;
    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;

    // 1. LẤY DANH SÁCH (xếp theo ưu tiên) - tự đảm bảo chủ tài khoản luôn có trong danh sách
    @Transactional
    public List<EmergencyContactResponse> getContacts(String identifier) {
        Account account = resolveAccount(identifier);
        ensureOwnerContact(account);
        return contactRepository.findByAccountIdOrderByPriorityOrderAsc(account.getId())
                .stream().map(this::toResponse).toList();
    }

    // 2. CHỦ TÀI KHOẢN LUÔN LÀ NGƯỜI ƯU TIÊN 1 (gọi khi đăng ký và khi tải danh sách)
    @Transactional
    public EmergencyContact ensureOwnerContact(Account account) {
        List<EmergencyContact> contacts =
                new ArrayList<>(contactRepository.findByAccountIdOrderByPriorityOrderAsc(account.getId()));

        for (EmergencyContact c : contacts) {
            if (c.isAccountOwner()) return c;
        }

        String fullName = userProfileRepository.findByAccountId(account.getId())
                .map(UserProfile::getFullName)
                .orElse("Chủ tài khoản");

        EmergencyContact owner = EmergencyContact.builder()
                .account(account)
                .contactName(fullName)
                .phoneNumber(account.getPhoneNumber())
                .email(account.getEmail())
                .relationship("Chủ tài khoản")
                .accountOwner(true)
                .build();

        insertAt(contacts, owner, 1);
        return owner;
    }

    // 3. THÊM NGƯỜI THÂN tại đúng mức ưu tiên (không truyền = xếp cuối)
    @Transactional
    public EmergencyContactResponse addContact(EmergencyContactRequest request, String identifier) {
        Account account = resolveAccount(identifier);
        ensureOwnerContact(account);

        String phone = normalizePhone(request.getActivationPhone());
        if (contactRepository.existsByAccountIdAndPhoneNumber(account.getId(), phone)) {
            throw new RuntimeException("Số điện thoại này đã có trong danh sách người thân!");
        }

        String name = request.getFullName().trim();
        String email = blankToNull(request.getEmail());

        // Nếu SĐT thuộc tài khoản đã đăng ký: lấy thông tin thật từ hệ thống, không tin dữ liệu client
        Optional<Account> linked = accountRepository.findByPhoneNumber(phone);
        if (linked.isPresent()) {
            name = userProfileRepository.findByAccountId(linked.get().getId())
                    .map(UserProfile::getFullName).orElse(name);
            email = linked.get().getEmail();
        }

        EmergencyContact contact = EmergencyContact.builder()
                .account(account)
                .contactName(name)
                .phoneNumber(phone)
                .email(email)
                .relationship(blankToNull(request.getRelationship()) != null
                        ? request.getRelationship().trim() : "Người thân")
                .accountOwner(false)
                .build();

        List<EmergencyContact> contacts =
                new ArrayList<>(contactRepository.findByAccountIdOrderByPriorityOrderAsc(account.getId()));
        insertAt(contacts, contact, request.getPriorityOrder());
        return toResponse(contact);
    }

    // 4. ĐỔI THỨ TỰ ƯU TIÊN (nhận toàn bộ id theo thứ tự mới)
    @Transactional
    public List<EmergencyContactResponse> reorder(List<Long> orderedIds, String identifier) {
        Account account = resolveAccount(identifier);
        List<EmergencyContact> contacts = contactRepository.findByAccountIdOrderByPriorityOrderAsc(account.getId());

        Map<Long, EmergencyContact> byId = contacts.stream()
                .collect(Collectors.toMap(EmergencyContact::getId, Function.identity()));

        if (orderedIds.size() != contacts.size() || !byId.keySet().equals(new HashSet<>(orderedIds))) {
            throw new RuntimeException("Danh sách thứ tự không hợp lệ!");
        }

        List<EmergencyContact> ordered = orderedIds.stream().map(byId::get).collect(Collectors.toList());
        renumberAndSave(ordered);
        return ordered.stream().map(this::toResponse).toList();
    }

    // 5. XÓA NGƯỜI THÂN (không xóa được chủ tài khoản), tự đánh số lại
    @Transactional
    public void deleteContact(Long id, String identifier) {
        Account account = resolveAccount(identifier);
        List<EmergencyContact> contacts =
                new ArrayList<>(contactRepository.findByAccountIdOrderByPriorityOrderAsc(account.getId()));

        EmergencyContact target = contacts.stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người thân!"));

        if (target.isAccountOwner()) {
            throw new RuntimeException("Không thể xóa chủ tài khoản khỏi danh sách nhận cảnh báo!");
        }

        contacts.remove(target);
        contactRepository.delete(target);
        renumberAndSave(contacts);
    }

    // 6. TRA CỨU SĐT: trả về tên nếu đã có tài khoản (không lộ email)
    @Transactional(readOnly = true)
    public Optional<String> findRegisteredFullName(String phone) {
        return accountRepository.findByPhoneNumber(normalizePhone(phone))
                .map(acc -> userProfileRepository.findByAccountId(acc.getId())
                        .map(UserProfile::getFullName).orElse("Tài khoản SentinelCare"));
    }

    // ---------- Hàm hỗ trợ ----------

    private void insertAt(List<EmergencyContact> contacts, EmergencyContact contact, Integer desiredPriority) {
        contacts.remove(contact);
        int index = (desiredPriority == null)
                ? contacts.size()
                : Math.max(0, Math.min(desiredPriority - 1, contacts.size()));
        contacts.add(index, contact);
        renumberAndSave(contacts);
    }

    private void renumberAndSave(List<EmergencyContact> ordered) {
        for (int i = 0; i < ordered.size(); i++) {
            ordered.get(i).setPriorityOrder(i + 1);
        }
        contactRepository.saveAll(ordered);
    }

    private Account resolveAccount(String identifier) {
        return accountRepository.findByEmail(identifier)
                .or(() -> accountRepository.findByPhoneNumber(identifier))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản đăng nhập!"));
    }

    private String normalizePhone(String phone) {
        String p = phone == null ? "" : phone.replaceAll("\\s+", "");
        return p.startsWith("+84") ? "0" + p.substring(3) : p;
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private EmergencyContactResponse toResponse(EmergencyContact c) {
        return EmergencyContactResponse.builder()
                .id(c.getId())
                .contactName(c.getContactName())
                .relationship(c.getRelationship())
                .phoneNumber(c.getPhoneNumber())
                .email(c.getEmail())
                .priorityOrder(c.getPriorityOrder())
                .accountOwner(c.isAccountOwner())
                .build();
    }
}