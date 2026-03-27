package com.example.demo.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.model.UserLocation;
import java.util.List;

@Repository
public interface NearbyLaborRepository extends JpaRepository<UserLocation, Long> {

    // ── Standard (free) ─────────────────────────────────────────────────────
    @Query(value = """
        SELECT ul.user_id, ul.latitude, ul.longitude,
            u.first_name, u.last_name, u.username, u.job_title,
            (6371 * acos(
                cos(radians(:lat)) * cos(radians(ul.latitude)) *
                cos(radians(ul.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(ul.latitude))
            )) AS distance_km,
            ROUND(AVG(r.stars), 1) AS average_stars,
            COUNT(r.id) AS total_ratings,
            u.visible
        FROM user_location ul
        JOIN users u ON u.id = ul.user_id
        LEFT JOIN ratings r ON r.worker_id = ul.user_id
        WHERE u.visible = true
        AND (:jobTitle = '' OR LOWER(u.job_title) LIKE LOWER(CONCAT('%', :jobTitle, '%')))
        AND (
            6371 * acos(
                cos(radians(:lat)) * cos(radians(ul.latitude)) *
                cos(radians(ul.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(ul.latitude))
            )
        ) <= 1.024
        GROUP BY ul.user_id, ul.latitude, ul.longitude,
                u.first_name, u.last_name, u.username, u.job_title, u.visible
        ORDER BY distance_km ASC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> findNearbyLaborsByJobTitle(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("jobTitle") String jobTitle
    );

    // ── Upgraded ─────────────────────────────────────────────────────────────
    @Query(value = """
    SELECT *,
        CASE
            WHEN distance_km <= 1.024 THEN 1
            ELSE 0
        END AS hirable
    FROM (
        SELECT ul.user_id, ul.latitude, ul.longitude,
            u.first_name, u.last_name, u.username, u.job_title,
            (6371 * acos(
                cos(radians(:lat)) * cos(radians(ul.latitude)) *
                cos(radians(ul.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(ul.latitude))
            )) AS distance_km,
            ROUND(AVG(r.stars), 1) AS average_stars,
            COUNT(r.id) AS total_ratings,
            u.visible
        FROM user_location ul
        JOIN users u ON u.id = ul.user_id
        LEFT JOIN ratings r ON r.worker_id = ul.user_id
        WHERE u.visible = true
        AND (:jobTitle = '' OR LOWER(u.job_title) LIKE LOWER(CONCAT('%', :jobTitle, '%')))
        GROUP BY ul.user_id, ul.latitude, ul.longitude,
                u.first_name, u.last_name, u.username, u.job_title, u.visible
        ) sub
        WHERE distance_km <= 1.024
        ORDER BY distance_km ASC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> findNearbyLaborsUpgraded(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("jobTitle") String jobTitle
    );
}