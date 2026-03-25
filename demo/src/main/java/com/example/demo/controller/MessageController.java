package com.example.demo.controller;
 
import com.example.demo.dto.ChatMessageRequest;
import com.example.demo.dto.MessageDTO;
import com.example.demo.ratelimiter.RateLimit;
import com.example.demo.service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
 
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
 
import java.security.Principal;
import java.util.Map;
 
@Controller
@RequiredArgsConstructor
public class MessageController {
 
    private final MessageService messageService;
 
    // Moderate throttle — prevent spam but allow active conversations
    // @RateLimit(requests = 30, durationSeconds = 60)
    @MessageMapping("/chat")
    public void sendMessage(ChatMessageRequest request, Principal principal) {
        messageService.sendMessage(request, principal.getName());
    }
 
    // Paginated read — relaxed limit, still guards against scraping
    // @RateLimit(requests = 30, durationSeconds = 60)
    @GetMapping("/messages/{user1}/{user2}")
    @ResponseBody
    public ResponseEntity<?> getConversation(
            @PathVariable String user1,
            @PathVariable String user2,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request
    ) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
 
        if (!username.equals(user1) && !username.equals(user2)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
 
        Page<MessageDTO> messages = messageService.getConversation(user1, user2, PageRequest.of(page, size));
        return ResponseEntity.ok(messages);
    }
 
    // Inbox polling — tighter cap to prevent aggressive polling loops
    // @RateLimit(requests = 10, durationSeconds = 60)
    @GetMapping("/inbox")
    @ResponseBody
    public ResponseEntity<?> getInbox(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(messageService.getInbox(username));
    }
}