package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "blog_posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String caption;

    @Column(name = "image_path")
    private String imagePath;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    public String getAuthorFirstName() {
        return author != null ? author.getFirstName() : null;
    }

    public String getAuthorLastName() {
        return author != null ? author.getLastName() : null;
    }

    public String getAuthorFullName() {
        if (author == null) return null;
        return author.getFirstName() + " " + author.getLastName();
    }
}