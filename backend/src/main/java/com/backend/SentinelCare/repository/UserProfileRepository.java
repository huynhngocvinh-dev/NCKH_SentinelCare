package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByAccountId(Long accountId);
}