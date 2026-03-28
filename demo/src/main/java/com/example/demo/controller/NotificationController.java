package com.example.demo.controller;

import com.example.demo.service.NotificationService;
import com.example.demo.dto.SubscribeRequestDTO;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;



@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(@RequestBody SubscribeRequestDTO request) {
        notificationService.saveSubscription(request.getUserId(), request.getSubscription());
        return ResponseEntity.ok().build();
    }
}
