package com.zenvora.controller;

import com.zenvora.model.Driver;
import com.zenvora.service.DriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(originPatterns = "http://localhost:3000", allowCredentials = "true")
public class DriverController {

    @Autowired
    private DriverService driverService;

    // Get all drivers
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllDrivers() {
        try {
            List<Driver> drivers = driverService.getAllDrivers();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", drivers);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Get driver by ID (Long)
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDriverById(@PathVariable Long id) {
        try {
            Optional<Driver> driver = driverService.getDriverById(id);
            Map<String, Object> response = new HashMap<>();
            if (driver.isPresent()) {
                response.put("success", true);
                response.put("data", driver.get());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Driver not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Get driver by driverId (String)
    @GetMapping("/by-driver-id/{driverId}")
    public ResponseEntity<Map<String, Object>> getDriverByDriverId(@PathVariable String driverId) {
        try {
            Optional<Driver> driver = driverService.getDriverByDriverId(driverId);
            Map<String, Object> response = new HashMap<>();
            if (driver.isPresent()) {
                response.put("success", true);
                response.put("data", driver.get());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Driver not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Search drivers by name
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchDrivers(@RequestParam String keyword) {
        try {
            List<Driver> drivers = driverService.searchDriversByName(keyword);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", drivers);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Create new driver
    @PostMapping
    public ResponseEntity<Map<String, Object>> createDriver(@RequestBody Driver driver) {
        try {
            Driver createdDriver = driverService.createDriver(driver);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Driver created successfully");
            response.put("data", createdDriver);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Update driver by ID (Long)
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDriver(@PathVariable Long id, @RequestBody Driver driver) {
        try {
            Driver updatedDriver = driverService.updateDriver(id, driver);
            Map<String, Object> response = new HashMap<>();
            if (updatedDriver != null) {
                response.put("success", true);
                response.put("message", "Driver updated successfully");
                response.put("data", updatedDriver);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Driver not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Delete driver by ID (Long)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteDriver(@PathVariable Long id) {
        try {
            driverService.deleteDriver(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Driver deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Check if driver exists by ID
    @GetMapping("/exists/{id}")
    public ResponseEntity<Map<String, Object>> driverExists(@PathVariable Long id) {
        try {
            boolean exists = driverService.existsById(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("exists", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}