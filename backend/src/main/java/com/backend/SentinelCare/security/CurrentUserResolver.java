package com.backend.SentinelCare.security;

import com.backend.SentinelCare.exception.BusinessException;
import com.backend.SentinelCare.model.Account;
import com.backend.SentinelCare.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserResolver {

    private final AccountRepository accountRepository;

    // Subject của JWT là email; vẫn hỗ trợ tra theo số điện thoại
    public Long requireUserId(Authentication authentication) {
        String identifier = authentication.getName();
        return accountRepository.findByEmail(identifier)
                .or(() -> accountRepository.findByPhoneNumber(identifier))
                .map(Account::getId)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND",
                        "Không tìm thấy tài khoản đăng nhập."));
    }
}