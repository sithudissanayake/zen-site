package com.zenvora.service;

import com.zenvora.model.Order;
import com.zenvora.repository.OrderRepository;


import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.imageio.ImageIO;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;
    
   

    // ========== ADMIN METHODS ==========
    
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    public Order updateOrder(Order order) {
        return orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

    // ========== CUSTOMER METHODS (by phone number) ==========
    
    public List<Order> getOrdersByCustomerPhone(String phone) {
        if (phone == null || phone.isEmpty()) {
            return List.of();
        }
        return orderRepository.findByCustomerPhone(phone);
    }
    
    public List<Order> getOrdersByCustomerPhoneAndStatus(String phone, String status) {
        if (phone == null || phone.isEmpty()) {
            return List.of();
        }
        return orderRepository.findByCustomerPhoneAndStatus(phone, status);
    }
    
    public List<Order> getOrdersByCustomerPhoneAndDateRange(String phone, LocalDate startDate, LocalDate endDate) {
        if (phone == null || phone.isEmpty()) {
            return List.of();
        }
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59) : null;
        
        if (startDateTime != null && endDateTime != null) {
            return orderRepository.findByCustomerPhoneAndCreatedAtBetween(phone, startDateTime, endDateTime);
        } else if (startDateTime != null) {
            return orderRepository.findByCustomerPhoneAndCreatedAtBetween(phone, startDateTime, LocalDateTime.now());
        } else if (endDateTime != null) {
            return orderRepository.findByCustomerPhoneAndCreatedAtBetween(phone, LocalDateTime.of(1900, 1, 1, 0, 0), endDateTime);
        } else {
            return orderRepository.findByCustomerPhone(phone);
        }
    }
    
    public Map<String, Object> getCustomerOrderStats(String phone) {
        List<Order> orders = getOrdersByCustomerPhone(phone);
        
        long totalOrders = orders.size();
        double totalRevenue = orders.stream()
            .map(Order::getTotalAmount)
            .filter(Objects::nonNull)
            .mapToDouble(BigDecimal::doubleValue)
            .sum();
        long pendingOrders = orders.stream().filter(o -> "PENDING".equals(o.getStatus())).count();
        long processingOrders = orders.stream().filter(o -> "PROCESSING".equals(o.getStatus())).count();
        long shippedOrders = orders.stream().filter(o -> "SHIPPED".equals(o.getStatus())).count();
        long deliveredOrders = orders.stream().filter(o -> "DELIVERED".equals(o.getStatus())).count();
        long cancelledOrders = orders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count();
        
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("pendingOrders", pendingOrders);
        stats.put("processingOrders", processingOrders);
        stats.put("shippedOrders", shippedOrders);
        stats.put("deliveredOrders", deliveredOrders);
        stats.put("cancelledOrders", cancelledOrders);
        
        return stats;
    }

    // ========== CUSTOMER METHODS (by email) ==========
    
    public List<Order> getOrdersByCustomerEmail(String email) {
        if (email == null || email.isEmpty()) {
            return List.of();
        }
        logger.info("Fetching orders for email: {}", email);
        return orderRepository.findByCustomerEmail(email);
    }
    
    public List<Order> getOrdersByCustomerId(Long customerId) {
        if (customerId == null) {
            return List.of();
        }
        logger.info("Fetching orders for customer ID: {}", customerId);
        return orderRepository.findByCustomerId(customerId);
    }
    
    public List<Order> getOrdersByCustomerEmailAndStatus(String email, String status) {
        if (email == null || email.isEmpty()) {
            return List.of();
        }
        return orderRepository.findByCustomerEmailAndStatus(email, status);
    }
    
    public List<Order> getOrdersByCustomerIdAndStatus(Long customerId, String status) {
        if (customerId == null) {
            return List.of();
        }
        return orderRepository.findByCustomerIdAndStatus(customerId, status);
    }
    
    public Map<String, Object> getCustomerOrderStatsByEmail(String email) {
        List<Order> orders = getOrdersByCustomerEmail(email);
        
        long totalOrders = orders.size();
        double totalRevenue = orders.stream()
            .map(Order::getTotalAmount)
            .filter(Objects::nonNull)
            .mapToDouble(BigDecimal::doubleValue)
            .sum();
        long pendingOrders = orders.stream().filter(o -> "PENDING".equals(o.getStatus())).count();
        long processingOrders = orders.stream().filter(o -> "PROCESSING".equals(o.getStatus())).count();
        long shippedOrders = orders.stream().filter(o -> "SHIPPED".equals(o.getStatus())).count();
        long deliveredOrders = orders.stream().filter(o -> "DELIVERED".equals(o.getStatus())).count();
        long cancelledOrders = orders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count();
        
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("pendingOrders", pendingOrders);
        stats.put("processingOrders", processingOrders);
        stats.put("shippedOrders", shippedOrders);
        stats.put("deliveredOrders", deliveredOrders);
        stats.put("cancelledOrders", cancelledOrders);
        
        return stats;
    }

    // ========== REPORT GENERATION ==========
    
    public byte[] generateOrderReport(LocalDate startDate, LocalDate endDate, String status) throws Exception {
        try {
            logger.info("Generating order report - StartDate: {}, EndDate: {}, Status: {}", startDate, endDate, status);
            
            List<Order> orders = getAllOrders();
            
            if (startDate != null || endDate != null || (status != null && !status.equals("ALL"))) {
                final LocalDate finalStartDate = startDate;
                final LocalDate finalEndDate = endDate;
                final String finalStatus = status;
                
                orders = orders.stream()
                    .filter(order -> {
                        if (finalStatus != null && !finalStatus.equals("ALL") && !order.getStatus().equals(finalStatus)) {
                            return false;
                        }
                        if (finalStartDate != null && order.getCreatedAt().toLocalDate().isBefore(finalStartDate)) {
                            return false;
                        }
                        if (finalEndDate != null && order.getCreatedAt().toLocalDate().isAfter(finalEndDate)) {
                            return false;
                        }
                        return true;
                    })
                    .collect(Collectors.toList());
            }
            
            if (orders.isEmpty()) {
                throw new Exception("No orders found matching the criteria");
            }
            
            logger.info("Found {} orders matching criteria", orders.size());
            return generateOrderReportPdf(orders, startDate, endDate, status);
            
        } catch (Exception e) {
            logger.error("Error generating order report: ", e);
            throw e;
        }
    }
    
    public byte[] generateCustomerOrderReport(String phone, LocalDate startDate, LocalDate endDate, String status) throws Exception {
        try {
            logger.info("Generating customer order report - Phone: {}, StartDate: {}, EndDate: {}, Status: {}", 
                phone, startDate, endDate, status);
            
            List<Order> orders = getOrdersByCustomerPhone(phone);
            
            if (startDate != null || endDate != null || (status != null && !status.equals("ALL"))) {
                final LocalDate finalStartDate = startDate;
                final LocalDate finalEndDate = endDate;
                final String finalStatus = status;
                
                orders = orders.stream()
                    .filter(order -> {
                        if (finalStatus != null && !finalStatus.equals("ALL") && !order.getStatus().equals(finalStatus)) {
                            return false;
                        }
                        if (finalStartDate != null && order.getCreatedAt().toLocalDate().isBefore(finalStartDate)) {
                            return false;
                        }
                        if (finalEndDate != null && order.getCreatedAt().toLocalDate().isAfter(finalEndDate)) {
                            return false;
                        }
                        return true;
                    })
                    .collect(Collectors.toList());
            }
            
            if (orders.isEmpty()) {
                throw new Exception("No orders found matching the criteria for this customer");
            }
            
            logger.info("Found {} orders matching criteria for customer", orders.size());
            return generateOrderReportPdf(orders, startDate, endDate, status);
            
        } catch (Exception e) {
            logger.error("Error generating customer order report: ", e);
            throw e;
        }
    }

    private Image generateStatusBarGraph(List<Order> orders) throws Exception {
        try {
            Map<String, Long> statusCountMap = new LinkedHashMap<>();
            statusCountMap.put("PENDING", orders.stream().filter(o -> "PENDING".equals(o.getStatus())).count());
            statusCountMap.put("PROCESSING", orders.stream().filter(o -> "PROCESSING".equals(o.getStatus())).count());
            statusCountMap.put("SHIPPED", orders.stream().filter(o -> "SHIPPED".equals(o.getStatus())).count());
            statusCountMap.put("DELIVERED", orders.stream().filter(o -> "DELIVERED".equals(o.getStatus())).count());
            statusCountMap.put("CANCELLED", orders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count());

            statusCountMap = statusCountMap.entrySet().stream()
                .filter(entry -> entry.getValue() > 0)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));

            if (statusCountMap.isEmpty()) {
                return null;
            }

            int width = 600;
            int height = 400;
            BufferedImage bufferedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = bufferedImage.createGraphics();

            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, width, height);

            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            int marginLeft = 80;
            int marginRight = 50;
            int marginTop = 50;
            int marginBottom = 70;
            
            int chartWidth = width - marginLeft - marginRight;
            int chartHeight = height - marginTop - marginBottom;
            
            g2d.setColor(new Color(248, 249, 250));
            g2d.fillRect(marginLeft - 10, marginTop - 10, chartWidth + 20, chartHeight + 20);
            
            g2d.setColor(new Color(52, 73, 94));
            g2d.setStroke(new java.awt.BasicStroke(2));
            
            g2d.drawLine(marginLeft, marginTop, marginLeft, height - marginBottom);
            g2d.drawLine(marginLeft, height - marginBottom, width - marginRight, height - marginBottom);
            
            long maxCount = statusCountMap.values().stream().max(Long::compare).orElse(1L);
            maxCount = (long) Math.ceil(maxCount * 1.15);
            
            g2d.setFont(new java.awt.Font("Arial", java.awt.Font.PLAIN, 10));
            g2d.setColor(new Color(100, 100, 100));
            
            int numYTicks = 5;
            for (int i = 0; i <= numYTicks; i++) {
                long value = (long)((maxCount / (double)numYTicks) * i);
                int y = height - marginBottom - (int)((value / (double)maxCount) * chartHeight);
                
                g2d.drawLine(marginLeft - 5, y, marginLeft, y);
                
                String label = String.valueOf(value);
                java.awt.FontMetrics fm = g2d.getFontMetrics();
                int labelWidth = fm.stringWidth(label);
                g2d.drawString(label, marginLeft - labelWidth - 8, y + 4);
                
                g2d.setColor(new Color(220, 220, 220));
                g2d.setStroke(new java.awt.BasicStroke(1));
                g2d.drawLine(marginLeft, y, width - marginRight, y);
                g2d.setColor(new Color(100, 100, 100));
                g2d.setStroke(new java.awt.BasicStroke(2));
            }
            
            int barWidth = (chartWidth / statusCountMap.size()) - 15;
            if (barWidth < 30) barWidth = 30;
            int startX = marginLeft + 10;
            
            java.awt.Color[] barColors = {
                new java.awt.Color(241, 196, 15),
                new java.awt.Color(52, 152, 219),
                new java.awt.Color(155, 89, 182),
                new java.awt.Color(46, 204, 113),
                new java.awt.Color(231, 76, 60)
            };
            
            int barIndex = 0;
            for (Map.Entry<String, Long> entry : statusCountMap.entrySet()) {
                String statusName = entry.getKey();
                long count = entry.getValue();
                int x = startX + (barIndex * (barWidth + 15));
                int barHeight = (int)((count / (double)maxCount) * chartHeight);
                int y = height - marginBottom - barHeight;
                
                if (barHeight < 1 && count > 0) barHeight = 1;
                
                java.awt.Color barColor = barColors[barIndex % barColors.length];
                g2d.setColor(barColor);
                g2d.fillRect(x, y, barWidth, barHeight);
                
                g2d.setColor(barColor.darker());
                g2d.drawRect(x, y, barWidth, barHeight);
                
                g2d.setColor(new java.awt.Color(44, 62, 80));
                g2d.setFont(new java.awt.Font("Arial", java.awt.Font.BOLD, 11));
                String valueLabel = String.valueOf(count);
                java.awt.FontMetrics fm = g2d.getFontMetrics();
                int labelWidth = fm.stringWidth(valueLabel);
                g2d.drawString(valueLabel, x + (barWidth / 2) - (labelWidth / 2), y - 8);
                
                g2d.setFont(new java.awt.Font("Arial", java.awt.Font.PLAIN, 10));
                String displayName = statusName.substring(0, 1) + statusName.substring(1).toLowerCase();
                fm = g2d.getFontMetrics();
                labelWidth = fm.stringWidth(displayName);
                g2d.drawString(displayName, x + (barWidth / 2) - (labelWidth / 2), height - marginBottom + 20);
                
                barIndex++;
            }
            
            g2d.setFont(new java.awt.Font("Arial", java.awt.Font.BOLD, 14));
            g2d.setColor(new java.awt.Color(44, 62, 80));
            String title = "Order Status Distribution";
            java.awt.FontMetrics fm = g2d.getFontMetrics();
            int titleWidth = fm.stringWidth(title);
            g2d.drawString(title, (width / 2) - (titleWidth / 2), 25);
            
            g2d.rotate(-Math.PI / 2);
            g2d.setFont(new java.awt.Font("Arial", java.awt.Font.BOLD, 11));
            String yLabel = "Number of Orders";
            fm = g2d.getFontMetrics();
            int yLabelWidth = fm.stringWidth(yLabel);
            g2d.drawString(yLabel, -(height / 2) - (yLabelWidth / 2), 25);
            g2d.rotate(Math.PI / 2);
            
            g2d.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(bufferedImage, "PNG", baos);
            byte[] imageBytes = baos.toByteArray();
            
            return Image.getInstance(imageBytes);
            
        } catch (Exception e) {
            logger.error("Error generating status bar graph: ", e);
            return null;
        }
    }

    private byte[] generateOrderReportPdf(List<Order> orders, LocalDate startDate, LocalDate endDate, String status) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(document, out);
        
        document.open();
        
        try {
            // Header Banner
            PdfPTable headerBanner = new PdfPTable(1);
            headerBanner.setWidthPercentage(100);
            PdfPCell bannerCell = new PdfPCell();
            bannerCell.setBackgroundColor(new BaseColor(41, 128, 185));
            bannerCell.setPadding(15);
            bannerCell.setBorder(Rectangle.NO_BORDER);
            
            Font bannerTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 22, Font.BOLD, new BaseColor(255, 255, 255));
            Paragraph bannerTitle = new Paragraph("ZENVORA INVENTORY SYSTEM", bannerTitleFont);
            bannerTitle.setAlignment(Element.ALIGN_CENTER);
            
            Font bannerSubFont = FontFactory.getFont(FontFactory.HELVETICA, 14, Font.NORMAL, new BaseColor(255, 255, 255));
            Paragraph bannerSub = new Paragraph("Order Report", bannerSubFont);
            bannerSub.setAlignment(Element.ALIGN_CENTER);
            bannerSub.setSpacingBefore(5);
            
            bannerCell.addElement(bannerTitle);
            bannerCell.addElement(bannerSub);
            headerBanner.addCell(bannerCell);
            document.add(headerBanner);
            
            document.add(new Paragraph(" "));
            
            // Report Info
            Font infoTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Font.BOLD, new BaseColor(52, 73, 94));
            Font infoValueFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Font.NORMAL, new BaseColor(44, 62, 80));
            
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(90);
            infoTable.setWidths(new float[]{1, 2});
            infoTable.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            PdfPCell genLabelCell = new PdfPCell(new Phrase("Generated Date:", infoTitleFont));
            genLabelCell.setPadding(6);
            genLabelCell.setBorder(Rectangle.NO_BORDER);
            infoTable.addCell(genLabelCell);
            
            PdfPCell genValueCell = new PdfPCell(new Phrase(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")), infoValueFont));
            genValueCell.setPadding(6);
            genValueCell.setBorder(Rectangle.NO_BORDER);
            infoTable.addCell(genValueCell);
            
            String dateRange = "All Orders";
            if (startDate != null && endDate != null) {
                dateRange = startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " to " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } else if (startDate != null) {
                dateRange = "From " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } else if (endDate != null) {
                dateRange = "Until " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            }
            
            PdfPCell rangeLabelCell = new PdfPCell(new Phrase("Date Range:", infoTitleFont));
            rangeLabelCell.setPadding(6);
            rangeLabelCell.setBorder(Rectangle.NO_BORDER);
            infoTable.addCell(rangeLabelCell);
            
            PdfPCell rangeValueCell = new PdfPCell(new Phrase(dateRange, infoValueFont));
            rangeValueCell.setPadding(6);
            rangeValueCell.setBorder(Rectangle.NO_BORDER);
            infoTable.addCell(rangeValueCell);
            
            String statusDisplay = (status != null && !status.equals("ALL")) ? status : "All Statuses";
            PdfPCell statusLabelCell = new PdfPCell(new Phrase("Order Status:", infoTitleFont));
            statusLabelCell.setPadding(6);
            statusLabelCell.setBorder(Rectangle.NO_BORDER);
            infoTable.addCell(statusLabelCell);
            
            PdfPCell statusValueCell = new PdfPCell(new Phrase(statusDisplay, infoValueFont));
            statusValueCell.setPadding(6);
            statusValueCell.setBorder(Rectangle.NO_BORDER);
            infoTable.addCell(statusValueCell);
            
            document.add(infoTable);
            document.add(new Paragraph(" "));
            
            // Summary Cards
            BigDecimal totalRevenue = orders.stream()
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            long pendingCount = orders.stream().filter(o -> "PENDING".equals(o.getStatus())).count();
            long deliveredCount = orders.stream().filter(o -> "DELIVERED".equals(o.getStatus())).count();
            
            PdfPTable summaryCards = new PdfPTable(4);
            summaryCards.setWidthPercentage(100);
            summaryCards.setWidths(new float[]{1, 1, 1, 1});
            
            summaryCards.addCell(createSummaryCard("Total Orders", String.valueOf(orders.size()), new BaseColor(52, 152, 219)));
            summaryCards.addCell(createSummaryCard("Total Revenue", "Rs. " + String.format("%,.2f", totalRevenue), new BaseColor(46, 204, 113)));
            summaryCards.addCell(createSummaryCard("Pending", String.valueOf(pendingCount), new BaseColor(241, 196, 15)));
            summaryCards.addCell(createSummaryCard("Delivered", String.valueOf(deliveredCount), new BaseColor(155, 89, 182)));
            
            document.add(summaryCards);
            document.add(new Paragraph(" "));
            
            // Bar Graph Section
            PdfPTable chartSection = new PdfPTable(1);
            chartSection.setWidthPercentage(100);
            PdfPCell chartCell = new PdfPCell();
            chartCell.setPadding(15);
            chartCell.setBackgroundColor(new BaseColor(248, 249, 250));
            chartCell.setBorder(Rectangle.BOX);
            chartCell.setBorderColor(new BaseColor(200, 200, 200));
            
            Font chartTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 16, Font.BOLD, new BaseColor(44, 62, 80));
            Paragraph chartTitle = new Paragraph("Order Status Distribution", chartTitleFont);
            chartTitle.setAlignment(Element.ALIGN_CENTER);
            chartTitle.setSpacingAfter(15);
            chartCell.addElement(chartTitle);
            
            Image barGraph = generateStatusBarGraph(orders);
            if (barGraph != null) {
                barGraph.setAlignment(Element.ALIGN_CENTER);
                barGraph.scaleToFit(550, 350);
                chartCell.addElement(barGraph);
            }
            
            chartSection.addCell(chartCell);
            document.add(chartSection);
            document.add(new Paragraph(" "));
            
            // Orders Table
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA, 14, Font.BOLD, new BaseColor(41, 128, 185));
            Paragraph sectionTitle = new Paragraph("Order Details", sectionFont);
            sectionTitle.setSpacingAfter(10);
            document.add(sectionTitle);
            
            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.5f, 1.2f, 1.5f, 1.5f, 1.2f, 1.5f, 1f, 1f, 1.2f});
            
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.BOLD, new BaseColor(255, 255, 255));
            BaseColor headerBg = new BaseColor(52, 73, 94);
            
            String[] headers = { "#", "Order ID", "Customer Name", "Customer Email", "Phone", "Address", "City", "Total", "Status" };
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(headerBg);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(8);
                cell.setBorderColor(BaseColor.WHITE);
                table.addCell(cell);
            }
            
            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL);
            int rowNum = 1;
            for (Order order : orders) {
                table.addCell(createCell(String.valueOf(rowNum++), Element.ALIGN_CENTER, dataFont));
                table.addCell(createCell(order.getOrderNumber(), Element.ALIGN_CENTER, dataFont));
                table.addCell(createCell(order.getCustomerName() != null ? order.getCustomerName() : "N/A", Element.ALIGN_LEFT, dataFont));
                table.addCell(createCell(order.getCustomerEmail() != null ? order.getCustomerEmail() : "N/A", Element.ALIGN_LEFT, dataFont));
                table.addCell(createCell(order.getCustomerPhone() != null ? order.getCustomerPhone() : "N/A", Element.ALIGN_CENTER, dataFont));
                table.addCell(createCell(order.getShippingAddress() != null ? 
                    (order.getShippingAddress().length() > 35 ? order.getShippingAddress().substring(0, 32) + "..." : order.getShippingAddress()) : "N/A", 
                    Element.ALIGN_LEFT, dataFont));
                table.addCell(createCell(order.getCity() != null ? order.getCity() : "N/A", Element.ALIGN_CENTER, dataFont));
                table.addCell(createCell("Rs. " + (order.getTotalAmount() != null ? String.format("%,.2f", order.getTotalAmount()) : "0.00"), Element.ALIGN_RIGHT, dataFont));
                
                PdfPCell statusCell = createCell(order.getStatus(), Element.ALIGN_CENTER, dataFont);
                BaseColor statusColor = getStatusColor(order.getStatus());
                if (statusColor != null) {
                    statusCell.setBackgroundColor(statusColor);
                }
                table.addCell(statusCell);
            }
            
            document.add(table);
            
            document.add(new Paragraph(" "));
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.ITALIC, new BaseColor(127, 140, 141));
            Paragraph footer = new Paragraph("Report generated by Zenvora Inventory System | © " + LocalDateTime.now().getYear() + " All Rights Reserved", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);
            
            document.close();
            
        } catch (Exception e) {
            logger.error("Error generating PDF: ", e);
            throw e;
        }
        
        return out.toByteArray();
    }

    private PdfPCell createSummaryCard(String title, String value, BaseColor color) {
        PdfPCell card = new PdfPCell();
        card.setPadding(10);
        card.setBackgroundColor(color);
        card.setBorder(Rectangle.BOX);
        card.setBorderColor(new BaseColor(255, 255, 255));
        card.setBorderWidth(2);
        
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.BOLD, new BaseColor(255, 255, 255));
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 14, Font.BOLD, new BaseColor(255, 255, 255));
        
        Paragraph titlePara = new Paragraph(title, titleFont);
        titlePara.setAlignment(Element.ALIGN_CENTER);
        Paragraph valuePara = new Paragraph(value, valueFont);
        valuePara.setAlignment(Element.ALIGN_CENTER);
        valuePara.setSpacingBefore(5);
        
        card.addElement(titlePara);
        card.addElement(valuePara);
        
        return card;
    }

    private PdfPCell createCell(String text, int alignment, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(6);
        return cell;
    }

    private BaseColor getStatusColor(String status) {
        switch (status) {
            case "PENDING": return new BaseColor(255, 243, 205);
            case "PROCESSING": return new BaseColor(211, 229, 255);
            case "SHIPPED": return new BaseColor(224, 204, 255);
            case "DELIVERED": return new BaseColor(212, 237, 218);
            case "CANCELLED": return new BaseColor(248, 215, 218);
            default: return null;
        }
    }
}