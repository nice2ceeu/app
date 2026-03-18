package com.example.demo.controller;

import com.example.demo.dto.BlogPostDTO;
import com.example.demo.model.BlogPost;
import com.example.demo.repository.BlogPostRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.BlogPostService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class BlogPostController {

    private final BlogPostRepository blogPostRepository;
    private final UserRepository     userRepository;
    private final BlogPostService    blogPostService;

    // GET /api/posts?page=0&size=10
    // GET /api/posts?authorId=1&page=0&size=10
    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false)    Long   authorId,
            @RequestParam(defaultValue = "0")  int    page,
            @RequestParam(defaultValue = "10") int    size,
            HttpServletRequest request
    ) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<BlogPostDTO> posts = (authorId != null
                ? blogPostRepository.findByAuthorId(authorId, pageable)
                : blogPostRepository.findAll(pageable))
                .map(this::toDTO);

        return ResponseEntity.ok(posts);
    }

    // POST /api/posts — create post
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> create(
            @RequestParam("caption")                            String        caption,
            @RequestParam(value = "image",    required = false) MultipartFile image,
            HttpServletRequest request
    ) throws IOException {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        if (caption == null || caption.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Caption must not be blank."));
        }

        // 🔒 Resolve author from JWT username instead of trusting client-supplied authorId
        var author = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BlogPost post = new BlogPost();
        post.setCaption(caption);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        post.setAuthor(author);

        if (image != null && !image.isEmpty()) {
            post.setImagePath(blogPostService.saveImage(image));
        }

        return ResponseEntity.ok(toDTO(blogPostRepository.save(post)));
    }

    // PUT /api/posts/{id} — update post
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> update(
            @PathVariable                                    Long          id,
            @RequestParam("caption")                         String        caption,
            @RequestParam(value = "image", required = false) MultipartFile image,
            HttpServletRequest request
    ) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        if (caption == null || caption.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Caption must not be blank."));
        }

        return blogPostRepository.findById(id).map(post -> {

            if (post.getAuthor() == null || !post.getAuthor().getUsername().equals(username)) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }

            post.setCaption(caption);
            post.setUpdatedAt(LocalDateTime.now());

            if (image != null && !image.isEmpty()) {
                if (post.getImagePath() != null) {
                    blogPostService.deleteImage(post.getImagePath());
                }
                try {
                    post.setImagePath(blogPostService.saveImage(image));
                } catch (IOException e) {
                    throw new RuntimeException("Failed to save image", e);
                }
            }

            return ResponseEntity.ok(toDTO(blogPostRepository.save(post)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return blogPostRepository.findById(id).map(post -> {

            if (post.getAuthor() == null || !post.getAuthor().getUsername().equals(username)) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }

            if (post.getImagePath() != null) {
                blogPostService.deleteImage(post.getImagePath());
            }
            blogPostRepository.delete(post);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private BlogPostDTO toDTO(BlogPost p) {
        return new BlogPostDTO(
                p.getId(),
                p.getCaption(),
                p.getImagePath(),
                p.getCreatedAt(),
                p.getAuthor() != null ? p.getAuthor().getId()        : null,
                p.getAuthor() != null ? p.getAuthor().getUsername()  : null,
                p.getAuthor() != null ? p.getAuthor().getFirstName() : null,
                p.getAuthor() != null ? p.getAuthor().getLastName()  : null
        );
    }
}