package com.example.demo.repository;

import com.example.demo.model.Subscription;
import com.example.demo.model.Subscription.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByPaymongoSessionId(String sessionId);

    List<Subscription> findByStatusAndExpiresAtBefore(
        SubscriptionStatus status, LocalDateTime now
    );
}