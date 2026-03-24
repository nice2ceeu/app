package com.example.demo.repository;

import com.example.demo.model.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    Page<BlogPost> findByAuthorId(Long authorId, Pageable pageable);

    List<BlogPost> findByAuthorId(Long authorId);

    @Query(value = """
        SELECT bp.*
        FROM blog_posts bp
        JOIN user_location ul ON ul.user_id = bp.author_id
        WHERE (
            6371 * acos(
                cos(radians(:lat)) * cos(radians(ul.latitude)) *
                cos(radians(ul.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(ul.latitude))
            )
        ) <= 0.5
        ORDER BY bp.created_at DESC
    """,
    countQuery = """
        SELECT COUNT(bp.id)
        FROM blog_posts bp
        JOIN user_location ul ON ul.user_id = bp.author_id
        WHERE (
            6371 * acos(
                cos(radians(:lat)) * cos(radians(ul.latitude)) *
                cos(radians(ul.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(ul.latitude))
            )
        ) <= 0.5
    """,
    nativeQuery = true)
    Page<BlogPost> findNearbyPosts(
        @Param("lat") double lat,
        @Param("lng") double lng,
        Pageable pageable
    );
}