package com.backend.SentinelCare.payment;

import com.backend.SentinelCare.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.util.Locale;

/**
 * Kênh thanh toán người dùng chọn.là giá trị của tham số vnp_BankCode (null =
 * chọn tại VNPAY).
 */
public enum PaymentChannel {

    ANY(null, "Chọn tại trang VNPAY"),
    VNPAY_QR("VNPAYQR", "Quét mã VNPAY-QR"),
    DOMESTIC_BANK("VNBANK", "Thẻ ATM / tài khoản ngân hàng nội địa"),
    INTERNATIONAL_CARD("INTCARD", "Thẻ quốc tế Visa / Mastercard / JCB");

    private final String vnpayBankCode;
    private final String label;

    PaymentChannel(String vnpayBankCode, String label) {
        this.vnpayBankCode = vnpayBankCode;
        this.label = label;
    }

    public String vnpayBankCode() {
        return vnpayBankCode;
    }

    public String label() {
        return label;
    }

    /** Không truyền gì thì để người dùng chọn tại trang VNPAY. */
    public static PaymentChannel from(String value) {
        if (value == null || value.isBlank())
            return ANY;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_PAYMENT_METHOD",
                    "Phương thức thanh toán không hợp lệ.");
        }
    }

    /** Nhãn hiển thị cho giá trị đã lưu trong hóa đơn. */
    public static String labelOf(String stored) {
        try {
            return stored == null ? null : valueOf(stored).label;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}