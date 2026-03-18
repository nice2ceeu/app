package com.example.demo.dto;

import com.example.demo.model.Message;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MessageDTO {

    private Long id;
    private String senderUsername;
    private String receiverUsername;
    private String content;
    private LocalDateTime timestamp;
    private boolean seen;

    // ✅ Original — used internally if needed
    public static MessageDTO fromEntity(Message message) {
        return MessageDTO.builder()
                .id(message.getId())
                .senderUsername(message.getSender().getUsername())
                .receiverUsername(message.getReceiver().getUsername())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .seen(message.isSeen())
                .build();
    }

    // ✅ Used by service — accepts pre-decrypted content
    public static MessageDTO fromEntity(Message message, String decryptedContent) {
        return MessageDTO.builder()
                .id(message.getId())
                .senderUsername(message.getSender().getUsername())
                .receiverUsername(message.getReceiver().getUsername())
                .content(decryptedContent)
                .timestamp(message.getTimestamp())
                .seen(message.isSeen())
                .build();
    }
}
