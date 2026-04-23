package com.zenvora.service;

import com.zenvora.model.DeliveryOrder;
import com.zenvora.model.Order;
import com.zenvora.repository.DeliveryOrderRepository;
import com.zenvora.repository.OrderRepository;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    // orderItemRepository removed — items are saved in OrderController directly

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    // =========================================================================
    // CRUD
    // =========================================================================

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    /**
     * Saves the Order then auto-creates a linked DeliveryOrder so it
     * immediately appears in the delivery management screen.
     */
    public Order createOrder(Order order) {
        Order savedOrder = orderRepository.save(order);

        try {
            String orderIdStr = String.valueOf(savedOrder.getOrderId());

            if (!deliveryOrderRepository.existsByOrderId(orderIdStr)) {
                DeliveryOrder delivery = new DeliveryOrder();
                delivery.setOrderId(orderIdStr);
                delivery.setCustomerName(savedOrder.getCustomerName());

                String address = savedOrder.getShippingAddress() != null
                        ? savedOrder.getShippingAddress() : "";
                if (savedOrder.getCity() != null && !savedOrder.getCity().isEmpty()) {
                    address = address.isEmpty()
                            ? savedOrder.getCity()
                            : address + ", " + savedOrder.getCity();
                }
                delivery.setDeliveryAddress(address);
                delivery.setStatus("PENDING");
                delivery.setDeliveryDate(LocalDate.now().plusDays(3));
                // @PrePersist on DeliveryOrder handles createdAt/updatedAt

                deliveryOrderRepository.save(delivery);
                logger.info("Auto-created DeliveryOrder for Order #{}", savedOrder.getOrderId());
            }
        } catch (Exception e) {
            logger.error("Failed to auto-create DeliveryOrder for Order #{}: {}",
                    savedOrder.getOrderId(), e.getMessage());
        }

        return savedOrder;
    }

    /**
     * Updates the Order and syncs the linked DeliveryOrder status.
     */
    public Order updateOrder(Order order) {
        Order updatedOrder = orderRepository.save(order);

        try {
            String orderIdStr = String.valueOf(updatedOrder.getOrderId());
            Optional<DeliveryOrder> deliveryOpt =
                    deliveryOrderRepository.findByOrderId(orderIdStr);

            if (deliveryOpt.isPresent()) {
                DeliveryOrder delivery = deliveryOpt.get();
                String orderStatus = updatedOrder.getStatus();

                if ("CANCELLED".equals(orderStatus)) {
                    delivery.setStatus("CANCELLED");
                } else if ("DELIVERED".equals(orderStatus)) {
                    delivery.setStatus("DELIVERED");
                } else if ("SHIPPED".equals(orderStatus)
                        && !"DELIVERED".equals(delivery.getStatus())) {
                    delivery.setStatus("IN_TRANSIT");
                }
                deliveryOrderRepository.save(delivery);
            }
        } catch (Exception e) {
            logger.error("Failed to sync DeliveryOrder status for Order #{}: {}",
                    updatedOrder.getOrderId(), e.getMessage());
        }

        return updatedOrder;
    }

    /**
     * Deletes the Order and its linked DeliveryOrder.
     */
    public void deleteOrder(Long id) {
        try {
            Optional<DeliveryOrder> deliveryOpt =
                    deliveryOrderRepository.findByOrderId(String.valueOf(id));
            deliveryOpt.ifPresent(d -> deliveryOrderRepository.deleteById(d.getId()));
        } catch (Exception e) {
            logger.error("Failed to delete linked DeliveryOrder for Order #{}: {}",
                    id, e.getMessage());
        }
        orderRepository.deleteById(id);
    }

    // =========================================================================
    // Customer queries — by phone
    // =========================================================================

    public List<Order> getOrdersByCustomerPhone(String phone) {
        if (phone == null || phone.isEmpty()) return List.of();
        return orderRepository.findByCustomerPhone(phone);
    }

    public List<Order> getOrdersByCustomerPhoneAndStatus(String phone, String status) {
        if (phone == null || phone.isEmpty()) return List.of();
        return orderRepository.findByCustomerPhoneAndStatus(phone, status);
    }

    public List<Order> getOrdersByCustomerPhoneAndDateRange(
            String phone, LocalDateTime startDate, LocalDateTime endDate) {
        if (phone == null || phone.isEmpty()) return List.of();
        return orderRepository.findByCustomerPhoneAndCreatedAtBetween(phone, startDate, endDate);
    }

    public List<Order> getOrdersByCustomerPhoneOrderByDate(String phone) {
        if (phone == null || phone.isEmpty()) return List.of();
        return orderRepository.findByCustomerPhoneOrderByCreatedAtDesc(phone);
    }

    // =========================================================================
    // Customer queries — by email
    // =========================================================================

    public List<Order> getOrdersByCustomerEmail(String email) {
        if (email == null || email.isEmpty()) return List.of();
        return orderRepository.findByCustomerEmail(email);
    }

    public List<Order> getOrdersByCustomerEmailAndStatus(String email, String status) {
        if (email == null || email.isEmpty()) return List.of();
        return orderRepository.findByCustomerEmailAndStatus(email, status);
    }

    public List<Order> getOrdersByCustomerEmailOrderByDate(String email) {
        if (email == null || email.isEmpty()) return List.of();
        return orderRepository.findByCustomerEmailOrderByCreatedAtDesc(email);
    }

    // =========================================================================
    // Customer queries — by customer ID
    // =========================================================================

    public List<Order> getOrdersByCustomerId(Long customerId) {
        if (customerId == null) return List.of();
        return orderRepository.findByCustomerId(customerId);
    }

    // =========================================================================
    // Status / date range queries
    // =========================================================================

    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status);
    }

    public List<Order> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.findByCreatedAtBetween(startDate, endDate);
    }

    public List<Order> getOrdersByDateRangeAndStatus(
            LocalDateTime startDate, LocalDateTime endDate, String status) {
        return orderRepository.findByCreatedAtBetweenAndStatus(startDate, endDate, status);
    }

    // =========================================================================
    // PDF Report
    // =========================================================================

    public byte[] generateOrderReport(LocalDate startDate, LocalDate endDate, String status)
            throws Exception {
        List<Order> orders;
        LocalDateTime startDT = startDate != null ? startDate.atStartOfDay()   : null;
        LocalDateTime endDT   = endDate   != null ? endDate.atTime(23, 59, 59) : null;

        if (startDT != null && endDT != null && status != null && !status.isEmpty()) {
            orders = getOrdersByDateRangeAndStatus(startDT, endDT, status);
        } else if (startDT != null && endDT != null) {
            orders = getOrdersByDateRange(startDT, endDT);
        } else if (status != null && !status.isEmpty()) {
            orders = getOrdersByStatus(status);
        } else {
            orders = getAllOrders();
        }

        return generateOrderPdf(orders, startDate, endDate, status);
    }

    private byte[] generateOrderPdf(List<Order> orders,
            LocalDate startDate, LocalDate endDate, String status) throws Exception {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Paragraph title = new Paragraph("ORDER REPORT", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(10);
        document.add(title);

        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        String dateRange   = (startDate != null && endDate != null)
                ? startDate + " to " + endDate : "All Dates";
        String statusLabel = (status != null && !status.isEmpty()) ? status : "All";
        document.add(new Paragraph(
                "Date Range: " + dateRange + "  |  Status: " + statusLabel, subFont));
        document.add(new Paragraph(
                "Generated: " + LocalDateTime.now()
                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")), subFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 2f, 2f, 2f, 1.5f, 1.5f});

        Font hFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        BaseColor hColor = new BaseColor(70, 130, 180);
        for (String h : new String[]{"Order #", "Customer", "Phone", "Address", "Total (Rs)", "Status"}) {
            PdfPCell c = new PdfPCell(new Phrase(h, hFont));
            c.setBackgroundColor(hColor);
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            c.setPadding(6);
            table.addCell(c);
        }

        Font dFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        for (Order o : orders) {
            table.addCell(createCell(
                    o.getOrderNumber() != null ? o.getOrderNumber()
                            : String.valueOf(o.getOrderId()), dFont));
            table.addCell(createCell(
                    o.getCustomerName()  != null ? o.getCustomerName()  : "", dFont));
            table.addCell(createCell(
                    o.getCustomerPhone() != null ? o.getCustomerPhone() : "", dFont));
            String addr = (o.getShippingAddress() != null ? o.getShippingAddress() : "")
                    + (o.getCity() != null ? ", " + o.getCity() : "");
            table.addCell(createCell(addr, dFont));
            table.addCell(createCell(
                    o.getTotalAmount() != null
                            ? String.format("%,.2f", o.getTotalAmount()) : "0.00", dFont));
            table.addCell(createCell(
                    o.getStatus() != null ? o.getStatus() : "", dFont));
        }

        document.add(table);
        document.add(new Paragraph(" "));

        Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9);
        Paragraph footer = new Paragraph(
                "Total Orders: " + orders.size()
                        + "   |   Report generated by Zenvora System", footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        return out.toByteArray();
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setPadding(4);
        return cell;
    }
}