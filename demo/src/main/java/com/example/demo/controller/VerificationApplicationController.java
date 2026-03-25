package com.example.demo.controller;

import com.example.demo.dto.VerificationApplicationDTO;
import com.example.demo.service.VerificationApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/verification")
@RequiredArgsConstructor
public class VerificationApplicationController {

    private final VerificationApplicationService verificationService;

    // ── Submit application (user / employer) ─────────────────────────────
    @PostMapping("/submit")
    public ResponseEntity<?> submit(
            HttpServletRequest request,
            @RequestParam("govId") MultipartFile govId
    ) {
        String username = (String) request.getAttribute("username");
        if (username == null) return unauthorized();

        try {
            VerificationApplicationDTO dto = verificationService.submit(username, govId);
            return ResponseEntity.ok(dto);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to submit application"));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyApplication(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) return unauthorized();

        try {
            return ResponseEntity.ok(verificationService.getMyApplication(username));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Get all applications (admin) ─────────────────────────────────────
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAll(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) return unauthorized();

        try {
            return ResponseEntity.ok(verificationService.getAll(username));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Approve (admin) ──────────────────────────────────────────────────
    @PatchMapping("/admin/approve/{id}")
    public ResponseEntity<?> approve(
            HttpServletRequest request,
            @PathVariable Long id
    ) {
        String username = (String) request.getAttribute("username");
        if (username == null) return unauthorized();

        try {
            return ResponseEntity.ok(verificationService.approve(username, id));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Reject (admin) ───────────────────────────────────────────────────
    @PatchMapping("/admin/reject/{id}")
    public ResponseEntity<?> reject(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestParam(required = false) String reason
    ) {
        String username = (String) request.getAttribute("username");
        if (username == null) return unauthorized();

        try {
            return ResponseEntity.ok(verificationService.reject(username, id, reason));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Helper ───────────────────────────────────────────────────────────
    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }
}