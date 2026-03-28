package com.example.demo.dto;

import lombok.Data;

@Data
public class SubscribeRequestDTO {
    private Long userId;
    private String subscription;
}