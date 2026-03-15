package com.example.demo.dto;

import lombok.Data;

@Data
public class UserLocationDTO {
    private Long userId;
    private Double latitude;
    private Double longitude;
}