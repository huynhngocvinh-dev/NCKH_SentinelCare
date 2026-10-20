package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {
    Optional<Address> findByAccountId(Long accountId);
}