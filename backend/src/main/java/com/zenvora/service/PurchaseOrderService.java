package com.zenvora.service;

import com.zenvora.model.PurchaseOrder;
import com.zenvora.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PurchaseOrderService {
    
    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;
    
    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }
    
    public Optional<PurchaseOrder> getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id);
    }
    
    public PurchaseOrder createPurchaseOrder(PurchaseOrder purchaseOrder) {
        purchaseOrder.setCreatedAt(LocalDateTime.now());
        purchaseOrder.setUpdatedAt(LocalDateTime.now());
        return purchaseOrderRepository.save(purchaseOrder);
    }
    
    public PurchaseOrder updatePurchaseOrder(Long id, PurchaseOrder purchaseOrderDetails) {
        Optional<PurchaseOrder> optionalOrder = purchaseOrderRepository.findById(id);
        if (optionalOrder.isPresent()) {
            PurchaseOrder order = optionalOrder.get();
            order.setPoNumber(purchaseOrderDetails.getPoNumber());
            order.setDate(purchaseOrderDetails.getDate());
            order.setSupplierName(purchaseOrderDetails.getSupplierName());
            order.setSupplierCompany(purchaseOrderDetails.getSupplierCompany());
            order.setSupplierAddress(purchaseOrderDetails.getSupplierAddress());
            order.setSupplierPhone(purchaseOrderDetails.getSupplierPhone());
            order.setSupplierEmail(purchaseOrderDetails.getSupplierEmail());
            order.setItemName(purchaseOrderDetails.getItemName());
            order.setUnit(purchaseOrderDetails.getUnit());
            order.setQuantity(purchaseOrderDetails.getQuantity());
            order.setDiscount(purchaseOrderDetails.getDiscount());
            order.setUnitPrice(purchaseOrderDetails.getUnitPrice());
            order.setTotalAmount(purchaseOrderDetails.getTotalAmount());
            order.setDeliveryDate(purchaseOrderDetails.getDeliveryDate());
            order.setUpdatedAt(LocalDateTime.now());
            return purchaseOrderRepository.save(order);
        }
        return null;
    }
    
    public void deletePurchaseOrder(Long id) {
        purchaseOrderRepository.deleteById(id);
    }
    
    public List<PurchaseOrder> getPurchaseOrdersByMonthAndYear(int month, int year) {
        return purchaseOrderRepository.findByMonthAndYear(month, year);
    }
    
    public List<String> getAllDistinctItems() {
        return purchaseOrderRepository.findAllDistinctItems();
    }
}