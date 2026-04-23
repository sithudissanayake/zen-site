package com.zenvora.service;

import com.zenvora.model.Driver;
import com.zenvora.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    // Get all drivers
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    // Get driver by ID (Long)
    public Optional<Driver> getDriverById(Long id) {
        return driverRepository.findById(id);
    }

    // Get driver by driverId (String)
    public Optional<Driver> getDriverByDriverId(String driverId) {
        return driverRepository.findByDriverId(driverId);
    }

    // Create new driver
    public Driver createDriver(Driver driver) {
        // Set default status if not provided
        if (driver.getStatus() == null) {
            driver.setStatus("ACTIVE");
        }
        // Set timestamps
        driver.setCreatedAt(LocalDateTime.now());
        driver.setUpdatedAt(LocalDateTime.now());
        return driverRepository.save(driver);
    }

    // Update driver by ID
    public Driver updateDriver(Long id, Driver driverDetails) {
        Optional<Driver> existingDriver = driverRepository.findById(id);
        if (existingDriver.isPresent()) {
            Driver driver = existingDriver.get();
            driver.setDriverId(driverDetails.getDriverId());
            driver.setName(driverDetails.getName());
            driver.setLicenseNumber(driverDetails.getLicenseNumber());
            driver.setPhone(driverDetails.getPhone());
            driver.setStatus(driverDetails.getStatus());
            driver.setVehicleNo(driverDetails.getVehicleNo());
            driver.setVehicleType(driverDetails.getVehicleType());
            driver.setAddress(driverDetails.getAddress());  // ADD THIS LINE - FIXES ADDRESS
            driver.setUpdatedAt(LocalDateTime.now());
            return driverRepository.save(driver);
        }
        return null;
    }

    // Delete driver by ID
    public void deleteDriver(Long id) {
        driverRepository.deleteById(id);
    }

    // Delete driver by driverId (String)
    public void deleteDriverByDriverId(String driverId) {
        driverRepository.deleteByDriverId(driverId);
    }

    // Check if driver exists by ID
    public boolean existsById(Long id) {
        return driverRepository.existsById(id);
    }

    // Check if driver exists by driverId
    public boolean existsByDriverId(String driverId) {
        return driverRepository.existsByDriverId(driverId);
    }

    // Search drivers by name
    public List<Driver> searchDriversByName(String name) {
        return driverRepository.findByNameContainingIgnoreCase(name);
    }

    // Find drivers by vehicle type
    public List<Driver> getDriversByVehicleType(String vehicleType) {
        return driverRepository.findByVehicleType(vehicleType);
    }

    // Find drivers by status
    public List<Driver> getDriversByStatus(String status) {
        return driverRepository.findByStatus(status);
    }

    // Get all drivers ordered by name
    public List<Driver> getAllDriversOrderedByName() {
        return driverRepository.findAllOrderedByName();
    }

    // Check if vehicle number exists
    public boolean existsByVehicleNo(String vehicleNo) {
        return driverRepository.existsByVehicleNo(vehicleNo);
    }
}