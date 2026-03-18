package com.example.demo.dto;

import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class InboxItemDTO {
    private String username;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Long unreadCount;  

    public InboxItemDTO(String username, String lastMessage, LocalDateTime lastMessageTime, Long unreadCount) {
        this.username = username;
        this.lastMessage = lastMessage;
        this.lastMessageTime = lastMessageTime;
        this.unreadCount = unreadCount;
    }
}