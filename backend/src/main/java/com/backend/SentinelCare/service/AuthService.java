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

import java.util.concurrent.TimeUnit;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Locale;

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
    private final EmergencyContactService emergencyContactService;

    private static final String REDIS_REG_PREFIX = "REG_PENDING_EMAIL:";
    private static final String REDIS_OTP_COOLDOWN_PREFIX = "OTP_COOLDOWN_EMAIL:";
    private static final String REDIS_OTP_ATTEMPTS_PREFIX = "OTP_ATTEMPTS_EMAIL:";

    private static final int OTP_COOLDOWN_SECONDS = 60;
    private static final int PENDING_TTL_MINUTES = 15;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // 1. ĐĂNG KÝ: Kiểm tra trùng Email/SĐT -> Lưu Redis -> Gửi Email OTP thật
    public String registerPendingUser(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String phone = normalizePhone(request.getPhone());

        if (accountRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email này đã được đăng ký trong hệ thống!");
        }

        if (accountRepository.existsByPhoneNumber(phone)) {
            throw new RuntimeException("Số điện thoại này đã được sử dụng!");
        }

        long remaining = getCooldownSeconds(email);
        if (remaining > 0) {
            throw new RuntimeException("Mã OTP đã được gửi. Vui lòng đợi " + remaining + " giây trước khi thử lại!");
        }

        String otp = generateOtp();

        PendingRegistrationDTO pendingData = PendingRegistrationDTO.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .otpCode(otp)
                .build();

        // Lưu thông tin tạm vào Redis theo EMAIL (TTL = 15 phút), reset bộ đếm nhập sai
        redisTemplate.delete(REDIS_OTP_ATTEMPTS_PREFIX + email);
        redisTemplate.opsForValue().set(REDIS_REG_PREFIX + email, pendingData, PENDING_TTL_MINUTES, TimeUnit.MINUTES);

        startCooldownAndSendOtp(email, otp);

        return "Mã OTP đã được gửi đến email " + email + ". Vui lòng kiểm tra hòm thư!";
    }

    // 2. GỬI LẠI MÃ OTP: chỉ khi đã hết 60s. Xóa mã cũ trong Redis, tạo mã mới, gửi
    // email
    public String resendOtp(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        String redisKey = REDIS_REG_PREFIX + email;

        PendingRegistrationDTO pendingData = (PendingRegistrationDTO) redisTemplate.opsForValue().get(redisKey);
        if (pendingData == null) {
            throw new RuntimeException("Yêu cầu đăng ký đã hết hạn. Vui lòng thực hiện đăng ký lại từ đầu!");
        }

        long remaining = getCooldownSeconds(email);
        if (remaining > 0) {
            throw new RuntimeException("Vui lòng chờ " + remaining + " giây nữa để yêu cầu gửi lại OTP!");
        }

        String newOtp = generateOtp();

        // Xóa mã OTP cũ (và bộ đếm nhập sai) trong Redis, rồi ghi bản ghi mới với mã
        // OTP mới
        redisTemplate.delete(redisKey);
        redisTemplate.delete(REDIS_OTP_ATTEMPTS_PREFIX + email);
        pendingData.setOtpCode(newOtp);
        redisTemplate.opsForValue().set(redisKey, pendingData, PENDING_TTL_MINUTES, TimeUnit.MINUTES);

        startCooldownAndSendOtp(email, newOtp);

        return "Mã OTP mới đã được gửi thành công đến email " + email;
    }

    // 2b. TRẠNG THÁI OTP: frontend dùng để đồng bộ vòng đếm 60s (F5 không đếm lại
    // từ đầu)
    public OtpStatusResponse getOtpStatus(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        boolean pending = Boolean.TRUE.equals(redisTemplate.hasKey(REDIS_REG_PREFIX + email));
        return new OtpStatusResponse(pending, pending ? getCooldownSeconds(email) : 0);
    }

    // 3. XÁC THỰC OTP QUA EMAIL & GHI CHÍNH THỨC VÀO MYSQL
    @Transactional
    public String verifyOtpAndCreateAccount(VerifyOtpRequest request) {
        String email = normalizeEmail(request.getEmail());
        String redisKey = REDIS_REG_PREFIX + email;
        String attemptsKey = REDIS_OTP_ATTEMPTS_PREFIX + email;

        PendingRegistrationDTO pendingData = (PendingRegistrationDTO) redisTemplate.opsForValue().get(redisKey);
        if (pendingData == null) {
            throw new RuntimeException("Mã OTP đã hết hạn hoặc email không chính xác!");
        }

        // Chống dò mã OTP: tối đa 5 lần nhập sai
        Long rawAttempts = redisTemplate.opsForValue().increment(attemptsKey);
        long attempts = rawAttempts != null ? rawAttempts : 1L;
        if (attempts == 1L) {
            redisTemplate.expire(attemptsKey, PENDING_TTL_MINUTES, TimeUnit.MINUTES);
        }

        boolean correct = MessageDigest.isEqual(
                pendingData.getOtpCode().getBytes(StandardCharsets.UTF_8),
                request.getOtp().trim().getBytes(StandardCharsets.UTF_8));

        if (!correct) {
            if (attempts >= MAX_OTP_ATTEMPTS) {
                redisTemplate.delete(redisKey);
                redisTemplate.delete(attemptsKey);
                throw new RuntimeException("Bạn đã nhập sai " + MAX_OTP_ATTEMPTS
                        + " lần. Mã OTP đã bị hủy, vui lòng đăng ký lại!");
            }
            throw new RuntimeException("Mã OTP không chính xác! Bạn còn "
                    + (MAX_OTP_ATTEMPTS - attempts) + " lần thử.");
        }

        // Đề phòng 2 người cùng đăng ký 1 email/SĐT: kiểm tra lại trước khi ghi MySQL
        if (accountRepository.findByEmail(email).isPresent()
                || accountRepository.existsByPhoneNumber(pendingData.getPhone())) {
            redisTemplate.delete(redisKey);
            redisTemplate.delete(attemptsKey);
            throw new RuntimeException("Email hoặc số điện thoại này vừa được đăng ký bởi tài khoản khác!");
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
        emergencyContactService.ensureOwnerContact(account);

        // Dọn toàn bộ khóa tạm trong Redis
        redisTemplate.delete(redisKey);
        redisTemplate.delete(attemptsKey);
        redisTemplate.delete(REDIS_OTP_COOLDOWN_PREFIX + email);

        return "Xác thực thành công! Tài khoản của bạn đã được kích hoạt.";
    }

    // 4. ĐĂNG NHẬP
    public LoginResult login(LoginRequest request) {
        // 1. Tìm Account theo Email hoặc Số điện thoại (sử dụng request.getEmail())
        String identifier = normalizeIdentifier(request.getEmail());
        Account account = accountRepository.findByEmail(identifier)
                .or(() -> accountRepository.findByPhoneNumber(identifier))
                .orElseThrow(() -> new RuntimeException("Email hoặc Số điện thoại không tồn tại!"));

        // 2. Kiểm tra mật khẩu mã hóa BCrypt
        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        // 3. Kiểm tra trạng thái tài khoản
        if (account.getStatus() != Account.Status.active) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt hoặc đang bị khóa!");
        }

        // 4. Tạo JWT (controller sẽ đặt vào HttpOnly Cookie, không trả trong body)
        String token = tokenProvider.generateToken(account.getEmail(), account.getRole().name());

        return new LoginResult(token, buildProfileResponse(account));
    }

    public UserProfileResponse getUserProfileByPhone(String identifier) {
        // Subject trong JWT là email; vẫn hỗ trợ tra theo số điện thoại
        Account account = accountRepository.findByEmail(identifier)
                .orElseGet(() -> accountRepository.findByPhoneNumber(identifier)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản!")));

        return buildProfileResponse(account);
    }

    private UserProfileResponse buildProfileResponse(Account account) {
        String fullName = userProfileRepository.findByAccountId(account.getId())
                .map(UserProfile::getFullName)
                .orElse("Người dùng SentinelCare");

        return UserProfileResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .fullName(fullName)
                .role(account.getRole().name())
                .status(account.getStatus().name())
                .build();
    }

    // ---------- Hàm hỗ trợ OTP & chuẩn hóa dữ liệu ----------

    private void startCooldownAndSendOtp(String email, String otp) {
        redisTemplate.opsForValue().set(REDIS_OTP_COOLDOWN_PREFIX + email, "BLOCKED",
                OTP_COOLDOWN_SECONDS, TimeUnit.SECONDS);
        emailService.sendOtpEmail(email, otp);
    }

    // Số giây còn lại của khóa chờ 60s trong Redis (0 nếu đã hết)
    private long getCooldownSeconds(String email) {
        Long ttl = redisTemplate.getExpire(REDIS_OTP_COOLDOWN_PREFIX + email, TimeUnit.SECONDS);
        return (ttl != null && ttl > 0) ? ttl : 0;
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    // Mọi SĐT lưu dưới dạng 0xxxxxxxxx (+84912... và 0912... là cùng một số)
    private String normalizePhone(String phone) {
        String p = phone == null ? "" : phone.replaceAll("[\\s.-]", "");
        if (p.startsWith("+84"))
            return "0" + p.substring(3);
        if (p.startsWith("84") && p.length() == 11)
            return "0" + p.substring(2);
        return p;
    }

    private String normalizeIdentifier(String identifier) {
        String value = identifier == null ? "" : identifier.trim();
        return value.contains("@") ? value.toLowerCase(Locale.ROOT) : normalizePhone(value);
    }
}