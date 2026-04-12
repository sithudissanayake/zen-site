package com.zenvora.controller;

import com.zenvora.model.Contact;
import com.zenvora.model.User;
import com.zenvora.repository.ContactRepository;
import com.zenvora.repository.UserRepository;
import com.zenvora.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ContactRepository contactRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    private boolean isAdmin(String authHeader) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.extractRole(token);
            return "admin".equals(role);
        } catch (Exception e) {
            return false;
        }
    }
    
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String authHeader) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));
        }
        
        try {
            List<User> users = userRepository.findAll();
            users.forEach(user -> user.setPassword(null)); // Remove passwords
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("users", users);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Server error"));
        }
    }
    
    @GetMapping("/contacts")
    public ResponseEntity<?> getAllContacts(@RequestHeader("Authorization") String authHeader) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));
        }
        
        try {
            List<Contact> contacts = contactRepository.findAllByOrderByCreatedAtDesc();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("contacts", contacts);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Server error"));
        }
    }
    
    @PutMapping("/contacts/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));
        }
        
        try {
            Contact contact = contactRepository.findById(id).orElse(null);
            if (contact == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Contact not found"));
            }
            
            contact.setRead(true);
            contactRepository.save(contact);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Contact marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Server error"));
        }
    }
    
    @DeleteMapping("/contacts/{id}")
    public ResponseEntity<?> deleteContact(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));
        }
        
        try {
            contactRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Contact deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Server error"));
        }
    }
}