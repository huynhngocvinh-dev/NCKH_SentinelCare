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
            String acknowledgeUrl = "http://localhost:8080/api/incidents/" + incidentId + "/acknowledge";

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
}