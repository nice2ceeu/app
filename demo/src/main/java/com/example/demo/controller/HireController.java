package com.example.demo.controller;

import com.example.demo.service.HireService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/employer/hires")
@RequiredArgsConstructor
public class HireController {

    private final HireService hireService;

    @GetMapping
    public ResponseEntity<?> getActiveWorkers(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<Map<String, Object>> workers = hireService.getActiveWorkers(username);
        return ResponseEntity.ok(workers);
    }

    @PostMapping("/{hireId}/end")
    public ResponseEntity<?> endContract(
            @PathVariable Long hireId,
            HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            hireService.endContract(hireId, username);
            return ResponseEntity.ok(Map.of("message", "Contract ended."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @PostMapping("/{hireId}/cancel")
    public ResponseEntity<?> cancelContract(
            @PathVariable Long hireId,
            HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            hireService.cancelContract(hireId, username);
            return ResponseEntity.ok(Map.of("message", "Contract cancelled. Worker refunded."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
