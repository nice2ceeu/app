package com.example.demo.controller;

import com.example.demo.dto.UserLocationDTO;
import com.example.demo.ratelimiter.RateLimit;
import com.example.demo.service.UserLocationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user-location")
@RequiredArgsConstructor
public class UserLocationController {

    private final UserLocationService userLocationService;

    // Location writes — moderate cap, GPS updates shouldn't be more frequent than this
    @RateLimit(requests = 20, durationSeconds = 60)
    @PostMapping
    public ResponseEntity<?> saveLocation(
            @RequestBody UserLocationDTO dto,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        UserLocationDTO saved = userLocationService.saveLocation(dto);
        return ResponseEntity.ok(saved);
    }

    // Location reads — relaxed, lookup is cheap but still guarded
    @RateLimit(requests = 30, durationSeconds = 60)
    @GetMapping("/{userId}")
    public ResponseEntity<?> getLocation(
            @PathVariable Long userId,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        UserLocationDTO location = userLocationService.getLocationByUserId(userId);
        return ResponseEntity.ok(location);
    }
}