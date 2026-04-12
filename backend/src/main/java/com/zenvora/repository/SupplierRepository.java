package com.zenvora.repository;

import com.zenvora.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

       Optional<Supplier> findByEmail(String email);

       List<Supplier> findByIsActiveTrue();

       List<Supplier> findByIsActiveFalse();

       @Query("SELECT s FROM Supplier s WHERE LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                     "OR LOWER(s.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                     "OR LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
       List<Supplier> searchSuppliers(@Param("keyword") String keyword);

       boolean existsByEmail(String email);

       long countByIsActiveTrue();

       List<Supplier> findBySupplierNameContainingIgnoreCaseOrCompanyNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                     String keyword, String keyword2, String keyword3);
}
