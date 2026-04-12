package com.zenvora.controller;

import com.zenvora.model.DeliveryOrder;
import com.zenvora.service.DeliveryOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/delivery-orders")
@CrossOrigin(originPatterns = "http://localhost:3000", allowCredentials = "true")
public class DeliveryOrderController {

    @Autowired
    private DeliveryOrderService deliveryOrderService;

    // Get all delivery orders
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllDeliveryOrders() {
        try {
            List<DeliveryOrder> orders = deliveryOrderService.getAllDeliveryOrders();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", orders);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Get delivery order by ID (Long)
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDeliveryOrderById(@PathVariable Long id) {
        try {
            Optional<DeliveryOrder> order = deliveryOrderService.getDeliveryOrderById(id);
            Map<String, Object> response = new HashMap<>();
            if (order.isPresent()) {
                response.put("success", true);
                response.put("data", order.get());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Delivery order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Get delivery order by orderId (String)
    @GetMapping("/by-order-id/{orderId}")
    public ResponseEntity<Map<String, Object>> getDeliveryOrderByOrderId(@PathVariable String orderId) {
        try {
            Optional<DeliveryOrder> order = deliveryOrderService.getDeliveryOrderByOrderId(orderId);
            Map<String, Object> response = new HashMap<>();
            if (order.isPresent()) {
                response.put("success", true);
                response.put("data", order.get());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Delivery order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Create new delivery order
    @PostMapping
    public ResponseEntity<Map<String, Object>> createDeliveryOrder(@RequestBody DeliveryOrder order) {
        try {
            DeliveryOrder createdOrder = deliveryOrderService.createDeliveryOrder(order);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Delivery order created successfully");
            response.put("data", createdOrder);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Update delivery order
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDeliveryOrder(@PathVariable Long id, @RequestBody DeliveryOrder order) {
        try {
            DeliveryOrder updatedOrder = deliveryOrderService.updateDeliveryOrder(id, order);
            Map<String, Object> response = new HashMap<>();
            if (updatedOrder != null) {
                response.put("success", true);
                response.put("message", "Delivery order updated successfully");
                response.put("data", updatedOrder);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Delivery order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Update delivery order status
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String status = payload.get("status");
            DeliveryOrder updatedOrder = deliveryOrderService.updateStatus(id, status);
            Map<String, Object> response = new HashMap<>();
            if (updatedOrder != null) {
                response.put("success", true);
                response.put("message", "Status updated successfully");
                response.put("data", updatedOrder);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Delivery order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Delete delivery order
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteDeliveryOrder(@PathVariable Long id) {
        try {
            deliveryOrderService.deleteDeliveryOrder(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Delivery order deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}