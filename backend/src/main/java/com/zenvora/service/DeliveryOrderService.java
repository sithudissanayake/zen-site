package com.zenvora.service;

import com.zenvora.model.DeliveryOrder;
import com.zenvora.model.Order;
import com.zenvora.model.Driver;
import com.zenvora.repository.DeliveryOrderRepository;
import com.zenvora.repository.OrderRepository;
import com.zenvora.repository.DriverRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DeliveryOrderService {

    private static final Logger logger = LoggerFactory.getLogger(DeliveryOrderService.class);

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DriverRepository driverRepository;

    // =========================================================================
    // READ — plain list
    // =========================================================================

    public List<DeliveryOrder> getAllDeliveryOrders() {
        return deliveryOrderRepository.findAll();
    }

    // =========================================================================
    // READ — enriched (DeliveryOrder fields + linked Order fields merged)
    // =========================================================================

    /**
     * Returns every DeliveryOrder merged with its linked Order data.
     * Frontend receives: id, orderId, driverId, customerName, address,
     * status, deliveryDate, createdAt, updatedAt  +  orderNumber,
     * customerEmail, customerPhone, city, totalAmount, orderNotes, orderStatus
     */
    public List<Map<String, Object>> getAllDeliveryOrdersEnriched() {
        return deliveryOrderRepository.findAll()
                .stream()
                .map(this::enrichDeliveryOrder)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getDeliveryOrdersByStatusEnriched(String status) {
        return deliveryOrderRepository.findByStatus(status)
                .stream()
                .map(this::enrichDeliveryOrder)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getDeliveryOrdersByDriverEnriched(String driverId) {
        return deliveryOrderRepository.findByDriverId(driverId)
                .stream()
                .map(this::enrichDeliveryOrder)
                .collect(Collectors.toList());
    }

    /**
     * Merges one DeliveryOrder with its linked Order into a flat Map.
     * Uses getOrderId() / getId() which are both defined on DeliveryOrder.
     */
    private Map<String, Object> enrichDeliveryOrder(DeliveryOrder d) {
        Map<String, Object> result = new HashMap<>();

        // DeliveryOrder own fields
        result.put("id",           d.getId());
        result.put("orderId",      d.getOrderId());      // String — e.g. "42"
        result.put("driverId",     d.getDriverId());
        result.put("customerName", d.getCustomerName());
        result.put("address",      d.getAddress());
        result.put("status",       d.getStatus());
        result.put("deliveryDate", d.getDeliveryDate());
        result.put("createdAt",    d.getCreatedAt());
        result.put("updatedAt",    d.getUpdatedAt());

        // Linked Order fields
        if (d.getOrderId() != null) {
            try {
                Long orderIdLong = Long.parseLong(d.getOrderId());
                Optional<Order> orderOpt = orderRepository.findById(orderIdLong);
                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();
                    result.put("orderNumber",   order.getOrderNumber());
                    result.put("customerEmail", order.getCustomerEmail());
                    result.put("customerPhone", order.getCustomerPhone());
                    result.put("city",          order.getCity());
                    result.put("totalAmount",   order.getTotalAmount());
                    result.put("orderNotes",    order.getOrderNotes());
                    result.put("orderStatus",   order.getStatus());
                }
            } catch (NumberFormatException e) {
                logger.warn("DeliveryOrder id={} has non-numeric orderId: {}",
                        d.getId(), d.getOrderId());
            }
        }

        // Linked Driver fields — resolve driverId (String) to Driver entity
        if (d.getDriverId() != null && !d.getDriverId().isEmpty()) {
            try {
                Optional<Driver> driverOpt = driverRepository.findByDriverId(d.getDriverId());
                if (driverOpt.isPresent()) {
                    Driver driver = driverOpt.get();
                    result.put("driverName", driver.getName());
                    result.put("driverPhone", driver.getPhone());
                    result.put("driverAddress", driver.getAddress());
                    result.put("vehicleNo", driver.getVehicleNo());
                    result.put("vehicleType", driver.getVehicleType());
                }
            } catch (Exception e) {
                logger.warn("Failed to enrich driver for DeliveryOrder id={}: {}",
                        d.getId(), e.getMessage());
            }
        }

        return result;
    }

    // =========================================================================
    // READ — single record
    // =========================================================================

    public Optional<DeliveryOrder> getDeliveryOrderById(Long id) {
        return deliveryOrderRepository.findById(id);
    }

    public Optional<DeliveryOrder> getDeliveryOrderByOrderId(String orderId) {
        return deliveryOrderRepository.findByOrderId(orderId);
    }

    public Map<String, Object> getDeliveryOrderByOrderIdEnriched(String orderId) {
        return deliveryOrderRepository.findByOrderId(orderId)
                .map(this::enrichDeliveryOrder)
                .orElse(null);
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    public DeliveryOrder createDeliveryOrder(DeliveryOrder order) {
        // @PrePersist on DeliveryOrder sets status/createdAt/updatedAt if null
        return deliveryOrderRepository.save(order);
    }

    // =========================================================================
    // UPDATE — full record
    // =========================================================================

    public DeliveryOrder updateDeliveryOrder(Long id, DeliveryOrder orderDetails) {
        Optional<DeliveryOrder> existing = deliveryOrderRepository.findById(id);
        if (existing.isPresent()) {
            DeliveryOrder order = existing.get();
            order.setCustomerName(orderDetails.getCustomerName());
            order.setAddress(orderDetails.getAddress());
            order.setStatus(orderDetails.getStatus());
            order.setDeliveryDate(orderDetails.getDeliveryDate());
            order.setDriverId(orderDetails.getDriverId());
            // @PreUpdate sets updatedAt automatically
            return deliveryOrderRepository.save(order);
        }
        return null;
    }

    // =========================================================================
    // UPDATE — status only (also syncs back to the Order table)
    // =========================================================================

    @Transactional
    public DeliveryOrder updateStatus(Long id, String status) {
        Optional<DeliveryOrder> existing = deliveryOrderRepository.findById(id);
        if (existing.isPresent()) {
            DeliveryOrder delivery = existing.get();
            delivery.setStatus(status);
            DeliveryOrder saved = deliveryOrderRepository.save(delivery);

            // Mirror status change back to the linked Order
            if (delivery.getOrderId() != null) {
                try {
                    Long orderIdLong = Long.parseLong(delivery.getOrderId());
                    Optional<Order> orderOpt = orderRepository.findById(orderIdLong);
                    if (orderOpt.isPresent()) {
                        Order linkedOrder = orderOpt.get();
                        if ("DELIVERED".equals(status)) {
                            linkedOrder.setStatus("DELIVERED");
                        } else if ("IN_TRANSIT".equals(status)) {
                            linkedOrder.setStatus("SHIPPED");
                        } else if ("CANCELLED".equals(status)) {
                            linkedOrder.setStatus("CANCELLED");
                        }
                        orderRepository.save(linkedOrder);
                        logger.info("Order #{} status synced to {} via DeliveryOrder",
                                orderIdLong, status);
                    }
                } catch (NumberFormatException e) {
                    logger.warn("Could not sync Order status — non-numeric orderId: {}",
                            delivery.getOrderId());
                }
            }

            return saved;
        }
        return null;
    }

    // =========================================================================
    // UPDATE — assign driver
    // =========================================================================

    @Transactional
    public DeliveryOrder assignDriver(Long id, String driverId) {
        Optional<DeliveryOrder> existing = deliveryOrderRepository.findById(id);
        if (existing.isPresent()) {
            DeliveryOrder order = existing.get();
            order.setDriverId(driverId);
            if ("PENDING".equals(order.getStatus())) {
                order.setStatus("ASSIGNED");
            }
            return deliveryOrderRepository.save(order);
        }
        return null;
    }

    // =========================================================================
    // SYNC — back-fill DeliveryOrders for historical Orders
    // Call POST /api/delivery-orders/sync once after first deploy.
    // =========================================================================

    @Transactional
    public int syncOrdersToDelivery() {
        List<Order> allOrders = orderRepository.findAll();
        int created = 0;

        for (Order order : allOrders) {
            String orderIdStr = String.valueOf(order.getOrderId());

            // Skip if already has a DeliveryOrder
            if (deliveryOrderRepository.existsByOrderId(orderIdStr)) {
                continue;
            }

            // Skip terminal statuses
            if ("CANCELLED".equals(order.getStatus())
                    || "DELIVERED".equals(order.getStatus())) {
                continue;
            }

            DeliveryOrder delivery = new DeliveryOrder();
            delivery.setOrderId(orderIdStr);                    // setOrderId — defined on model
            delivery.setCustomerName(order.getCustomerName());

            String address = order.getShippingAddress() != null
                    ? order.getShippingAddress() : "";
            if (order.getCity() != null && !order.getCity().isEmpty()) {
                address = address.isEmpty()
                        ? order.getCity()
                        : address + ", " + order.getCity();
            }
            delivery.setAddress(address);
            delivery.setStatus("PENDING");
            delivery.setDeliveryDate(LocalDate.now().plusDays(3));
            // @PrePersist on DeliveryOrder handles createdAt/updatedAt

            deliveryOrderRepository.save(delivery);
            created++;
            logger.info("Synced: created DeliveryOrder for Order #{}", order.getOrderId());
        }

        return created;
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    public void deleteDeliveryOrder(Long id) {
        deliveryOrderRepository.deleteById(id);
    }
}