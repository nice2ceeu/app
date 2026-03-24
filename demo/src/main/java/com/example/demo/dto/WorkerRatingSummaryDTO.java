package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkerRatingSummaryDTO {
    private Long workerId;
    private String workerName;
    private Double averageStars;
    private long totalRatings;
    private List<RatingResponseDTO> reviews;
}