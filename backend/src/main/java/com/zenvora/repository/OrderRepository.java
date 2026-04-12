package com.zenvora.repository;

import com.zenvora.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Basic methods
    List<Order> findByStatus(String status);
    List<Order> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<Order> findByCreatedAtBetweenAndStatus(LocalDateTime startDate, LocalDateTime endDate, String status);
    
    // Customer methods by phone
    List<Order> findByCustomerPhone(String customerPhone);
    List<Order> findByCustomerPhoneAndStatus(String customerPhone, String status);
    List<Order> findByCustomerPhoneAndCreatedAtBetween(String customerPhone, LocalDateTime startDate, LocalDateTime endDate);
    List<Order> findByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);
    
    // Customer methods by email
    List<Order> findByCustomerEmail(String customerEmail);
    List<Order> findByCustomerEmailAndStatus(String customerEmail, String status);
    List<Order> findByCustomerEmailAndCreatedAtBetween(String customerEmail, LocalDateTime startDate, LocalDateTime endDate);
    List<Order> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);
    
    // Customer methods by ID
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByCustomerIdAndStatus(Long customerId, String status);
    List<Order> findByCustomerIdAndCreatedAtBetween(Long customerId, LocalDateTime startDate, LocalDateTime endDate);
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}