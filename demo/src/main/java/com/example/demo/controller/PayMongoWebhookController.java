package com.example.demo.controller;

import com.example.demo.service.TokenService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class PayMongoWebhookController {

    private final TokenService tokenService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── POST /api/webhooks/paymongo ───────────────────────────────────────────
    // Register this URL in your PayMongo dashboard under Webhooks.
    // PayMongo will POST here when a payment is completed.
    //
    // Event type: checkout_session.payment.paid
    // PayMongo docs: https://developers.paymongo.com/docs/webhooks
    @PostMapping("/paymongo")
    public ResponseEntity<Void> handleWebhook(@RequestBody String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);

            // PayMongo sends: { "data": { "attributes": { "type": "...", "data": { ... } } } }
            String eventType = root
                    .path("data").path("attributes").path("type").asText();

            log.info("PayMongo webhook received: {}", eventType);

            if ("checkout_session.payment.paid".equals(eventType)) {
                // The session ID is nested inside the event data
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
}