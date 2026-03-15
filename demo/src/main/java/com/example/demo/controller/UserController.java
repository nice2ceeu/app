package com.example.demo.controller;

import com.example.demo.dto.UpdatePasswordDTO;
import com.example.demo.dto.UpdateProfileDTO;
import com.example.demo.dto.UserProfileDTO;
import com.example.demo.model.User;
import com.example.demo.service.UserService;
import com.example.demo.ratelimiter.RateLimit;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Auth ─────────────────────────────────────────────────

    @RateLimit(requests = 3, durationSeconds = 30)
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody User user, HttpServletResponse response) {
        try {
            String token = userService.login(user.getUsername(), user.getPassword());

            Cookie cookie = new Cookie("jwt", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(false);   // set to true in production
            cookie.setPath("/");
            cookie.setMaxAge(60 * 60); // 1 hour
            response.addCookie(cookie);

            return ResponseEntity.ok("Login successful");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/signout")
    public ResponseEntity<String> signOut(HttpServletResponse response) {
        userService.signOut(response);
        return ResponseEntity.ok("Signed out successfully");
    }

    // ── User ─────────────────────────────────────────────────

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.createUser(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        UserProfileDTO profile = userService.getProfile(username);
        return ResponseEntity.ok(profile);
    }

    // Update profile fields (firstName, lastName, username, address, jobTitle)
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfileDTO dto) {
        try {
            UserProfileDTO updated = userService.updateProfile(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Update password
    @PutMapping("/users/{id}/password")
    public ResponseEntity<?> updatePassword(
            @PathVariable Long id,
            @RequestBody UpdatePasswordDTO dto) {
        try {
            userService.updatePassword(id, dto);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}