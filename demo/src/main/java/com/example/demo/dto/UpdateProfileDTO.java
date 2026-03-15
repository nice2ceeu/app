package com.example.demo.dto;

import lombok.Data;

@Data
public class UpdateProfileDTO {
    private String firstName;
    private String lastName;
    private String username;
    private String address;
    private String jobTitle;
}