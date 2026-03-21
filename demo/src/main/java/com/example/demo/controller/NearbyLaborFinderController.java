package com.example.demo.controller;

import com.example.demo.dto.NearbyLaborDTO;
import com.example.demo.ratelimiter.RateLimit;
import com.example.demo.service.NearbyLaborService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class NearbyLaborFinderController {

    private final NearbyLaborService nearbyLaborService;

    // Geo-search is expensive — strict limit to prevent DB/query abuse
    @RateLimit(requests = 10, durationSeconds = 60)
    @GetMapping("/employer/nearby-labors")
    public ResponseEntity<?> getNearbyLabor(
            HttpServletRequest request,
            @RequestParam(required = false) String jobTitle) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            List<NearbyLaborDTO> labor = nearbyLaborService.getNearbyLabor(username, jobTitle);
            return ResponseEntity.ok(labor);
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }
}