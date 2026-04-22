package com.zenvora.controller;

import com.zenvora.model.Product;
import com.zenvora.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ProductController {

    @Autowired
    private ProductService productService;

    // TEST endpoint - to check if API is working
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", "OK");
        response.put("message", "Product API is working!");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    // SIMPLE endpoint - returns all products (no pagination)
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllProductsList() {
        try {
            List<Product> products = productService.getAllProductsList();
            System.out.println("GET /api/products/all - Found " + products.size() + " products");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products);
            response.put("totalItems", products.size());
            response.put("totalPages", 1);
            response.put("currentPage", 0);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // PAGINATED endpoint - with pagination support
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        try {
            System.out.println("GET /api/products - page=" + page + ", size=" + size + ", category=" + category + ", search=" + search);

            Page<Product> productsPage;

            if (search != null && !search.isEmpty()) {
                // FIXED: advancedSearch(category, search, page, size) — all 4 args
                productsPage = productService.advancedSearch(category, search, page, size);
            } else if (category != null && !category.isEmpty() && !category.equals("all")) {
                // FIXED: use overloaded getProductsByCategory(String, int, int) that accepts pagination
                productsPage = productService.getProductsByCategory(category, page, size);
            } else {
                // FIXED: getAllProducts(page, limit, search, category) — all 4 args
                productsPage = productService.getAllProducts(page, size, null, null);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", productsPage.getContent());
            response.put("currentPage", productsPage.getNumber());
            response.put("totalItems", productsPage.getTotalElements());
            response.put("totalPages", productsPage.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductById(@PathVariable String id) {
        id = id.toUpperCase();
        try {
            Optional<Product> productOpt = productService.getProductById(id);
            if (productOpt.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", productOpt.get());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Product not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createProduct(@RequestBody Product product) {
        try {
            Product savedProduct = productService.createProduct(product);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product created successfully");
            response.put("data", savedProduct);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProduct(@PathVariable String id, @RequestBody Product product) {
        id = id.toUpperCase();
        try {
            Product updatedProduct = productService.updateProduct(id, product);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product updated successfully");
            response.put("data", updatedProduct);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable String id) {
        id = id.toUpperCase();
        try {
            productService.deleteProduct(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // Change product ID endpoint
    @PutMapping("/{id}/change-id")
    public ResponseEntity<Map<String, Object>> changeProductId(@PathVariable String id, @RequestBody Map<String, String> payload) {
        id = id.toUpperCase();
        try {
            String newId = payload.get("newId");
            if (newId == null || newId.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "New ID is required");
                return ResponseEntity.badRequest().body(error);
            }
            Product updatedProduct = productService.changeProductId(id, newId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product ID changed successfully");
            response.put("data", updatedProduct);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // Stock management endpoints
    @PatchMapping("/{id}/stock/decrease")
    public ResponseEntity<Map<String, Object>> decreaseStock(@PathVariable String id, @RequestBody Map<String, Integer> payload) {
        id = id.toUpperCase();
        try {
            Integer quantity = payload.get("quantity");
            if (quantity == null || quantity <= 0) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Valid quantity is required");
                return ResponseEntity.badRequest().body(error);
            }

            productService.decreaseStock(id, quantity);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock decreased successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PatchMapping("/{id}/stock/increase")
    public ResponseEntity<Map<String, Object>> increaseStock(@PathVariable String id, @RequestBody Map<String, Integer> payload) {
        id = id.toUpperCase();
        try {
            Integer quantity = payload.get("quantity");
            if (quantity == null || quantity <= 0) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Valid quantity is required");
                return ResponseEntity.badRequest().body(error);
            }

            productService.increaseStock(id, quantity);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock increased successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @GetMapping("/low-stock")
    public ResponseEntity<Map<String, Object>> getLowStockProducts(@RequestParam(defaultValue = "10") int threshold) {
        try {
            List<Product> lowStockProducts = productService.getLowStockProducts(threshold);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", lowStockProducts);
            response.put("count", lowStockProducts.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<Map<String, Object>> getOutOfStockProducts() {
        try {
            List<Product> outOfStockProducts = productService.getOutOfStockProducts();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", outOfStockProducts);
            response.put("count", outOfStockProducts.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}