package com.example.demo.dto;

import com.example.demo.model.VerificationStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationApplicationDTO {
    private Long id;
    private Long userId;
    private String username;
    private String userRole;
    private String govIdUrl;
    private VerificationStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
}