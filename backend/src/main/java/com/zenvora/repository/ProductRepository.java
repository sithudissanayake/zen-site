package com.zenvora.repository;

import com.zenvora.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    
    Page<Product> findAll(Pageable pageable);
    
    Page<Product> findByCategory(String category, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Product> searchProducts(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) AND p.category = :category")
    Page<Product> searchProductsByCategory(@Param("search") String search, @Param("category") String category, Pageable pageable);
    
    List<Product> findByCategory(String category);
    
    // Check if product name exists (for duplicate validation)
    boolean existsByName(String name);
    
    // Check if product name exists excluding a specific ID
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Product p WHERE p.name = :name AND p.id != :excludeId")
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("excludeId") String excludeId);
    
    // Low stock products
    List<Product> findByStockLessThan(int threshold);
    
    // Out of stock products
    List<Product> findByStock(int stock);
    
    // Top stocked products
    List<Product> findTop3ByOrderByStockDesc();
    
    // Total inventory value
    @Query("SELECT SUM(p.price * p.stock) FROM Product p")
    Double getTotalInventoryValue();
    
    // Products needing restock (stock < 20)
    @Query("SELECT p FROM Product p WHERE p.stock < 20 ORDER BY p.stock ASC")
    List<Product> findProductsNeedingRestock();
}