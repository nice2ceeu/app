package com.example.demo.repository;

import com.example.demo.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    PushSubscription findByUserId(Long userId);
}