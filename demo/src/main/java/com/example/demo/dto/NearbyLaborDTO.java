package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NearbyLaborDTO {
    private Long userId;
    private double latitude;
    private double longitude;
    private String firstName;
    private String lastName;
    private String username;
    private String jobTitle;
    private double distanceKm;
    private Double averageStars;
    private Long totalRatings;
    private boolean visible;
    private boolean hirable;
    private String hireStatus;
}