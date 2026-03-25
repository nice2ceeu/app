package com.example.demo.service;

import com.example.demo.dto.VerificationApplicationDTO;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationApplicationService {

    private final VerificationApplicationRepository appRepo;
    private final UserRepository userRepo;

    private static final String UPLOAD_DIR = "uploads/verification/";

    // ── Submit (user & employer only) ────────────────────────────────────
    public VerificationApplicationDTO submit(String username, MultipartFile govId) throws IOException {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (user.getUserRole() == UserRole.admin) {
            throw new AccessDeniedException("Admins cannot submit verification applications");
        }

        if (user.getVerified()) {
            throw new IllegalStateException("User is already verified");
        }

        appRepo.findByUser(user).ifPresent(existing -> {
            if (existing.getStatus() == VerificationStatus.PENDING) {
                throw new IllegalStateException("You already have a pending application");
            }
        });

        // ── Save file (matching BlogPostService pattern) ──────────────────
        String filename  = UUID.randomUUID() + "_" + govId.getOriginalFilename();
        Path uploadPath  = Paths.get(UPLOAD_DIR);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Files.copy(govId.getInputStream(),
                uploadPath.resolve(filename),
                StandardCopyOption.REPLACE_EXISTING);

        String govIdUrl = "/assets/verification/" + filename; // ✅ frontend-facing path
        // ─────────────────────────────────────────────────────────────────

        VerificationApplication app = VerificationApplication.builder()
                .user(user)
                .govIdUrl(govIdUrl)
                .status(VerificationStatus.PENDING)
                .build();

        return toDTO(appRepo.save(app));
    }

    // ── Get my application (user / employer) ─────────────────────────────
    public VerificationApplicationDTO getMyApplication(String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        VerificationApplication app = appRepo.findByUser(user)
                .orElseThrow(() -> new NoSuchElementException("No application found"));

        return toDTO(app);
    }

    // ── Get all (admin only) ─────────────────────────────────────────────
    public List<VerificationApplicationDTO> getAll(String username) {
        User admin = userRepo.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (admin.getUserRole() != UserRole.admin) {
            throw new AccessDeniedException("Access Denied");
        }

        return appRepo.findAllUnverifiedNonAdmin(UserRole.admin)
        .stream()
        .map(this::toDTO)
        .toList();
    }

    // ── Approve (admin only) ─────────────────────────────────────────────
    public VerificationApplicationDTO approve(String username, Long appId) {
        adminCheck(username);

        VerificationApplication app = appRepo.findById(appId)
                .orElseThrow(() -> new NoSuchElementException("Application not found"));

        app.setStatus(VerificationStatus.APPROVED);
        app.setReviewedAt(LocalDateTime.now());
        app.setRejectionReason(null);

        User user = app.getUser();
        user.setVerified(true);
        userRepo.save(user);

        return toDTO(appRepo.save(app));
    }

    // ── Reject (admin only) ──────────────────────────────────────────────
    public VerificationApplicationDTO reject(String username, Long appId, String reason) {
        adminCheck(username);

        VerificationApplication app = appRepo.findById(appId)
                .orElseThrow(() -> new NoSuchElementException("Application not found"));

        app.setStatus(VerificationStatus.REJECTED);
        app.setReviewedAt(LocalDateTime.now());
        app.setRejectionReason(reason);

        return toDTO(appRepo.save(app));
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    private void adminCheck(String username) {
        User admin = userRepo.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        if (admin.getUserRole() != UserRole.admin) {
            throw new AccessDeniedException("Access Denied");
        }
    }

    private VerificationApplicationDTO toDTO(VerificationApplication app) {
        return VerificationApplicationDTO.builder()
                .id(app.getId())
                .userId(app.getUser().getId())
                .username(app.getUser().getUsername())
                .userRole(app.getUser().getUserRole().name())
                .govIdUrl(app.getGovIdUrl())
                .status(app.getStatus())
                .submittedAt(app.getSubmittedAt())
                .reviewedAt(app.getReviewedAt())
                .rejectionReason(app.getRejectionReason())
                .build();
    }
}