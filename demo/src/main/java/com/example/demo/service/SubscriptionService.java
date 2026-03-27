package com.example.demo.service;

import com.example.demo.model.Subscription;
import com.example.demo.model.Subscription.SubscriptionStatus;
import com.example.demo.model.User;
import com.example.demo.repository.SubscriptionRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final PayMongoService payMongoService;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    private static final int PRO_PRICE = 100;

    // ── 1. Create checkout & save PENDING subscription ────────────────────────
    @Transactional
    public String createCheckout(Long userId, String plan) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (!"pro".equalsIgnoreCase(plan)) {
            throw new RuntimeException("Invalid plan: " + plan);
        }

        String description = "Nutohr Pro — Monthly Subscription";
        JsonNode response = payMongoService.createCheckoutSession(PRO_PRICE, description);

        String sessionId = response.path("data").path("id").asText();
        String checkoutUrl = response
                .path("data").path("attributes").path("checkout_url").asText();

        if (checkoutUrl == null || checkoutUrl.isBlank()) {
            throw new RuntimeException("Failed to get checkout URL from PayMongo.");
        }

        // Save PENDING subscription
        Subscription sub = new Subscription();
        sub.setUser(user);
        sub.setPlan(plan);
        sub.setAmountPaid(PRO_PRICE);
        sub.setPaymongoSessionId(sessionId);
        sub.setCheckoutUrl(checkoutUrl);
        sub.setStatus(SubscriptionStatus.PENDING);
        subscriptionRepository.save(sub);

        log.info("Subscription checkout created for user {} (plan: {})", userId, plan);
        return checkoutUrl;
    }

    // ── 2. Called by webhook when payment confirms ────────────────────────────
    @Transactional
    public void handleWebhook(String sessionId) {
        Subscription sub = subscriptionRepository.findByPaymongoSessionId(sessionId)
                .orElse(null);

        // Not a subscription session — let TokenService handle it
        if (sub == null) return;

        if (sub.getStatus() == SubscriptionStatus.PAID) {
            log.info("Subscription webhook already processed for session: {}", sessionId);
            return;
        }

        sub.setStatus(SubscriptionStatus.PAID);
        sub.setPaidAt(LocalDateTime.now());
        sub.setExpiresAt(LocalDateTime.now().plusDays(30));
        subscriptionRepository.save(sub);

        userRepository.upgradeUser(sub.getUser().getId());
        log.info("User {} upgraded to PRO, expires at {}", sub.getUser().getId(), sub.getExpiresAt());
    }

    // ── 3. Scheduler: expire subscriptions daily at midnight ──────────────────
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expireSubscriptions() {
        List<Subscription> expired = subscriptionRepository
                .findByStatusAndExpiresAtBefore(SubscriptionStatus.PAID, LocalDateTime.now());

        for (Subscription sub : expired) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);

            // Revoke upgraded flag
            userRepository.downgradeUser(sub.getUser().getId());
            log.info("Subscription expired for user {}", sub.getUser().getId());
        }
    }
}