package com.zenvora.controller;

import com.zenvora.model.Supplier;
import com.zenvora.service.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(originPatterns = "http://localhost:3000", allowCredentials = "true")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllSuppliers() {
        try {
            List<Supplier> suppliers = supplierService.getAllSuppliers();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", suppliers);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveSuppliers() {
        try {
            List<Supplier> suppliers = supplierService.getActiveSuppliers();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", suppliers);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchSuppliers(@RequestParam String keyword) {
        try {
            List<Supplier> suppliers = supplierService.searchSuppliers(keyword);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", suppliers);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSupplierById(@PathVariable Long id) {
        try {
            Optional<Supplier> supplier = supplierService.getSupplierById(id);
            Map<String, Object> response = new HashMap<>();
            if (supplier.isPresent()) {
                response.put("success", true);
                response.put("data", supplier.get());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Supplier not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSupplier(@RequestBody Supplier supplier) {
        try {
            Supplier createdSupplier = supplierService.createSupplier(supplier);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Supplier created successfully");
            response.put("data", createdSupplier);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplier) {
        try {
            Supplier updatedSupplier = supplierService.updateSupplier(id, supplier);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Supplier updated successfully");
            response.put("data", updatedSupplier);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSupplier(@PathVariable Long id) {
        try {
            supplierService.deleteSupplier(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Supplier deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateSupplier(@PathVariable Long id) {
        try {
            Supplier supplier = supplierService.deactivateSupplier(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Supplier deactivated successfully");
            response.put("data", supplier);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Map<String, Object>> activateSupplier(@PathVariable Long id) {
        try {
            Supplier supplier = supplierService.activateSupplier(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Supplier activated successfully");
            response.put("data", supplier);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @GetMapping("/stats/count")
    public ResponseEntity<Map<String, Object>> getSupplierStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("success", true);
            stats.put("active", supplierService.getActiveSuppliersCount());
            stats.put("total", (long) supplierService.getAllSuppliers().size());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}