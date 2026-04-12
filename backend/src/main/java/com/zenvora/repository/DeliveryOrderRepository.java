package com.zenvora.repository;

import com.zenvora.model.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    
    // Find by orderId (String field)
    Optional<DeliveryOrder> findByOrderId(String orderId);
    
    // Find by driverId
    List<DeliveryOrder> findByDriverId(String driverId);
    
    // Find by status
    List<DeliveryOrder> findByStatus(String status);
    
    // Check if exists by orderId
    boolean existsByOrderId(String orderId);
}