package com.example.demo.repository;

import com.example.demo.model.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    Page<BlogPost> findByAuthorId(Long authorId, Pageable pageable);

    java.util.List<BlogPost> findByAuthorId(Long authorId);
}