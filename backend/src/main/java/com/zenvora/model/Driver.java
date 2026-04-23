package com.zenvora.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver")
public class Driver {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "driver_id", unique = true)
    private String driverId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "license_number", unique = true)
    private String licenseNumber;
    
    @Column(nullable = false)
    private String phone;
    
    private String status;
    
    @Column(name = "vehicle_no")
    private String vehicleNo;
    
    @Column(name = "vehicle_type")
    private String vehicleType;
    
    @Column(name = "address", columnDefinition = "VARCHAR(200)")  // Make sure this is correct
    private String address;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Driver() {}
    
    // Getters and Setters
    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }
    
    public String getDriverId() { 
        return driverId; 
    }
    
    public void setDriverId(String driverId) { 
        this.driverId = driverId; 
    }
    
    public String getName() { 
        return name; 
    }
    
    public void setName(String name) { 
        this.name = name; 
    }
    
    public String getLicenseNumber() { 
        return licenseNumber; 
    }
    
    public void setLicenseNumber(String licenseNumber) { 
        this.licenseNumber = licenseNumber; 
    }
    
    public String getPhone() { 
        return phone; 
    }
    
    public void setPhone(String phone) { 
        this.phone = phone; 
    }
    
    public String getStatus() { 
        return status; 
    }
    
    public void setStatus(String status) { 
        this.status = status; 
    }
    
    public String getVehicleNo() { 
        return vehicleNo; 
    }
    
    public void setVehicleNo(String vehicleNo) { 
        this.vehicleNo = vehicleNo; 
    }
    
    public String getVehicleType() { 
        return vehicleType; 
    }
    
    public void setVehicleType(String vehicleType) { 
        this.vehicleType = vehicleType; 
    }
    
    public String getAddress() { 
        return address; 
    }
    
    public void setAddress(String address) { 
        this.address = address; 
    }
    
    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }
    
    public LocalDateTime getUpdatedAt() { 
        return updatedAt; 
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) { 
        this.updatedAt = updatedAt; 
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}