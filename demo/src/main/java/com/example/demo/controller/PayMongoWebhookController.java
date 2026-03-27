package com.example.demo.controller;

import com.example.demo.service.TokenService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import com.example.demo.service.SubscriptionService;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class PayMongoWebhookController {

    @Value("${paymongo.webhook-secret}")
    private String webhookSecret;
    
    private final TokenService tokenService;
    private final SubscriptionService subscriptionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/paymongo")
    public ResponseEntity<Void> handleWebhook(
        @RequestHeader("Paymongo-Signature") String signature,
        @RequestBody String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);


            if (!isValidSignature(signature, payload, webhookSecret)) {
                log.warn("Invalid PayMongo webhook signature");
                return ResponseEntity.status(401).build();
            }

            // PayMongo sends: { "data": { "attributes": { "type": "...", "data": { ... } } } }
            String eventType = root
                    .path("data").path("attributes").path("type").asText();

            log.info("PayMongo webhook received: {}", eventType);

            if ("checkout_session.payment.paid".equals(eventType)) {
            String sessionId = root
                    .path("data")
                    .path("attributes")
                    .path("data")
                    .path("id")
                    .asText();

            if (sessionId == null || sessionId.isBlank()) {
                log.error("No session ID found in webhook payload");
                return ResponseEntity.badRequest().build();
            }

            // Try subscription first; falls back gracefully if not found
            subscriptionService.handleWebhook(sessionId);

            // Always run token webhook too (it's idempotent)
            tokenService.handleWebhook(sessionId);
        }

            // Always return 200 so PayMongo doesn't retry
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Error processing PayMongo webhook: {}", e.getMessage(), e);
            // Still return 200 to avoid infinite retries from PayMongo
            return ResponseEntity.ok().build();
        }
    }

    private boolean isValidSignature(String signature, String payload, String secret) {
    try {
        String[] parts = signature.split(",");
        String timestamp = parts[0].substring(2); // remove "t="
        String receivedHash = parts[1].substring(3); // remove "te="

        // Reconstruct the signed payload
        String signedPayload = timestamp + "." + payload;

        // HMAC-SHA256
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
        String computedHash = HexFormat.of()
            .formatHex(mac.doFinal(signedPayload.getBytes()));

        return computedHash.equals(receivedHash);

    } catch (Exception e) {
        log.error("Signature verification failed: {}", e.getMessage());
        return false;
    }
}
}