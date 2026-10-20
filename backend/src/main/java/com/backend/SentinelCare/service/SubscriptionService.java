package com.backend.SentinelCare.service;

import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubscriptionService {

    private final ServicePackageRepository packageRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final OrderRepository orderRepository;
    private final AccountRepository accountRepository;

    /**
     *  Mua gói dịch vụ
     */
    @Transactional
    public UserSubscription processPackagePurchase(Long userId, Integer packageId, String paymentGateway) {
        Account user = accountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("khong tim thay tai khaon nguoi dung"));

        ServicePackage targetPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("goi dich vu khong ton tai"));

        if (!targetPackage.getIsActive()) {
            throw new RuntimeException("goi dich vu hien ngung ban");
        }

        // Tạo đơn hàng Order
        Order order = Order.builder()
                .user(user)
                .pkg(targetPackage)
                .amount(targetPackage.getPrice())
                .paymentGateway(paymentGateway)
                .transactionCode("TXN_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .status(Order.OrderStatus.SUCCESS) // Mặc định thành công cho thanh toán
                .build();
        orderRepository.save(order);

        // Kích hoạt gói dịch vụ cho User
        return activateSubscriptionForUser(user, targetPackage);
    }

    /**
     *  Kích hoạt / Nâng cấp (Upgrade) gói dịch vụ
     */
    private UserSubscription activateSubscriptionForUser(Account user, ServicePackage targetPackage) {
        LocalDateTime now = LocalDateTime.now();

        // Kiểm tra gói hiện tại đang dùng
        subscriptionRepository.findActiveSubscription(user.getId(), now).ifPresent(currentSub -> {
            // Đánh dấu gói cũ chuyển trạng thái thành UPGRADED
            currentSub.setStatus(UserSubscription.SubscriptionStatus.UPGRADED);
            subscriptionRepository.save(currentSub);
            log.info("Đã chuyển gói cũ ID {} của User {} sang UPGRADED", currentSub.getId(), user.getId());
        });

        // Tính toán hạn sử dụng (NULL đối với Premium/Lifetime)
        LocalDateTime expiredAt = null;
        if (targetPackage.getDurationDays() != null) {
            expiredAt = now.plusDays(targetPackage.getDurationDays());
        }

        UserSubscription newSub = UserSubscription.builder()
                .user(user)
                .pkg(targetPackage)
                .startAt(now)
                .expiredAt(expiredAt)
                .status(UserSubscription.SubscriptionStatus.ACTIVE)
                .autoRenew(targetPackage.getDurationDays() != null) // Pro mặc định tự gia hạn
                .build();

        return subscriptionRepository.save(newSub);
    }

    /**
     *  Hủy gia hạn hoặc Hủy ngay lập tức về gói Freemium
     */
    @Transactional
    public void cancelSubscription(Long userId, boolean cancelImmediately) {
        LocalDateTime now = LocalDateTime.now();
        UserSubscription currentSub = subscriptionRepository.findActiveSubscription(userId, now)
                .orElseThrow(() -> new RuntimeException("banj khong co goi dich vu nao dang hoat dongg"));

        if ("FREEMIUM".equalsIgnoreCase(currentSub.getPkg().getCode())) {
            throw new RuntimeException("khong the huy goi Freemium");
        }

        if (cancelImmediately) {
            // Hủy gói ngay lập tức -> Chuyển về gói Freemium
            currentSub.setStatus(UserSubscription.SubscriptionStatus.CANCELLED);
            subscriptionRepository.save(currentSub);

            ServicePackage freemiumPkg = packageRepository.findByCode("FREEMIUM")
                    .orElseThrow(() -> new RuntimeException("khong tim thay goi Freemium trong he thong"));

            UserSubscription freemiumSub = UserSubscription.builder()
                    .user(currentSub.getUser())
                    .pkg(freemiumPkg)
                    .startAt(now)
                    .expiredAt(null)
                    .status(UserSubscription.SubscriptionStatus.ACTIVE)
                    .autoRenew(false)
                    .build();
            subscriptionRepository.save(freemiumSub);
            log.info("User {} da huy goi", userId);
        } else {
            // Tắt tự động gia hạn khi hết hạn gói
            currentSub.setAutoRenew(false);
            subscriptionRepository.save(currentSub);
            log.info("User {} da tat tinh nang tu dong gia han goi", userId);
        }
    }

    /**
     * 🛡️ 3. Kiểm tra User có quyền dùng tính năng hay không
     */
    public boolean hasFeatureAccess(Long userId, String featureCode) {
        LocalDateTime now = LocalDateTime.now();
        return subscriptionRepository.findActiveSubscription(userId, now)
                .map(sub -> sub.getPkg().getFeatures().stream()
                        .anyMatch(f -> f.getCode().equalsIgnoreCase(featureCode)))
                .orElse(false);
    }
}