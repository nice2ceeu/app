package com.example.demo.controller;

import com.example.demo.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String plan = body.get("plan").toString();

        String checkoutUrl = subscriptionService.createCheckout(userId, plan);
        return ResponseEntity.ok(Map.of("checkoutUrl", checkoutUrl));
    }
}