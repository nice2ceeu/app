package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class BlogPostService {

    // store outside project (safe for dev + production)
    private static final String UPLOAD_DIR = "uploads/images/";

    // Save image to disk, return relative URL path
    public String saveImage(MultipartFile file) throws IOException {
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();

        Path uploadPath = Paths.get(UPLOAD_DIR);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Files.copy(file.getInputStream(),
                uploadPath.resolve(filename),
                StandardCopyOption.REPLACE_EXISTING);

        // URL used by frontend
        return "/assets/images/" + filename;
    }

    // Delete image from disk
    public void deleteImage(String imagePath) {
        if (imagePath == null || imagePath.isBlank()) return;

        try {
            String filename = Paths.get(imagePath).getFileName().toString();

            Path path = Paths.get(UPLOAD_DIR).resolve(filename);

            Files.deleteIfExists(path);

        } catch (IOException e) {
            System.err.println("Warning: could not delete image: " + imagePath + " — " + e.getMessage());
        }
    }
}