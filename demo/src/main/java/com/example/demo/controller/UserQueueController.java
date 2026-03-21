package com.example.demo.controller;

import com.example.demo.ratelimiter.RateLimit;
import com.example.demo.service.UserQueueService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.Map;


@RestController
@RequiredArgsConstructor
public class UserQueueController {

    private final UserQueueService userQueueService;

    // Status toggle — very low limit, this should rarely be triggered rapidly
    @RateLimit(requests = 5, durationSeconds = 60)
    @PostMapping("users/ready")
    public ResponseEntity<?> setReadyForNearbyWork(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            userQueueService.setReadyForNearbyWork(username);
            return ResponseEntity.ok(Map.of("message", "You are now visible for nearby work."));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }

    // Status toggle — same reasoning as above
    @RateLimit(requests = 5, durationSeconds = 60)
    @PostMapping("/users/ready/cancel")
    public ResponseEntity<?> cancelReadyForNearbyWork(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            userQueueService.cancelReadyForNearbyWork(username);
            return ResponseEntity.ok(Map.of("message", "You are no longer visible to employers."));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }

    // Visibility check — lightweight read, higher tolerance
    @RateLimit(requests = 20, durationSeconds = 60)
    @GetMapping("/users/visibility")
    public ResponseEntity<?> getVisibility(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            boolean visible = userQueueService.getVisibility(username);
            return ResponseEntity.ok(Map.of("visible", visible));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }
}