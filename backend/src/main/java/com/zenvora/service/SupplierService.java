package com.zenvora.service;

import com.zenvora.model.Supplier;
import com.zenvora.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    // Get all suppliers
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    // Get active suppliers
    public List<Supplier> getActiveSuppliers() {
        return supplierRepository.findByIsActiveTrue();
    }

    // Search suppliers
    public List<Supplier> searchSuppliers(String keyword) {
        return supplierRepository.searchSuppliers(keyword);
    }

    // Get supplier by ID
    public Optional<Supplier> getSupplierById(Long id) {
        return supplierRepository.findById(id);
    }

    // Create new supplier
    public Supplier createSupplier(Supplier supplier) {
        if (supplierRepository.existsByEmail(supplier.getEmail())) {
            throw new RuntimeException("Email already exists: " + supplier.getEmail());
        }
        return supplierRepository.save(supplier);
    }

    // Update supplier
    @Transactional
    public Supplier updateSupplier(Long id, Supplier supplierDetails) {
        Supplier existingSupplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));

        existingSupplier.setSupplierName(supplierDetails.getSupplierName());
        existingSupplier.setItemName(supplierDetails.getItemName());
        existingSupplier.setCompanyName(supplierDetails.getCompanyName());

        if (!existingSupplier.getEmail().equals(supplierDetails.getEmail())) {
            if (supplierRepository.existsByEmail(supplierDetails.getEmail())) {
                throw new RuntimeException("Email already exists: " + supplierDetails.getEmail());
            }
            existingSupplier.setEmail(supplierDetails.getEmail());
        }

        existingSupplier.setContactNumber(supplierDetails.getContactNumber());
        existingSupplier.setAddress(supplierDetails.getAddress());
        existingSupplier.setTaxNumber(supplierDetails.getTaxNumber());
        existingSupplier.setPaymentTerms(supplierDetails.getPaymentTerms());

        if (supplierDetails.getIsActive() != null) {
            existingSupplier.setIsActive(supplierDetails.getIsActive());
        }

        return supplierRepository.save(existingSupplier);
    }

    // Delete supplier (hard delete)
    @Transactional
    public void deleteSupplier(Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new RuntimeException("Supplier not found with id: " + id);
        }
        supplierRepository.deleteById(id);
    }

    // Deactivate supplier (soft delete)
    @Transactional
    public Supplier deactivateSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));
        supplier.setIsActive(false);
        return supplierRepository.save(supplier);
    }

    // Activate supplier
    @Transactional
    public Supplier activateSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));
        supplier.setIsActive(true);
        return supplierRepository.save(supplier);
    }

    // Get active suppliers count
    public long getActiveSuppliersCount() {
        return supplierRepository.countByIsActiveTrue();
    }
}
