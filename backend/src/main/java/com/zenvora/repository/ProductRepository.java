package com.zenvora.repository;

import com.zenvora.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    // Basic find methods
    List<Product> findByCategory(String category);
    
    Page<Product> findByCategory(String category, Pageable pageable);
    
    List<Product> findByNameContainingIgnoreCase(String name);
    
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Stock related methods
    List<Product> findAllByOrderByStockDesc();
    
    List<Product> findByStockLessThan(int stock);
    
    // Search with multiple criteria
    @Query("SELECT p FROM Product p WHERE " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchProducts(@Param("category") String category, 
                                  @Param("search") String search, 
                                  Pageable pageable);
    
    // Stock update methods
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.stock = p.stock - :quantity WHERE p.id = :productId AND p.stock >= :quantity")
    int decreaseStock(@Param("productId") String productId, @Param("quantity") int quantity);
    
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.stock = p.stock + :quantity WHERE p.id = :productId")
    int increaseStock(@Param("productId") String productId, @Param("quantity") int quantity);
    
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Product p WHERE p.id = :productId AND p.stock >= :quantity")
    boolean hasSufficientStock(@Param("productId") String productId, @Param("quantity") int quantity);
    
    @Query("SELECT p FROM Product p WHERE p.stock <= :threshold ORDER BY p.stock ASC")
    List<Product> findLowStockProducts(@Param("threshold") int threshold);
    
    @Query("SELECT COALESCE(SUM(p.price * p.stock), 0) FROM Product p")
    Double getTotalStockValue();
    
    List<Product> findByStock(int stock);
}