package com.example.demo.dto;

import com.example.demo.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserProfileDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String username;
    private String address;
    private String jobTitle;
    private UserRole userRole;
    private Boolean verified;
    private LocationDTO location;
    private Boolean hired;

    @Data
    @AllArgsConstructor
    public static class LocationDTO {
        private Double latitude;
        private Double longitude;
    }
}