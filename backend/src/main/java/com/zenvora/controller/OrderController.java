package com.zenvora.controller;

import com.zenvora.model.Order;
import com.zenvora.model.OrderItem;
import com.zenvora.service.OrderService;
import com.zenvora.service.ProductService;
import com.zenvora.service.ProductService.ProductStockUpdate;
import com.zenvora.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(originPatterns = "http://localhost:3000", allowCredentials = "true")
public class OrderController {

    @Autowired
    private OrderService orderService;
    
    @Autowired
    private ProductService productService;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    // CREATE order with stock decrement and order items
    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> payload) {
        try {
            System.out.println("=== CREATE ORDER ===");
            System.out.println("Payload: " + payload);
            
            // Extract cart items for stock update
            List<Map<String, Object>> cartItems = null;
            if (payload.get("cartItems") != null) {
                cartItems = (List<Map<String, Object>>) payload.get("cartItems");
            }
            
            // First, check if all items have sufficient stock
            if (cartItems != null && !cartItems.isEmpty()) {
                List<ProductStockUpdate> stockUpdates = new ArrayList<>();
                for (Map<String, Object> item : cartItems) {
                    String productId = getProductIdAsString(item.get("id"));
                    int quantity = ((Number) item.get("quantity")).intValue();
                    stockUpdates.add(new ProductStockUpdate(productId, quantity));
                    System.out.println("Checking stock for product: " + productId + ", quantity: " + quantity);
                }
                
                // Check stock availability
                if (!productService.checkStockAvailability(stockUpdates)) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Some items are out of stock or have insufficient quantity");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                }
            }
            
            // Create the order
            Order order = new Order();
            String orderNumber = "ORD-" + System.currentTimeMillis();
            order.setOrderNumber(orderNumber);
            
            String customerName    = payload.get("customerName")    != null ? payload.get("customerName").toString().trim()    : "";
            String customerEmail   = payload.get("customerEmail")   != null ? payload.get("customerEmail").toString().trim()   : "";
            Long   customerId      = payload.get("customerId")      != null ? Long.valueOf(payload.get("customerId").toString()) : null;
            String customerPhone   = payload.get("customerPhone")   != null ? payload.get("customerPhone").toString().trim()   : "";
            String shippingAddress = payload.get("shippingAddress") != null ? payload.get("shippingAddress").toString().trim() : "";
            String city            = payload.get("city")            != null ? payload.get("city").toString().trim()            : "";
            String orderNotes      = payload.get("orderNotes")      != null ? payload.get("orderNotes").toString().trim()      : "";
            
            BigDecimal totalAmount = BigDecimal.ZERO;
            if (payload.get("totalAmount") != null) {
                totalAmount = new BigDecimal(payload.get("totalAmount").toString());
            }
            
            String status = payload.get("status") != null ? payload.get("status").toString() : "PENDING";
            
            order.setCustomerName(customerName);
            order.setCustomerEmail(customerEmail);
            order.setCustomerId(customerId);
            order.setCustomerPhone(customerPhone);
            order.setShippingAddress(shippingAddress);
            order.setCity(city);
            order.setOrderNotes(orderNotes);
            order.setTotalAmount(totalAmount);
            order.setStatus(status);
            
            System.out.println("Order to save: " + order);
            
            Order savedOrder = orderService.createOrder(order);
            System.out.println("Saved order ID: " + savedOrder.getOrderId());
            
            // Save order items
            if (cartItems != null && !cartItems.isEmpty()) {
                List<OrderItem> orderItems = new ArrayList<>();
                for (Map<String, Object> item : cartItems) {
                    String productId   = getProductIdAsString(item.get("id"));
                    String productName = item.get("name").toString();
                    int    quantity    = ((Number) item.get("quantity")).intValue();
                    BigDecimal price   = new BigDecimal(item.get("price").toString());
                    BigDecimal subtotal = price.multiply(BigDecimal.valueOf(quantity));
                    
                    OrderItem orderItem = new OrderItem();
                    orderItem.setProductId(productId);
                    orderItem.setProductName(productName);
                    orderItem.setQuantity(quantity);
                    orderItem.setPrice(price);
                    orderItem.setSubtotal(subtotal);
                    orderItem.setOrderId(savedOrder.getOrderId());
                    
                    orderItems.add(orderItem);
                    System.out.println("Adding item: " + productName + " x" + quantity + " = Rs." + subtotal);
                }
                
                // Save all order items
                orderItemRepository.saveAll(orderItems);
                savedOrder.setItems(orderItems);
                System.out.println("Saved " + orderItems.size() + " order items");
            }
            
            // Decrease stock after order is saved (batch)
            if (cartItems != null && !cartItems.isEmpty()) {
                List<ProductStockUpdate> stockUpdates = new ArrayList<>();
                for (Map<String, Object> item : cartItems) {
                    String productId = getProductIdAsString(item.get("id"));
                    int quantity = ((Number) item.get("quantity")).intValue();
                    stockUpdates.add(new ProductStockUpdate(productId, quantity));
                }
                productService.decreaseStock(stockUpdates);
                System.out.println("Stock decreased successfully for order: " + savedOrder.getOrderNumber());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Order created successfully");
            response.put("data", savedOrder);
            response.put("orderId", savedOrder.getOrderId());
            response.put("orderNumber", savedOrder.getOrderNumber());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    // Helper method to convert product ID to String (handles both Number and String)
    private String getProductIdAsString(Object idObj) {
        if (idObj == null) return null;
        if (idObj instanceof String) {
            return (String) idObj;
        }
        if (idObj instanceof Number) {
            return String.valueOf(((Number) idObj).longValue());
        }
        return idObj.toString();
    }
    
    // GET all orders (Admin)
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        try {
            List<Order> orders = orderService.getAllOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // GET orders by customer email (User)
    @GetMapping("/customer/email")
    public ResponseEntity<?> getOrdersByEmail(@RequestParam String email) {
        try {
            List<Order> orders = orderService.getOrdersByCustomerEmail(email);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // GET orders by customer phone
    @GetMapping("/customer/phone")
    public ResponseEntity<?> getOrdersByPhone(@RequestParam String phone) {
        try {
            List<Order> orders = orderService.getOrdersByCustomerPhone(phone);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // GET order by ID with items
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        try {
            Optional<Order> orderOpt = orderService.getOrderById(id);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                List<OrderItem> items = orderItemRepository.findByOrderId(id);
                order.setItems(items);
                return ResponseEntity.ok(order);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // UPDATE order
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateOrder(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Optional<Order> orderOpt = orderService.getOrderById(id);
            if (!orderOpt.isPresent()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Order order = orderOpt.get();
            
            if (payload.containsKey("customerName"))    order.setCustomerName(payload.get("customerName").toString());
            if (payload.containsKey("customerEmail"))   order.setCustomerEmail(payload.get("customerEmail").toString());
            if (payload.containsKey("customerId"))      order.setCustomerId(Long.valueOf(payload.get("customerId").toString()));
            if (payload.containsKey("customerPhone"))   order.setCustomerPhone(payload.get("customerPhone").toString());
            if (payload.containsKey("shippingAddress")) order.setShippingAddress(payload.get("shippingAddress").toString());
            if (payload.containsKey("city"))            order.setCity(payload.get("city").toString());
            if (payload.containsKey("orderNotes"))      order.setOrderNotes(payload.get("orderNotes").toString());
            if (payload.containsKey("totalAmount"))     order.setTotalAmount(new BigDecimal(payload.get("totalAmount").toString()));
            if (payload.containsKey("status"))          order.setStatus(payload.get("status").toString());
            
            order.setUpdatedAt(LocalDateTime.now());
            Order updatedOrder = orderService.updateOrder(order);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Order updated successfully");
            response.put("data", updatedOrder);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    // UPDATE status only
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            Optional<Order> orderOpt = orderService.getOrderById(id);
            if (!orderOpt.isPresent()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Order order = orderOpt.get();
            String newStatus = payload.get("status");
            if (newStatus != null) {
                order.setStatus(newStatus);
                order.setUpdatedAt(LocalDateTime.now());
                orderService.updateOrder(order);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Status updated successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    // DELETE order
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteOrder(@PathVariable Long id) {
        try {
            orderService.deleteOrder(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Order deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
    
    // Generate order report
    @GetMapping("/report")
    public ResponseEntity<byte[]> generateOrderReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status) {
        
        try {
            byte[] pdfReport = orderService.generateOrderReport(startDate, endDate, status);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String filename = "order_report_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".pdf";
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfReport);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get order statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrderStats() {
        try {
            List<Order> orders = orderService.getAllOrders();
            
            long   totalOrders      = orders.size();
            double totalRevenue     = orders.stream().map(Order::getTotalAmount).filter(Objects::nonNull).mapToDouble(BigDecimal::doubleValue).sum();
            long   pendingOrders    = orders.stream().filter(o -> "PENDING".equals(o.getStatus())).count();
            long   processingOrders = orders.stream().filter(o -> "PROCESSING".equals(o.getStatus())).count();
            long   shippedOrders    = orders.stream().filter(o -> "SHIPPED".equals(o.getStatus())).count();
            long   deliveredOrders  = orders.stream().filter(o -> "DELIVERED".equals(o.getStatus())).count();
            long   cancelledOrders  = orders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count();
            
            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalOrders",      totalOrders);
            stats.put("totalRevenue",     totalRevenue);
            stats.put("pendingOrders",    pendingOrders);
            stats.put("processingOrders", processingOrders);
            stats.put("shippedOrders",    shippedOrders);
            stats.put("deliveredOrders",  deliveredOrders);
            stats.put("cancelledOrders",  cancelledOrders);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}