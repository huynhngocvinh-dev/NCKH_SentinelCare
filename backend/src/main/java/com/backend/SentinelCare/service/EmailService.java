package com.backend.SentinelCare.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("[SentinelCare] Mã xác thực OTP đăng ký tài khoản");

            String htmlContent = String.format("""
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8;">
                    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #2563eb; text-align: center; margin-bottom: 10px;">SentinelCare System</h2>
                        <p style="font-size: 14px; color: #334155;">Xin chào,</p>
                        <p style="font-size: 14px; color: #334155;">Mã xác thực OTP của bạn để hoàn tất đăng ký tài khoản là:</p>
                        <div style="text-align: center; margin: 25px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background: #eff6ff; padding: 10px 20px; border-radius: 8px; border: 1px dashed #2563eb;">%s</span>
                        </div>
                        <p style="font-size: 12px; color: #64748b; text-align: center;">Mã OTP có hiệu lực trong <strong>15 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                    </div>
                </div>
                """, otpCode);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("📧 [EMAIL SENT] Đã gửi thư chứa OTP thành công tới: {}", toEmail);
        } catch (MessagingException e) {
            log.error("❌ Lỗi khi gửi Email OTP tới {}: ", toEmail, e);
        }
    }
}