package com.zenvora.service;

import com.zenvora.model.DeliveryOrder;
import com.zenvora.repository.DeliveryOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DeliveryOrderService {

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    // Get all delivery orders
    public List<DeliveryOrder> getAllDeliveryOrders() {
        return deliveryOrderRepository.findAll();
    }

    // Get delivery order by ID
    public Optional<DeliveryOrder> getDeliveryOrderById(Long id) {
        return deliveryOrderRepository.findById(id);
    }

    // Get delivery order by Order ID
    public Optional<DeliveryOrder> getDeliveryOrderByOrderId(String orderId) {
        return deliveryOrderRepository.findByOrderId(orderId);
    }

    // Get delivery orders by status
    public List<DeliveryOrder> getDeliveryOrdersByStatus(String status) {
        return deliveryOrderRepository.findByStatus(status);
    }

    // Get delivery orders by driver
    public List<DeliveryOrder> getDeliveryOrdersByDriverId(String driverId) {
        return deliveryOrderRepository.findByDriverId(driverId);
    }

    // Create new delivery order
    public DeliveryOrder createDeliveryOrder(DeliveryOrder deliveryOrder) {
        if (deliveryOrder.getStatus() == null) {
            deliveryOrder.setStatus("SCHEDULED");
        }
        if (deliveryOrder.getPriority() == null) {
            deliveryOrder.setPriority("NORMAL");
        }
        deliveryOrder.setCreatedAt(LocalDateTime.now());
        deliveryOrder.setUpdatedAt(LocalDateTime.now());
        return deliveryOrderRepository.save(deliveryOrder);
    }

    // Update delivery order
    public DeliveryOrder updateDeliveryOrder(Long id, DeliveryOrder orderDetails) {
        Optional<DeliveryOrder> existingOrder = deliveryOrderRepository.findById(id);
        if (existingOrder.isPresent()) {
            DeliveryOrder order = existingOrder.get();
            order.setCustomerName(orderDetails.getCustomerName());
            order.setCustomerPhone(orderDetails.getCustomerPhone());
            order.setDeliveryAddress(orderDetails.getDeliveryAddress());
            order.setCity(orderDetails.getCity());
            order.setDriverId(orderDetails.getDriverId());
            order.setDriverName(orderDetails.getDriverName());
            order.setDeliveryDate(orderDetails.getDeliveryDate());
            order.setEstimatedTime(orderDetails.getEstimatedTime());
            order.setPriority(orderDetails.getPriority());
            order.setNotes(orderDetails.getNotes());
            order.setStatus(orderDetails.getStatus());
            order.setUpdatedAt(LocalDateTime.now());
            return deliveryOrderRepository.save(order);
        }
        return null;
    }

    // Update delivery order status
    public DeliveryOrder updateDeliveryOrderStatus(Long id, String status) {
        Optional<DeliveryOrder> existingOrder = deliveryOrderRepository.findById(id);
        if (existingOrder.isPresent()) {
            DeliveryOrder order = existingOrder.get();
            order.setStatus(status);
            order.setUpdatedAt(LocalDateTime.now());
            return deliveryOrderRepository.save(order);
        }
        return null;
    }

    // Delete delivery order
    public void deleteDeliveryOrder(Long id) {
        deliveryOrderRepository.deleteById(id);
    }

    // Delete by Order ID
    public void deleteDeliveryOrderByOrderId(String orderId) {
        deliveryOrderRepository.deleteByOrderId(orderId);
    }

    // Check if exists
    public boolean existsByOrderId(String orderId) {
        return deliveryOrderRepository.existsByOrderId(orderId);
    }
}