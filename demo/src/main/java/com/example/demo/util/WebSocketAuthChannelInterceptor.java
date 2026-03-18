package com.example.demo.util;

import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final UserService userService;

    @Override
public Message<?> preSend(Message<?> message, MessageChannel channel) {
    StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

    if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");

        // 👇 Add this temporarily
        System.out.println("=== WS CONNECT intercepted ===");
        System.out.println("Authorization header: " + authHeader);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String username = userService.validateTokenAndGetUsername(authHeader);
                System.out.println("Authenticated WS user: " + username);
                accessor.setUser(new Principal() {
                    @Override
                    public String getName() { return username; }
                });
            } catch (Exception e) {
                System.out.println("JWT validation failed: " + e.getMessage());
                throw new IllegalArgumentException("Invalid JWT token in WebSocket CONNECT");
            }
        } else {
            System.out.println("No Authorization header found in CONNECT");
        }
    }

    return message;
}
}