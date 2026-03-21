package com.example.demo.controller;

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