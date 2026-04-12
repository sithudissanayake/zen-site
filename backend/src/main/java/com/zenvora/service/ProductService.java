package com.zenvora.service;

import com.zenvora.model.Product;
import com.zenvora.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // Get all products (no pagination)
    public List<Product> getAllProductsList() {
        return productRepository.findAll();
    }

    // Get products with pagination
    public Page<Product> getAllProducts(int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        return productRepository.findAll(pageable);
    }

    // Get products by category with pagination
    public Page<Product> getProductsByCategory(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return productRepository.findByCategory(category, pageable);
    }

    // Search products by name
    public Page<Product> searchProducts(String searchTerm, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (searchTerm == null || searchTerm.isEmpty()) {
            return productRepository.findAll(pageable);
        }
        return productRepository.findByNameContainingIgnoreCase(searchTerm, pageable);
    }

    // Advanced search with filters
    public Page<Product> advancedSearch(String category, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        if (search != null && !search.isEmpty() && category != null && !category.isEmpty() && !category.equals("all")) {
            return productRepository.searchProducts(category, search, pageable);
        } else if (search != null && !search.isEmpty()) {
            return productRepository.findByNameContainingIgnoreCase(search, pageable);
        } else if (category != null && !category.isEmpty() && !category.equals("all")) {
            return productRepository.findByCategory(category, pageable);
        } else {
            return productRepository.findAll(pageable);
        }
    }

    // Get product by ID
    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    // Create product
    public Product createProduct(Product product) {
        if (product.getId() == null || product.getId().isEmpty()) {
            product.setId(UUID.randomUUID().toString());
        }
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    // Update product
    public Product updateProduct(String id, Product productDetails) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        if (productDetails.getName() != null) {
            product.setName(productDetails.getName());
        }
        if (productDetails.getDescription() != null) {
            product.setDescription(productDetails.getDescription());
        }
        if (productDetails.getPrice() != null) {
            product.setPrice(productDetails.getPrice());
        }
        if (productDetails.getStock() >= 0) {
            product.setStock(productDetails.getStock());
        }
        if (productDetails.getCategory() != null) {
            product.setCategory(productDetails.getCategory());
        }
        if (productDetails.getPhoto() != null) {
            product.setPhoto(productDetails.getPhoto());
        }
        product.setUpdatedAt(LocalDateTime.now());
        
        return productRepository.save(product);
    }

    // Delete product
    public void deleteProduct(String id) {
        productRepository.deleteById(id);
    }

    // ========== STOCK MANAGEMENT METHODS ==========
    
    public static class ProductStockUpdate {
        private String productId;
        private int quantity;
        
        public ProductStockUpdate() {}
        
        public ProductStockUpdate(String productId, int quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }
        
        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }
    
    @Transactional
    public boolean decreaseStock(List<ProductStockUpdate> stockUpdates) {
        try {
            for (ProductStockUpdate update : stockUpdates) {
                int updated = productRepository.decreaseStock(update.getProductId(), update.getQuantity());
                if (updated == 0) {
                    throw new RuntimeException("Failed to update stock for product ID: " + update.getProductId());
                }
            }
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Error decreasing stock: " + e.getMessage());
        }
    }
    
    @Transactional
    public boolean decreaseStock(String productId, int quantity) {
        int updated = productRepository.decreaseStock(productId, quantity);
        if (updated == 0) {
            throw new RuntimeException("Failed to update stock. Insufficient stock or product not found.");
        }
        return true;
    }
    
    @Transactional
    public boolean increaseStock(String productId, int quantity) {
        int updated = productRepository.increaseStock(productId, quantity);
        if (updated == 0) {
            throw new RuntimeException("Failed to increase stock. Product not found.");
        }
        return true;
    }
    
    public boolean checkStockAvailability(List<ProductStockUpdate> stockUpdates) {
        for (ProductStockUpdate update : stockUpdates) {
            if (!productRepository.hasSufficientStock(update.getProductId(), update.getQuantity())) {
                return false;
            }
        }
        return true;
    }
    
    public boolean checkStockAvailability(String productId, int quantity) {
        return productRepository.hasSufficientStock(productId, quantity);
    }
    
    public List<Product> getLowStockProducts(int threshold) {
        return productRepository.findLowStockProducts(threshold);
    }
    
    public List<Product> getOutOfStockProducts() {
        return productRepository.findByStock(0);
    }
    
    public double getTotalStockValue() {
        Double value = productRepository.getTotalStockValue();
        return value != null ? value : 0.0;
    }
}