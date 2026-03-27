package com.example.demo.repository;

import com.example.demo.model.Subscription;
import com.example.demo.model.Subscription.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByPaymongoSessionId(String sessionId);

    // Used by the expiry scheduler to find all paid subs that have passed expiresAt
    List<Subscription> findByStatusAndExpiresAtBefore(
        SubscriptionStatus status, LocalDateTime now
    );
}