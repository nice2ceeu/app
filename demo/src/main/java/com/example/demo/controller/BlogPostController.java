package com.example.demo.controller;

import com.example.demo.dto.BlogPostDTO;
import com.example.demo.model.BlogPost;
import com.example.demo.repository.BlogPostRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.BlogPostService;
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
    public Page<BlogPostDTO> getAll(
            @RequestParam(required = false)    Long   authorId,
            @RequestParam(defaultValue = "0")  int    page,
            @RequestParam(defaultValue = "10") int    size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<BlogPost> posts = authorId != null
                ? blogPostRepository.findByAuthorId(authorId, pageable)
                : blogPostRepository.findAll(pageable);

        return posts.map(this::toDTO);
    }

    // POST /api/posts — create post
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> create(
            @RequestParam("caption")                            String        caption,
            @RequestParam(value = "image",    required = false) MultipartFile image,
            @RequestParam(value = "authorId", required = false) Long          authorId
    ) throws IOException {

        if (caption == null || caption.isBlank()) {
            return ResponseEntity.badRequest().body("Caption must not be blank.");
        }

        BlogPost post = new BlogPost();
        post.setCaption(caption);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());

        if (image != null && !image.isEmpty()) {
            post.setImagePath(blogPostService.saveImage(image));
        }

        if (authorId != null) {
            var author = userRepository.findById(authorId).orElse(null);
            if (author == null) {
                return ResponseEntity.badRequest().body("Author not found for id: " + authorId);
            }
            post.setAuthor(author);
        }

        return ResponseEntity.ok(toDTO(blogPostRepository.save(post)));
    }

    // PUT /api/posts/{id} — update post
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> update(
            @PathVariable                                    Long          id,
            @RequestParam("caption")                         String        caption,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        if (caption == null || caption.isBlank()) {
            return ResponseEntity.badRequest().body("Caption must not be blank.");
        }

        return blogPostRepository.findById(id).map(post -> {
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

    // DELETE /api/posts/{id} — delete post + image from disk
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return blogPostRepository.findById(id).map(post -> {
            if (post.getImagePath() != null) {
                blogPostService.deleteImage(post.getImagePath());
            }
            blogPostRepository.delete(post);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Helper: entity → DTO ──────────────────────────────────────
    private BlogPostDTO toDTO(BlogPost p) {
        return new BlogPostDTO(
                p.getId(),
                p.getCaption(),
                p.getImagePath(),
                p.getCreatedAt(),
                p.getAuthor() != null ? p.getAuthor().getFirstName() : null,
                p.getAuthor() != null ? p.getAuthor().getLastName()  : null
        );
    }
}
