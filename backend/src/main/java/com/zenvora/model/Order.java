package com.zenvora.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "orderid")
    private Long orderId;

    @Column(name = "order_number")
    private String orderNumber;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "shipping_address")
    private String shippingAddress;

    @Column(name = "city")
    private String city;

    @Column(name = "order_notes")
    private String orderNotes;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Order items are loaded separately via OrderItemRepository — NOT a JPA relation
    @Transient
    private List<OrderItem> items = new ArrayList<>();

    // NOTE: The link to DeliveryOrder is intentionally NOT mapped as a JPA
    // @OneToOne here. DeliveryOrder holds a plain String orderId column that
    // stores the Order PK as a string. The join is done in service layer code,
    // not by Hibernate. This avoids the "mappedBy property does not exist" error.

    // Constructors
    public Order() {}

    // Getters
    public Long getOrderId()             { return orderId; }
    public String getOrderNumber()       { return orderNumber; }
    public String getCustomerName()      { return customerName; }
    public String getCustomerEmail()     { return customerEmail; }
    public Long getCustomerId()          { return customerId; }
    public String getCustomerPhone()     { return customerPhone; }
    public String getShippingAddress()   { return shippingAddress; }
    public String getCity()              { return city; }
    public String getOrderNotes()        { return orderNotes; }
    public BigDecimal getTotalAmount()   { return totalAmount; }
    public String getStatus()            { return status; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
    public LocalDateTime getUpdatedAt()  { return updatedAt; }
    public List<OrderItem> getItems()    { return items; }

    // Setters
    public void setOrderId(Long orderId)                 { this.orderId = orderId; }
    public void setOrderNumber(String orderNumber)       { this.orderNumber = orderNumber; }
    public void setCustomerName(String customerName)     { this.customerName = customerName; }
    public void setCustomerEmail(String customerEmail)   { this.customerEmail = customerEmail; }
    public void setCustomerId(Long customerId)           { this.customerId = customerId; }
    public void setCustomerPhone(String customerPhone)   { this.customerPhone = customerPhone; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }
    public void setCity(String city)                     { this.city = city; }
    public void setOrderNotes(String orderNotes)         { this.orderNotes = orderNotes; }
    public void setTotalAmount(BigDecimal totalAmount)   { this.totalAmount = totalAmount; }
    public void setStatus(String status)                 { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt)    { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt)    { this.updatedAt = updatedAt; }
    public void setItems(List<OrderItem> items)          { this.items = items; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}