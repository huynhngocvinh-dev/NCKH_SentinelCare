package com.backend.SentinelCare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class SubscriptionDtos {

        private SubscriptionDtos() {
        }

        // ---------- Request ----------
        public record SubscribeRequest(
                        @NotNull(message = "Vui lòng chọn gói dịch vụ") @JsonProperty("plan_id") Integer planId,
                        @JsonProperty("payment_method") String paymentMethod, // MOMO_WALLET | MOMO_CARD
                        @JsonProperty("auto_renew_consent") Boolean autoRenewConsent) {
        }

        public record CancelAutoRenewRequest(String reason, String feedback) {
        }

        // ---------- Response ----------
        public record FeatureDto(Integer id, String code, String name) {
        }

        public record PaymentMethodResponse(Long id, String type, String brand, String last4, String displayName,
                        String status, boolean defaultMethod, Instant createdAt) {
        }

        public record NextBilling(String planName, BigDecimal amount, Instant date) {
        }

        public record PendingChange(Integer planId, String planCode, String planName, BigDecimal amount,
                        Instant effectiveAt) {
        }

        // status: FREE | ACTIVE | GRACE_PERIOD
        public record MySubscriptionResponse(
                        Integer planId,
                        String planCode,
                        String planName,
                        BigDecimal price,
                        Integer durationDays,
                        String status,
                        boolean lifetime,
                        Instant currentPeriodStart,
                        Instant currentPeriodEnd,
                        long daysRemaining,
                        boolean autoRenew,
                        Instant gracePeriodEnd,
                        String lastPaymentError,
                        PaymentMethodResponse paymentMethod,
                        NextBilling nextBilling,
                        PendingChange pendingChange,
                        List<FeatureDto> features) {
        }

        // type: INITIAL | UPGRADE | DOWNGRADE | RECOVERY | SAME_PLAN
        public record QuoteResponse(
                        String type,
                        boolean allowed,
                        String reason,
                        String currentPlanName,
                        Integer targetPlanId,
                        String targetPlanCode,
                        String targetPlanName,
                        BigDecimal listPrice,
                        BigDecimal prorationCredit,
                        BigDecimal amountDue,
                        long remainingDays,
                        Instant effectiveAt,
                        boolean recurring,
                        String summary) {
        }

        // result: PENDING_PAYMENT (chuyển sang MoMo) | ACTIVATED | DOWNGRADE_SCHEDULED
        public record SubscribeResponse(String result, Long invoiceId, String paymentUrl,
                        BigDecimal amount, String message, Instant effectiveAt) {
        }

        public record InvoiceResponse(
                        Long id,
                        String number,
                        String type,
                        String status,
                        BigDecimal amount,
                        BigDecimal listPrice,
                        BigDecimal prorationCredit,
                        String currency,
                        String planName,
                        String paymentMethodLabel,
                        Instant periodStart,
                        Instant periodEnd,
                        Instant createdAt,
                        Instant paidAt,
                        String failureMessage) {
        }

        public record SubscriptionLogResponse(
                        Long id,
                        String action,
                        String fromStatus,
                        String toStatus,
                        String fromPackage,
                        String toPackage,
                        BigDecimal amount,
                        String actor,
                        String message,
                        Instant createdAt) {
        }
}