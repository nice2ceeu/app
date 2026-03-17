package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class BlogPostDTO {
    private Long          id;
    private String        caption;
    private String        imagePath;
    private LocalDateTime createdAt;
    private String        authorFirstName;
    private String        authorLastName;
}