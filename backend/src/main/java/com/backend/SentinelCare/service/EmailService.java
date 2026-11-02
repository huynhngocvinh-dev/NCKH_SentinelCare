package com.backend.SentinelCare.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;


import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final com.backend.SentinelCare.security.AckTokenService ackTokenService;

    @org.springframework.beans.factory.annotation.Value("${app.public-base-url}")
    private String publicBaseUrl;
    @org.springframework.beans.factory.annotation.Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Async
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("[SentinelCare] Mã xác thực OTP đăng ký tài khoản");

            String htmlContent = String.format("""
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8;">
                    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px;">
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
            log.info("[EMAIL SENT] da gui thu thanh cong toi : {}", toEmail);
        } catch (MessagingException e) {
            log.error("loi khi gui Email OTP toi {}: ", toEmail, e);
        }
    }

    //Thêm tham số incidentId và nút bấm XÁC NHẬN ngắt gọi GSM ngay trong Email
    @Async
    public void sendEmergencyAlertEmail(String toEmail, String alertText, byte[] audioBytes, Long incidentId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("🚨 [CẢNH BÁO KHẨN CẤP] Phát hiện sự cố từ SentinelCare!");

            // Đường dẫn API gọi thẳng Backend để xác nhận ngắt gọi GSM
            String acknowledgeUrl = publicBaseUrl + "/api/incidents/" + incidentId
            + "/acknowledge?token=" + ackTokenService.generate(incidentId);

            String htmlContent = String.format("""
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f8fafc;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 28px; border-radius: 16px; border: 2px solid #ef4444; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #dc2626; margin-top: 0; font-size: 20px; display: flex; align-items: center;">
                            🚨 CẢNH BÁO SỰ CỐ TẾ NGÃ KHẨN CẤP
                        </h2>
                        
                        <p style="font-size: 15px; color: #1e293b; line-height: 1.6; font-weight: 500;">
                            %s
                        </p>
                        
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                        
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">
                            Hệ thống đã tự động tạo âm thanh giọng nói đọc nội dung thông báo và đính kèm bên dưới. Vui lòng mở file nghe hoặc bấm nút bên dưới để ngắt cuộc gọi khẩn cấp!
                        </p>
                        
                        <!-- NÚT BẤM XÁC NHẬN CHUẨN GIAO DIỆN -->
                        <div style="text-align: center; margin: 28px 0 12px 0;">
                            <a href="%s" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 50px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                                XÁC NHẬN ĐÃ ĐỌC (HỦY CUỘC GỌI)
                            </a>
                        </div>
                    </div>
                </div>
                """, alertText, acknowledgeUrl);

            helper.setText(htmlContent, true);

            // Đính kèm file MP3 nếu tạo audio thành công
            if (audioBytes != null && audioBytes.length > 0) {
                helper.addAttachment("CanhBaoKhanCap.mp3", new ByteArrayResource(audioBytes), "audio/mpeg");
            }

            mailSender.send(message);
            log.info("[EMAIL ALERT SENT] da gui canh bao toi : {}", toEmail);
        } catch (Exception e) {
            log.error("loi khi gui canh bao toi  {}: ", toEmail, e);
        }
    }

    // ===================== EMAIL GÓI DỊCH VỤ =====================

    @Async
    public void sendRenewalReminderEmail(String toEmail, String fullName, String currentPackage,
                                            String nextPackage, BigDecimal amount, LocalDateTime expiredAt,
                                            boolean willRenew) {
        String date = expiredAt.format(DATE_FMT);
        if (willRenew) {
            sendSubscriptionMail(toEmail,
                    "[SentinelCare] Gói dịch vụ sẽ tự động gia hạn vào " + date,
                    "Sắp đến kỳ gia hạn", fullName,
                    "Gói <strong>" + HtmlUtils.htmlEscape(currentPackage) + "</strong> của bạn sẽ được tự động gia hạn vào <strong>"
                            + date + "</strong>. Chúng tôi sẽ trừ <strong>" + formatMoney(amount) + "</strong> cho gói <strong>"
                            + HtmlUtils.htmlEscape(nextPackage) + "</strong>.<br/><br/>Nếu không muốn gia hạn, bạn có thể tắt tự động gia hạn trước ngày này.",
                    "Quản lý gói dịch vụ");
        } else {
            sendSubscriptionMail(toEmail,
                    "[SentinelCare] Gói dịch vụ sắp hết hạn vào " + date,
                    "Gói dịch vụ sắp hết hạn", fullName,
                    "Gói <strong>" + HtmlUtils.htmlEscape(currentPackage) + "</strong> của bạn sẽ hết hạn vào <strong>" + date
                            + "</strong> và tài khoản sẽ chuyển về gói Miễn phí (mất các quyền lợi cảnh báo nâng cao).<br/><br/>"
                            + "Hãy bật tự động gia hạn hoặc mua lại gói để không bị gián đoạn bảo vệ.",
                    "Gia hạn ngay");
        }
    }

    @Async
    public void sendRenewalSuccessEmail(String toEmail, String fullName, String packageName,
                                        BigDecimal amount, LocalDateTime newExpiredAt) {
        sendSubscriptionMail(toEmail,
                "[SentinelCare] Gia hạn gói dịch vụ thành công",
                "Gia hạn thành công", fullName,
                "Chúng tôi đã trừ <strong>" + formatMoney(amount) + "</strong> để gia hạn gói <strong>"
                        + HtmlUtils.htmlEscape(packageName) + "</strong>. Gói có hiệu lực đến <strong>"
                        + (newExpiredAt != null ? newExpiredAt.format(DATE_FMT) : "không thời hạn") + "</strong>.",
                "Xem chi tiết gói");
    }

    @Async
    public void sendPaymentFailedEmail(String toEmail, String fullName, String packageName,
                                        BigDecimal amount, String reason, LocalDateTime graceUntil) {
        sendSubscriptionMail(toEmail,
                "[SentinelCare] Thanh toán gia hạn không thành công",
                "Thanh toán không thành công", fullName,
                "Chúng tôi không thể trừ <strong>" + formatMoney(amount) + "</strong> để gia hạn gói <strong>"
                        + HtmlUtils.htmlEscape(packageName) + "</strong>.<br/>Nguyên nhân: <strong>"
                        + HtmlUtils.htmlEscape(reason == null ? "Không xác định" : reason) + "</strong>.<br/><br/>"
                        + "Bạn vẫn được giữ nguyên quyền lợi đến hết <strong>" + graceUntil.format(DATE_FMT)
                        + "</strong>. Hệ thống sẽ thử thu tiền lại mỗi ngày, hoặc bạn có thể thanh toán ngay để tránh bị hạ về gói Miễn phí.",
                "Thanh toán ngay");
    }

    @Async
    public void sendSubscriptionExpiredEmail(String toEmail, String fullName, String packageName) {
        sendSubscriptionMail(toEmail,
                "[SentinelCare] Gói dịch vụ đã hết hạn",
                "Gói dịch vụ đã hết hạn", fullName,
                "Gói <strong>" + HtmlUtils.htmlEscape(packageName) + "</strong> của bạn đã hết hạn và tài khoản đã chuyển về gói Miễn phí.<br/><br/>"
                        + "Bạn có thể mua lại gói bất cứ lúc nào để khôi phục đầy đủ quyền lợi.",
                "Xem bảng giá");
    }

    private void sendSubscriptionMail(String toEmail, String subject, String heading,
                                        String fullName, String bodyHtml, String ctaText) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);

            String html = String.format("""
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8;">
                    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px;">
                    <h2 style="color: #2563eb; margin-top: 0;">%s</h2>
                    <p style="font-size: 14px; color: #334155;">Xin chào <strong>%s</strong>,</p>
                    <div style="font-size: 14px; color: #334155; line-height: 1.6;">%s</div>
                    <p style="text-align: center; margin: 28px 0 8px;">
                        <a href="%s" style="background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">%s</a>
                    </p>
                    <p style="font-size: 12px; color: #64748b; text-align: center;">Bạn có thể tắt tự động gia hạn bất cứ lúc nào trong mục Gói của tôi.</p>
                    </div>
                </div>
                """, heading, HtmlUtils.htmlEscape(fullName), bodyHtml, frontendBaseUrl + "/goi-cua-toi", ctaText);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("[EMAIL SENT] email gói dịch vụ '{}' tới {}", heading, toEmail);
        } catch (MessagingException e) {
            log.error("loi khi gui email goi dich vu toi {}: ", toEmail, e);
        }
    }

    private String formatMoney(BigDecimal amount) {
        return String.format("%,d", amount.longValue()).replace(',', '.') + "đ";
    }
}