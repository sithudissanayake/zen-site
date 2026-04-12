package com.zenvora.repository;

import com.zenvora.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    // Find by driverId (String field)
    Optional<Driver> findByDriverId(String driverId);
    
    // Check if driver exists by driverId
    boolean existsByDriverId(String driverId);
    
    // Delete by driverId
    void deleteByDriverId(String driverId);
    
    // Find drivers whose name contains the search term (case-insensitive)
    List<Driver> findByNameContainingIgnoreCase(String name);

    // Find drivers by vehicle type
    List<Driver> findByVehicleType(String vehicleType);
    
    // Find drivers by status
    List<Driver> findByStatus(String status);

    // Find drivers by license number
    Optional<Driver> findByLicenseNumber(String licenseNumber);

    // Custom JPQL query — find all drivers ordered by name
    @Query("SELECT d FROM Driver d ORDER BY d.name ASC")
    List<Driver> findAllOrderedByName();

    // Check if a driver with a given vehicle number exists
    boolean existsByVehicleNo(String vehicleNo);
}