package com.example.demo.controller;

import com.example.demo.dto.UpdatePasswordDTO;
import com.example.demo.dto.UpdateProfileDTO;
import com.example.demo.dto.UserDTO;
import com.example.demo.dto.UserProfileDTO;
import com.example.demo.model.User;
import com.example.demo.service.UserService;
import com.example.demo.ratelimiter.RateLimit;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.time.Duration;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    // Already set — brute-force protection
    @RateLimit(requests = 3, durationSeconds = 30)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletResponse response) {
        String token = userService.login(body.get("username"), body.get("password"));

        ResponseCookie cookie = ResponseCookie.from("jwt", token)
            .httpOnly(true)
            .secure(true)
            .path("/")
            .maxAge(Duration.ofHours(1))
            .sameSite("None")
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(Map.of("message", "Login successful"));
    }

    // Signout is a one-shot action — low cap, no legitimate need to call this rapidly
    @RateLimit(requests = 5, durationSeconds = 60)
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

    // Registration — tight cap to prevent account farming
    @RateLimit(requests = 3, durationSeconds = 60)
    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.createUser(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Profile fetch — cheap read, called on page load; relaxed but bounded
    @RateLimit(requests = 30, durationSeconds = 60)
    @GetMapping("/profile")
    public ResponseEntity<?> profile(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        UserProfileDTO profile = userService.getProfile(username);
        return ResponseEntity.ok(profile);
    }

    // Profile update — low cap, users rarely update profile info repeatedly
    @RateLimit(requests = 5, durationSeconds = 60)
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

    // Password change — very strict; sensitive action, should almost never repeat
    @RateLimit(requests = 3, durationSeconds = 60)
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

    // Token fetch — called by frontend on init; moderate cap to allow normal app use
    @RateLimit(requests = 20, durationSeconds = 60)
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

    @GetMapping("/hired-status")
    public ResponseEntity<?> getHiredStatus(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        User user = userService.findByUsername(username);

        if (Boolean.TRUE.equals(user.getHired())) {
            userService.setVisibleFalse(username);
        }

        return ResponseEntity.ok(Map.of("hired", Boolean.TRUE.equals(user.getHired())));
    }
    //for admin
    @GetMapping("/admin/all-user")
    public ResponseEntity<?> getAllUsers(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");

        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            List<UserDTO> users = userService.getAllUsers(username);
            return ResponseEntity.ok(users);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}