package com.example.demo.service;

import com.example.demo.model.PushSubscription;
import com.example.demo.repository.PushSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import nl.martijndwars.webpush.Utils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Security;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final ObjectMapper objectMapper;

    @Value("${vapid.public-key}")
    private String publicKey;

    @Value("${vapid.private-key}")
    private String privateKey;

    @Value("${vapid.subject}")
    private String subject;

    private PushService pushService;

    @PostConstruct
    public void init() throws Exception {
        Security.addProvider(new BouncyCastleProvider()); 
        this.pushService = new PushService()
                .setSubject(subject)
                .setPublicKey(Utils.loadPublicKey(publicKey))
                .setPrivateKey(Utils.loadPrivateKey(privateKey));
    }

    public void saveSubscription(Long userId, String subscriptionJson) {
        PushSubscription sub = subscriptionRepository.findByUserId(userId);
        if (sub == null) {
            sub = new PushSubscription();
            sub.setUserId(userId);
        }
        sub.setSubscriptionJson(subscriptionJson);
        subscriptionRepository.save(sub);
    }

    public void sendPush(Long userId, String title, String body) {
        PushSubscription sub = subscriptionRepository.findByUserId(userId);
        if (sub == null) {
            log.warn("No push subscription found for userId={}", userId);
            return;
        }

        try {
            byte[] payload = objectMapper.writeValueAsBytes(
                    Map.of("title", title, "body", body)
            );

            Subscription subscription = objectMapper.readValue(sub.getSubscriptionJson(), Subscription.class);

            Notification notification = new Notification(
                    subscription.endpoint,
                    subscription.keys.p256dh,
                    subscription.keys.auth,
                    payload
            );

            pushService.send(notification);
            log.info("Push notification sent to userId={}", userId);

        } catch (Exception e) {
            log.error("Failed to send push notification to userId={}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Push notification failed for userId=" + userId, e);
        }
    }
}