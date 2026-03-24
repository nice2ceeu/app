package com.example.demo.repository;

import com.example.demo.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    // Check if a rating already exists for a given hire (prevent duplicates)
    boolean existsByHireId(Long hireId);

    // Fetch a rating by hireId
    Optional<Rating> findByHireId(Long hireId);

    // All ratings for a worker (for their public profile / average)
    List<Rating> findByWorkerId(Long workerId);

    // Average star rating for a worker
    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.worker.id = :workerId")
    Double findAverageStarsByWorkerId(@Param("workerId") Long workerId);

    // Count of ratings for a worker
    long countByWorkerId(Long workerId);
}