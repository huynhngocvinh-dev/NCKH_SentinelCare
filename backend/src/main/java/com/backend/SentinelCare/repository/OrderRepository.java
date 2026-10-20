package com.backend.SentinelCare.repository;

import com.backend.SentinelCare.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}