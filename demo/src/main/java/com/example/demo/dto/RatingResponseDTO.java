package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RatingResponseDTO {
    private Long id;
    private Long hireId;
    private Long workerId;
    private String workerName;       // "Juan dela Cruz"
    private Long employerId;
    private String employerName;     // "Maria Santos"
    private Integer stars;
    private String comment;
    private LocalDateTime createdAt;
}