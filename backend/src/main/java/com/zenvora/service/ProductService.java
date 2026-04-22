package com.zenvora.service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.zenvora.model.Product;
import com.zenvora.repository.ProductRepository;

@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    @Autowired
    private ProductRepository productRepository;

    // -------------------------------------------------------------------------
    // Inner class used by OrderController for batch stock operations
    // -------------------------------------------------------------------------
    public static class ProductStockUpdate {
        private final String productId;
        private final int quantity;

        public ProductStockUpdate(String productId, int quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }

        public String getProductId() { return productId; }
        public int getQuantity()    { return quantity; }
    }

    // -------------------------------------------------------------------------
    // Check that every item in the list has enough stock
    // -------------------------------------------------------------------------
    public boolean checkStockAvailability(List<ProductStockUpdate> updates) {
        for (ProductStockUpdate update : updates) {
            if (!hasStock(update.getProductId(), update.getQuantity())) {
                return false;
            }
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // Decrease stock for a batch of items (used after order is confirmed)
    // -------------------------------------------------------------------------
    @Transactional
    public void decreaseStock(List<ProductStockUpdate> updates) {
        for (ProductStockUpdate update : updates) {
            decreaseStock(update.getProductId(), update.getQuantity());
        }
    }

    // -------------------------------------------------------------------------
    // Get all products with pagination, search, and category filter
    // -------------------------------------------------------------------------
    public Page<Product> getAllProducts(int page, int limit, String search, String category) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("name").ascending());
        boolean hasSearch = search != null && !search.isEmpty();
        boolean hasCategory = category != null && !category.isEmpty() && !category.equals("all");

        if (hasSearch && hasCategory) {
            return productRepository.searchProductsByCategory(search, category, pageable);
        }
        if (hasSearch) {
            return productRepository.searchProducts(search, pageable);
        }
        if (hasCategory) {
            return productRepository.findByCategory(category, pageable);
        }
        return productRepository.findAll(pageable);
    }

    // Get product by ID
    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    // Check if product name exists (for duplicate validation)
    public boolean isProductNameExists(String name) {
        return productRepository.existsByName(name);
    }

    // Check if product name exists excluding current product (for update)
    public boolean isProductNameExists(String name, String excludeId) {
        return productRepository.existsByNameAndIdNot(name, excludeId);
    }

    // Generate next product ID
    private String generateNextProductId() {
        List<Product> allProducts = productRepository.findAll();

        int maxNumber = 0;
        for (Product p : allProducts) {
            String id = p.getId();
            if (id != null && id.matches("P\\d{3}")) {
                try {
                    int num = Integer.parseInt(id.substring(1));
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                } catch (NumberFormatException e) {
                    // Ignore
                }
            }
        }

        if (maxNumber == 0) {
            if (allProducts.isEmpty()) {
                return "P001";
            }
        }

        int nextNumber = maxNumber + 1;
        return String.format("P%03d", nextNumber);
    }

    // Create new product with auto-generated ID and duplicate check
    public Product createProduct(Product product) {
        if (isProductNameExists(product.getName())) {
            throw new RuntimeException("Product name '" + product.getName() + "' already exists. Please use a different name.");
        }

        if (product.getPhoto() == null || product.getPhoto().isEmpty()) {
            throw new RuntimeException("Product image is required. Please upload an image.");
        }

        if (product.getId() == null || product.getId().isEmpty() ||
            product.getId().startsWith("http") || product.getId().length() > 10) {
            product.setId(generateNextProductId());
        }

        product.setId(product.getId().toUpperCase());

        if (product.getStock() == null) {
            product.setStock(0);
        }

        return productRepository.save(product);
    }

    // Update existing product with duplicate check
    public Product updateProduct(String id, Product productDetails) {
        Optional<Product> optionalProduct = productRepository.findById(id);

        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();

            if (!product.getName().equals(productDetails.getName()) &&
                isProductNameExists(productDetails.getName(), id)) {
                throw new RuntimeException("Product name '" + productDetails.getName() + "' already exists. Please use a different name.");
            }

            product.setName(productDetails.getName());
            product.setDescription(productDetails.getDescription());
            product.setManufacturedCountry(productDetails.getManufacturedCountry()); // FIXED
            product.setBrand(productDetails.getBrand());
            product.setPrice(productDetails.getPrice());
            product.setStock(productDetails.getStock());

            if (productDetails.getPhoto() != null && !productDetails.getPhoto().isEmpty()) {
                product.setPhoto(productDetails.getPhoto());
            }

            if (productDetails.getCategory() != null) {
                product.setCategory(productDetails.getCategory());
            }
            return productRepository.save(product);
        }
        return null;
    }

    // Change product ID (since @Id cannot be updated directly in JPA)
    @Transactional
    public Product changeProductId(String oldId, String newId) {
        Optional<Product> optionalProduct = productRepository.findById(oldId);
        if (!optionalProduct.isPresent()) {
            throw new RuntimeException("Product not found with id: " + oldId);
        }
        Product product = optionalProduct.get();

        if (productRepository.existsById(newId)) {
            throw new RuntimeException("Product with id " + newId + " already exists");
        }

        Product newProduct = new Product();
        newProduct.setId(newId.toUpperCase());
        newProduct.setName(product.getName());
        newProduct.setDescription(product.getDescription());
        newProduct.setManufacturedCountry(product.getManufacturedCountry()); // FIXED
        newProduct.setBrand(product.getBrand());
        newProduct.setPrice(product.getPrice());
        newProduct.setStock(product.getStock());
        newProduct.setPhoto(product.getPhoto());
        newProduct.setCategory(product.getCategory());
        newProduct.setCreatedAt(product.getCreatedAt());
        newProduct.setUpdatedAt(LocalDateTime.now());

        productRepository.save(newProduct);
        productRepository.deleteById(oldId);

        return newProduct;
    }

    // Delete product
    public void deleteProduct(String id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    // Get products by category (without pagination)
    public List<Product> getProductsByCategory(String category) {
        if (category == null || category.isEmpty() || category.equals("all")) {
            return productRepository.findAll();
        }
        return productRepository.findByCategory(category);
    }

    // Get products by category WITH pagination (used by ProductController)
    public Page<Product> getProductsByCategory(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        return productRepository.findByCategory(category, pageable);
    }

    // Get all products without pagination
    public List<Product> getAllProductsWithoutPagination() {
        return productRepository.findAll();
    }

    // Get all products list (alias for getAllProductsWithoutPagination)
    public List<Product> getAllProductsList() {
        return getAllProductsWithoutPagination();
    }

    // Advanced search with category
    public Page<Product> advancedSearch(String category, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (category != null && !category.isEmpty() && !category.equals("all")) {
            return productRepository.searchProductsByCategory(search, category, pageable);
        } else {
            return productRepository.searchProducts(search, pageable);
        }
    }

    // Update product stock (single product, by delta)
    @Transactional
    public void updateStock(String productId, int quantityChange) {
        logger.info("Updating stock for product: {}, change: {}", productId, quantityChange);

        Optional<Product> productOpt = getProductById(productId);
        if (!productOpt.isPresent()) {
            throw new RuntimeException("Product not found with id: " + productId);
        }
        Product product = productOpt.get();

        Integer currentStock = product.getStock() != null ? product.getStock() : 0;
        int newStock = currentStock + quantityChange;

        if (newStock < 0) {
            throw new RuntimeException("Insufficient stock for product: " + product.getName() +
                    ". Available: " + currentStock + ", Requested: " + Math.abs(quantityChange));
        }

        product.setStock(newStock);
        productRepository.save(product);
        logger.info("Stock updated for product: {} - Old: {}, New: {}", product.getName(), currentStock, newStock);
    }

    // Decrease stock (single product)
    public void decreaseStock(String productId, int quantity) {
        updateStock(productId, -quantity);
    }

    // Increase stock (single product)
    public void increaseStock(String productId, int quantity) {
        updateStock(productId, quantity);
    }

    // Check if product has sufficient stock
    public boolean hasStock(String productId, int requestedQuantity) {
        Optional<Product> productOpt = getProductById(productId);
        if (!productOpt.isPresent()) {
            return false;
        }
        Integer currentStock = productOpt.get().getStock() != null ? productOpt.get().getStock() : 0;
        return currentStock >= requestedQuantity;
    }

    // Get current stock for a product
    public int getCurrentStock(String productId) {
        Optional<Product> productOpt = getProductById(productId);
        if (!productOpt.isPresent()) {
            return 0;
        }
        return productOpt.get().getStock() != null ? productOpt.get().getStock() : 0;
    }

    // Get low stock products
    public List<Product> getLowStockProducts(int threshold) {
        return productRepository.findByStockLessThan(threshold);
    }

    // Get out of stock products
    public List<Product> getOutOfStockProducts() {
        return productRepository.findByStock(0);
    }

    // Get top stocked products
    public List<Product> getTopStockedProducts(int limit) {
        return productRepository.findTop3ByOrderByStockDesc();
    }

    // Get total inventory value
    public Double getTotalInventoryValue() {
        Double total = productRepository.getTotalInventoryValue();
        return total != null ? total : 0.0;
    }

    // Get products needing restock
    public List<Product> getProductsNeedingRestock() {
        return productRepository.findProductsNeedingRestock();
    }

    // Generate stock count report
    public byte[] generateStockCountReport(String category, String sortBy) throws Exception {
        try {
            logger.info("Generating report - Category: {}, Sort: {}", category, sortBy);

            List<Product> products;
            if (category != null && !category.isEmpty() && !category.equals("all")) {
                products = productRepository.findByCategory(category);
                logger.info("Found {} products for category: {}", products.size(), category);
            } else {
                products = productRepository.findAll();
                logger.info("Found {} total products", products.size());
            }

            if (products.isEmpty()) {
                throw new Exception("No products found in database");
            }

            if ("name".equalsIgnoreCase(sortBy)) {
                products.sort((a, b) -> a.getName().compareToIgnoreCase(b.getName()));
            } else {
                products.sort((a, b) -> {
                    int stockA = a.getStock() != null ? a.getStock() : 0;
                    int stockB = b.getStock() != null ? b.getStock() : 0;
                    return Integer.compare(stockB, stockA);
                });
            }

            return generatePdf(products, category, sortBy);

        } catch (Exception e) {
            logger.error("Error generating report: ", e);
            throw e;
        }
    }

    // Generate PDF report
    private byte[] generatePdf(List<Product> products, String category, String sortBy) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);

        document.open();

        try {
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA, 20, Font.BOLD);
            Paragraph title = new Paragraph("STOCK COUNT REPORT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
            Paragraph date = new Paragraph(
                    "Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")),
                    dateFont);
            date.setAlignment(Element.ALIGN_CENTER);
            date.setSpacingAfter(20);
            document.add(date);

            String categoryDisplay = (category != null && !category.isEmpty() && !category.equals("all")) ? category
                    : "All Categories";
            Paragraph categoryInfo = new Paragraph("Category: " + categoryDisplay, dateFont);
            categoryInfo.setAlignment(Element.ALIGN_CENTER);
            categoryInfo.setSpacingAfter(10);
            document.add(categoryInfo);

            String sortDisplay = "name".equalsIgnoreCase(sortBy) ? "Product Name (A-Z)" : "Stock Level (Highest First)";
            Paragraph sortInfo = new Paragraph("Sorted by: " + sortDisplay, dateFont);
            sortInfo.setAlignment(Element.ALIGN_CENTER);
            sortInfo.setSpacingAfter(20);
            document.add(sortInfo);

            int totalStock = 0;
            int lowStockCount = 0;
            int outOfStockCount = 0;
            double totalValue = 0;

            for (Product p : products) {
                if (p.getStock() != null) {
                    totalStock += p.getStock();
                    if (p.getStock() == 0) {
                        outOfStockCount++;
                    } else if (p.getStock() < 20) {
                        lowStockCount++;
                    }
                    if (p.getPrice() != null) {
                        totalValue += p.getPrice().doubleValue() * p.getStock();
                    }
                }
            }

            Font summaryFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Font.BOLD);
            Paragraph summary = new Paragraph(
                    String.format("Total Products: %d | Total Stock: %d | Low Stock: %d | Out of Stock: %d | Total Value: Rs. %,.2f",
                    products.size(), totalStock, lowStockCount, outOfStockCount, totalValue), summaryFont);
            summary.setAlignment(Element.ALIGN_CENTER);
            summary.setSpacingAfter(20);
            document.add(summary);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 0.6f, 2f, 1f, 0.8f, 0.8f, 1.2f });

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Font.BOLD);
            BaseColor headerBg = new BaseColor(100, 149, 237);

            String[] headers = { "#", "Product Name", "Category", "Brand", "Stock", "Price (RS)" };
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(headerBg);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(8);
                table.addCell(cell);
            }

            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            int rank = 1;
            for (Product p : products) {
                table.addCell(createCell(String.valueOf(rank++), Element.ALIGN_CENTER, dataFont));
                table.addCell(createCell(p.getName() != null ? p.getName() : "N/A", Element.ALIGN_LEFT, dataFont));
                table.addCell(createCell(p.getCategory() != null ? p.getCategory() : "N/A", Element.ALIGN_LEFT, dataFont));
                table.addCell(createCell(p.getBrand() != null ? p.getBrand() : "N/A", Element.ALIGN_LEFT, dataFont));

                int stock = p.getStock() != null ? p.getStock() : 0;
                PdfPCell stockCell = createCell(String.valueOf(stock), Element.ALIGN_RIGHT, dataFont);
                if (stock == 0) {
                    stockCell.setBackgroundColor(new BaseColor(255, 200, 200));
                } else if (stock < 20) {
                    stockCell.setBackgroundColor(new BaseColor(255, 255, 200));
                } else if (stock > 100) {
                    stockCell.setBackgroundColor(new BaseColor(200, 255, 200));
                }
                table.addCell(stockCell);

                double price = p.getPrice() != null ? p.getPrice().doubleValue() : 0;
                table.addCell(createCell(String.format("%,.2f", price), Element.ALIGN_RIGHT, dataFont));
            }

            document.add(table);

            document.add(new Paragraph(" "));
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.ITALIC);
            Paragraph footer = new Paragraph("Report generated by Zenvora Inventory System", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

        } catch (Exception e) {
            logger.error("Error generating PDF: ", e);
            throw e;
        }

        return out.toByteArray();
    }

    // Helper method to create PDF cell
    private PdfPCell createCell(String text, int alignment, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(5);
        return cell;
    }
}