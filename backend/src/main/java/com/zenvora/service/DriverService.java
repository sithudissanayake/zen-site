package com.zenvora.service;

import com.zenvora.model.Driver;
import com.zenvora.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    // Get driver by driverId (String) - custom method
    public Optional<Driver> getDriverByDriverId(String driverId) {
        return driverRepository.findByDriverId(driverId);
    }

    // Create new driver
    public Driver createDriver(Driver driver) {
        return driverRepository.save(driver);
    }

    // Update driver by ID
    public Driver updateDriver(Long id, Driver driverDetails) {
        Optional<Driver> existingDriver = driverRepository.findById(id);
        if (existingDriver.isPresent()) {
            Driver driver = existingDriver.get();
            driver.setName(driverDetails.getName());
            driver.setLicenseNumber(driverDetails.getLicenseNumber());
            driver.setPhone(driverDetails.getPhone());
            driver.setStatus(driverDetails.getStatus());
            driver.setVehicleNo(driverDetails.getVehicleNo());
            driver.setVehicleType(driverDetails.getVehicleType());
            return driverRepository.save(driver);
        }
        return null;
    }

    // Delete driver by ID
    public void deleteDriver(Long id) {
        driverRepository.deleteById(id);
    }

    // Check if driver exists by ID
    public boolean existsById(Long id) {
        return driverRepository.existsById(id);
    }

    // Search drivers by name
    public List<Driver> searchDriversByName(String name) {
        return driverRepository.findByNameContainingIgnoreCase(name);
    }
}