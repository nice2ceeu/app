package com.example.demo.dto;

import com.example.demo.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder                  
public class UserDTO {

    private Long id;
    private String firstName;
    private String lastName;
    private String username;
    private String address;
    private String jobTitle;
    private UserRole userRole;
    private Boolean verified;
    private Boolean visible;
}