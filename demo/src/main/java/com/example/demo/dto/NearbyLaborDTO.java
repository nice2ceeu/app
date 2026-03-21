package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NearbyLaborDTO {
    private Long userId;
    private double latitude;
    private double longitude;
    private String firstName;
    private String lastName;
    private String username;
    private String jobTitle;
    private double distanceKm;
}