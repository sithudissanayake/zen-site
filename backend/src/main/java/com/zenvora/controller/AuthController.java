package com.zenvora.controller;

import com.zenvora.dto.*;
import com.zenvora.model.User;
import com.zenvora.repository.UserRepository;
import com.zenvora.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            if (request == null) {
                return ResponseEntity.badRequest().body(new AuthResponse(false, "Invalid registration payload"));
            }

            String fullName = trimToNull(request.getFullName());
            String phoneNumber = trimToNull(request.getPhoneNumber());
            String email = trimToNull(request.getEmail());
            String password = request.getPassword();
            String confirmPassword = request.getConfirmPassword();

            if (fullName == null || phoneNumber == null || email == null || password == null || confirmPassword == null) {
                return ResponseEntity.badRequest().body(new AuthResponse(false, "All fields are required"));
            }

            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(new AuthResponse(false, "Password must be at least 6 characters"));
            }

            email = email.toLowerCase();

            // Validate passwords match
            if (!Objects.equals(password, confirmPassword)) {
                return ResponseEntity.badRequest().body(new AuthResponse(false, "Passwords do not match"));
            }
            
            // Check if user exists
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(new AuthResponse(false, "Email already exists"));
            }
            
            if (userRepository.existsByPhoneNumber(phoneNumber)) {
                return ResponseEntity.badRequest().body(new AuthResponse(false, "Phone number already exists"));
            }
            
            // Create user
            User user = new User();
            user.setFullName(fullName);
            user.setEmail(email);
            user.setPhoneNumber(phoneNumber);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole("user");
            
            User savedUser = userRepository.save(user);
            
            // Generate token
            String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole(), savedUser.getId());
            
            // Prepare response
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", savedUser.getId());
            userMap.put("fullName", savedUser.getFullName());
            userMap.put("email", savedUser.getEmail());
            userMap.put("phoneNumber", savedUser.getPhoneNumber());
            userMap.put("role", savedUser.getRole());
            
            AuthResponse response = new AuthResponse(true, "Account created successfully");
            response.setToken(token);
            response.setUser(userMap);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthResponse(false, "Server error during registration"));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Find user by email
            User user = userRepository.findByEmail(request.getEmail().toLowerCase()).orElse(null);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new AuthResponse(false, "Invalid email or password"));
            }
            
            // Check password
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new AuthResponse(false, "Invalid email or password"));
            }
            
            // Check role if specified
            if (request.getRole() != null && !user.getRole().equals(request.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new AuthResponse(false, "Access denied. You don't have " + request.getRole() + " privileges"));
            }
            
            // Generate token
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());
            
            // Prepare response
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("fullName", user.getFullName());
            userMap.put("email", user.getEmail());
            userMap.put("phoneNumber", user.getPhoneNumber());
            userMap.put("role", user.getRole());
            
            AuthResponse response = new AuthResponse(true, "Login successful");
            response.setToken(token);
            response.setUser(userMap);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthResponse(false, "Server error during login"));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7); // Remove "Bearer "
            String email = jwtUtil.extractEmail(token);
            
            User user = userRepository.findByEmail(email).orElse(null);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new AuthResponse(false, "User not found"));
            }
            
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("fullName", user.getFullName());
            userMap.put("email", user.getEmail());
            userMap.put("phoneNumber", user.getPhoneNumber());
            userMap.put("role", user.getRole());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", userMap);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Not authorized"));
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}