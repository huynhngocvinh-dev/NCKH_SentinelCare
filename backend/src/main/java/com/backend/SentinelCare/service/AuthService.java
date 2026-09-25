package com.backend.SentinelCare.service;

import com.backend.SentinelCare.dto.*;
import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.model.UserProfile;
import com.backend.SentinelCare.repository.AccountRepository;
import com.backend.SentinelCare.repository.UserProfileRepository;
import com.backend.SentinelCare.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    private static final String REDIS_REG_PREFIX = "REG_PENDING_EMAIL:";
    private static final String REDIS_OTP_COOLDOWN_PREFIX = "OTP_COOLDOWN_EMAIL:";

    // 1. ĐĂNG KÝ: Kiểm tra trùng Email/SĐT -> Lưu Redis -> Gửi Email OTP thật
    public String registerPendingUser(RegisterRequest request) {
        if (accountRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email này đã được đăng ký trong hệ thống!");
        }

        if (accountRepository.existsByPhoneNumber(request.getPhone())) {
            throw new RuntimeException("Số điện thoại này đã được sử dụng!");
        }

        String cooldownKey = REDIS_OTP_COOLDOWN_PREFIX + request.getEmail();
        if (Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey))) {
            throw new RuntimeException("Mã OTP đã được gửi. Vui lòng đợi 60 giây trước khi bấm gửi lại!");
        }

        // Sinh OTP 6 chữ số
        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);

        PendingRegistrationDTO pendingData = PendingRegistrationDTO.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .otpCode(otp)
                .build();

        // Lưu thông tin tạm vào Redis key theo EMAIL (TTL = 15 phút)
        String redisKey = REDIS_REG_PREFIX + request.getEmail();
        redisTemplate.opsForValue().set(redisKey, pendingData, 15, TimeUnit.MINUTES);

        // Đặt Cooldown gửi lại 60 giây
        redisTemplate.opsForValue().set(cooldownKey, "BLOCKED", 60, TimeUnit.SECONDS);

        // Gửi Email OTP THẬT
        emailService.sendOtpEmail(request.getEmail(), otp);

        return "Mã OTP đã được gửi đến email " + request.getEmail() + ". Vui lòng kiểm tra hòm thư!";
    }

    // 2. GỬI LẠI MÃ OTP (RESEND VIA EMAIL)
    public String resendOtp(String email) {
        String redisKey = REDIS_REG_PREFIX + email;
        PendingRegistrationDTO pendingData = (PendingRegistrationDTO) redisTemplate.opsForValue().get(redisKey);

        if (pendingData == null) {
            throw new RuntimeException("Yêu cầu đăng ký đã hết hạn. Vui lòng thực hiện đăng ký lại từ đầu!");
        }

        String cooldownKey = REDIS_OTP_COOLDOWN_PREFIX + email;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey))) {
            throw new RuntimeException("Vui lòng chờ hết 60 giây để yêu cầu gửi lại OTP!");
        }

        // Sinh mã OTP mới
        String newOtp = String.format("%06d", new Random().nextInt(900000) + 100000);
        pendingData.setOtpCode(newOtp);

        redisTemplate.opsForValue().set(redisKey, pendingData, 15, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(cooldownKey, "BLOCKED", 60, TimeUnit.SECONDS);

        // Gửi lại Email thật
        emailService.sendOtpEmail(email, newOtp);

        return "Mã OTP mới đã được gửi thành công đến email " + email;
    }

    // 3. XÁC THỰC OTP QUA EMAIL & GHI CHÍNH THỨC VÀO MYSQL
    @Transactional
    public String verifyOtpAndCreateAccount(VerifyOtpRequest request) {
        String redisKey = REDIS_REG_PREFIX + request.getEmail();
        PendingRegistrationDTO pendingData = (PendingRegistrationDTO) redisTemplate.opsForValue().get(redisKey);

        if (pendingData == null) {
            throw new RuntimeException("Mã OTP đã hết hạn hoặc email không chính xác!");
        }

        if (!pendingData.getOtpCode().equals(request.getOtp().trim())) {
            throw new RuntimeException("Mã OTP không chính xác!");
        }

        // Tạo tài khoản chính thức
        Account account = Account.builder()
                .email(pendingData.getEmail())
                .phoneNumber(pendingData.getPhone())
                .passwordHash(pendingData.getPasswordHash())
                .role(Account.Role.caregiver)
                .status(Account.Status.active)
                .build();

        account = accountRepository.save(account);

        UserProfile profile = UserProfile.builder()
                .account(account)
                .fullName(pendingData.getFullName())
                .subscriptionPlan(UserProfile.SubscriptionPlan.free)
                .build();

        userProfileRepository.save(profile);

        // Xóa Key khỏi Redis
        redisTemplate.delete(redisKey);

        return "Xác thực thành công! Tài khoản của bạn đã được kích hoạt.";
    }

    // 4. ĐĂNG NHẬP
    public AuthResponse login(LoginRequest request) {
        // 1. Tìm Account theo Email hoặc Số điện thoại (sử dụng request.getEmail())
        Account account = accountRepository.findByEmail(request.getEmail())
                .orElseGet(() -> accountRepository.findByPhoneNumber(request.getEmail())
                        .orElseThrow(() -> new RuntimeException("Email hoặc Số điện thoại không tồn tại!")));
    
        // 2. Kiểm tra mật khẩu mã hóa BCrypt
        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }
    
        // 3. Kiểm tra trạng thái tài khoản
        if (account.getStatus() != Account.Status.active) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt hoặc đang bị khóa!");
        }
    
        // 4. Tạo JWT Token
        String token = tokenProvider.generateToken(account.getEmail(), account.getRole().name());
    
        // 5. Truy vấn trực tiếp Profile theo AccountId (Tối ưu hiệu năng CSDL)
        String fullName = userProfileRepository.findByAccountId(account.getId())
                .map(UserProfile::getFullName)
                .orElse("Người dùng SentinelCare");
    
        return new AuthResponse(token, fullName, account.getRole().name());
    }

    // 5. LẤY THÔNG TIN TÀI KHOẢN THEO SỐ ĐIỆN THOẠI / EMAIL
    public UserProfileResponse getUserProfileByPhone(String identifier) {
        // Tìm tài khoản theo Email hoặc Số điện thoại (do Subject trong Token có thể lưu phone hoặc email)
        Account account = accountRepository.findByPhoneNumber(identifier)
                .orElseGet(() -> accountRepository.findByEmail(identifier)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản!")));

        // Lấy tên hiển thị từ UserProfile
        String fullName = userProfileRepository.findByAccountId(account.getId())
                .map(UserProfile::getFullName)
                .orElse("Người dùng SentinelCare");

        // Trả về thông tin profile đã tổng hợp
        return UserProfileResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .fullName(fullName)
                .role(account.getRole().name())
                .status(account.getStatus().name())
                .build();
    }
}