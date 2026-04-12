package com.zenvora.service;

import com.zenvora.model.DeliveryOrder;
import com.zenvora.repository.DeliveryOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    // Get delivery order by ID (Long)
    public Optional<DeliveryOrder> getDeliveryOrderById(Long id) {
        return deliveryOrderRepository.findById(id);
    }

    // Get delivery order by orderId (String)
    public Optional<DeliveryOrder> getDeliveryOrderByOrderId(String orderId) {
        return deliveryOrderRepository.findByOrderId(orderId);
    }

    // Create delivery order
    public DeliveryOrder createDeliveryOrder(DeliveryOrder order) {
        return deliveryOrderRepository.save(order);
    }

    // Update delivery order
    public DeliveryOrder updateDeliveryOrder(Long id, DeliveryOrder orderDetails) {
        Optional<DeliveryOrder> existingOrder = deliveryOrderRepository.findById(id);
        if (existingOrder.isPresent()) {
            DeliveryOrder order = existingOrder.get();
            order.setCustomerName(orderDetails.getCustomerName());
            order.setAddress(orderDetails.getAddress());
            order.setStatus(orderDetails.getStatus());
            order.setDeliveryDate(orderDetails.getDeliveryDate());
            order.setDriverId(orderDetails.getDriverId());
            return deliveryOrderRepository.save(order);
        }
        return null;
    }

    // Update status
    public DeliveryOrder updateStatus(Long id, String status) {
        Optional<DeliveryOrder> existingOrder = deliveryOrderRepository.findById(id);
        if (existingOrder.isPresent()) {
            DeliveryOrder order = existingOrder.get();
            order.setStatus(status);
            return deliveryOrderRepository.save(order);
        }
        return null;
    }

    // Delete delivery order
    public void deleteDeliveryOrder(Long id) {
        deliveryOrderRepository.deleteById(id);
    }
}