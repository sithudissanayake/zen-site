package com.zenvora.repository;

import com.zenvora.model.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    
    Optional<DeliveryOrder> findByOrderId(String orderId);
    
    List<DeliveryOrder> findByStatus(String status);
    
    List<DeliveryOrder> findByDriverId(String driverId);
    
    List<DeliveryOrder> findByPriority(String priority);
    
    boolean existsByOrderId(String orderId);
    
    void deleteByOrderId(String orderId);
}