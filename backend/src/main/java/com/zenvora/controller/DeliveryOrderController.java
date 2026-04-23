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

    // -----------------------------------------------------------------------
    // GET all delivery orders — enriched with full Order details
    // Use ?status=PENDING to filter by status
    // -----------------------------------------------------------------------
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllDeliveryOrders(
            @RequestParam(required = false) String status) {
        try {
            List<Map<String, Object>> orders;
            if (status != null && !status.isEmpty()) {
                orders = deliveryOrderService.getDeliveryOrdersByStatusEnriched(status);
            } else {
                orders = deliveryOrderService.getAllDeliveryOrdersEnriched();
            }
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", orders);
            response.put("count", orders.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // -----------------------------------------------------------------------
    // GET delivery orders for a specific driver — enriched
    // -----------------------------------------------------------------------
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<Map<String, Object>> getByDriver(@PathVariable String driverId) {
        try {
            List<Map<String, Object>> orders =
                    deliveryOrderService.getDeliveryOrdersByDriverEnriched(driverId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", orders);
            response.put("count", orders.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // -----------------------------------------------------------------------
    // GET delivery order by primary key (Long)
    // -----------------------------------------------------------------------
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
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // -----------------------------------------------------------------------
    // GET delivery order by orderId (the Order's PK as String) — enriched
    // -----------------------------------------------------------------------
    @GetMapping("/by-order-id/{orderId}")
    public ResponseEntity<Map<String, Object>> getDeliveryOrderByOrderId(@PathVariable String orderId) {
        try {
            Map<String, Object> enriched =
                    deliveryOrderService.getDeliveryOrderByOrderIdEnriched(orderId);
            Map<String, Object> response = new HashMap<>();
            if (enriched != null) {
                response.put("success", true);
                response.put("data", enriched);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Delivery order not found for order ID: " + orderId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // -----------------------------------------------------------------------
    // POST — create a delivery order manually
    // -----------------------------------------------------------------------
    @PostMapping
    public ResponseEntity<Map<String, Object>> createDeliveryOrder(@RequestBody DeliveryOrder order) {
        try {
            DeliveryOrder created = deliveryOrderService.createDeliveryOrder(order);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Delivery order created successfully");
            response.put("data", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // -----------------------------------------------------------------------
    // PUT — update delivery order details
    // -----------------------------------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDeliveryOrder(
            @PathVariable Long id, @RequestBody DeliveryOrder order) {
        try {
            DeliveryOrder updated = deliveryOrderService.updateDeliveryOrder(id, order);
            Map<String, Object> response = new HashMap<>();
            if (updated != null) {
                response.put("success", true);
                response.put("message", "Delivery order updated successfully");
                response.put("data", updated);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Delivery order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // -----------------------------------------------------------------------
    // PATCH /{id}/status  — update status only (also syncs back to Order)
    // Body: { "status": "IN_TRANSIT" }
    // -----------------------------------------------------------------------
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String status = payload.get("status");
            DeliveryOrder updated = deliveryOrderService.updateStatus(id, status);
            Map<String, Object> response = new HashMap<>();
            if (updated != null) {
                response.put("success", true);
                response.put("message", "Status updated successfully");
                response.put("data", updated);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Delivery order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // -----------------------------------------------------------------------
    // PATCH /{id}/assign-driver  — assign a driver
    // Body: { "driverId": "D001" }
    // -----------------------------------------------------------------------
    @PatchMapping("/{id}/assign-driver")
    public ResponseEntity<Map<String, Object>> assignDriver(
            @PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String driverId = payload.get("driverId");
            if (driverId == null || driverId.isEmpty()) {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("message", "driverId is required");
                return ResponseEntity.badRequest().body(err);
            }
            DeliveryOrder updated = deliveryOrderService.assignDriver(id, driverId);
            Map<String, Object> response = new HashMap<>();
            if (updated != null) {
                response.put("success", true);
                response.put("message", "Driver assigned successfully");
                response.put("data", updated);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Delivery order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // -----------------------------------------------------------------------
    // POST /sync  — scan all Orders and create DeliveryOrders for any
    //               that don't have one yet (historical data fix)
    // -----------------------------------------------------------------------
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncOrdersToDelivery() {
        try {
            int created = deliveryOrderService.syncOrdersToDelivery();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Sync complete. DeliveryOrders created: " + created);
            response.put("createdCount", created);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // -----------------------------------------------------------------------
    // DELETE /{id}
    // -----------------------------------------------------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteDeliveryOrder(@PathVariable Long id) {
        try {
            deliveryOrderService.deleteDeliveryOrder(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Delivery order deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }
}