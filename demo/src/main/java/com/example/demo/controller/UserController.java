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

import java.util.Arrays;
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

            // SameSite=None required for cross-site cookies (Vercel → Render)
            response.addHeader("Set-Cookie",
                "jwt=" + token + "; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=None");

            return ResponseEntity.ok("Login successful");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/signout")
    public ResponseEntity<String> signOut(HttpServletRequest request, HttpServletResponse response) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
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

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfileDTO dto,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            UserProfileDTO updated = userService.updateProfile(id, dto, username);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<?> updatePassword(
            @PathVariable Long id,
            @RequestBody UpdatePasswordDTO dto,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            userService.updatePassword(id, dto, username);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/me/token")
    public ResponseEntity<Map<String, String>> getToken(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) return ResponseEntity.status(401).build();

        String token = Arrays.stream(request.getCookies())
                .filter(c -> c.getName().equals("jwt"))
                .findFirst()
                .map(Cookie::getValue)
                .orElse(null);

        if (token == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of("token", token));
    }
}