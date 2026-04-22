package com.zenvora.repository;

import com.zenvora.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    
    List<PurchaseOrder> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<PurchaseOrder> findBySupplierCompany(String company);
    
    List<PurchaseOrder> findByItemName(String itemName);
    
    @Query("SELECT p FROM PurchaseOrder p WHERE MONTH(p.date) = :month AND YEAR(p.date) = :year")
    List<PurchaseOrder> findByMonthAndYear(@Param("month") int month, @Param("year") int year);
    
    @Query("SELECT p FROM PurchaseOrder p WHERE p.supplierCompany = :company AND MONTH(p.date) = :month AND YEAR(p.date) = :year")
    List<PurchaseOrder> findByCompanyAndMonthYear(@Param("company") String company, @Param("month") int month, @Param("year") int year);
    
    @Query("SELECT DISTINCT p.itemName FROM PurchaseOrder p")
    List<String> findAllDistinctItems();
}