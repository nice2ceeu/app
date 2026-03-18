package com.example.demo.service;

import com.example.demo.dto.ChatMessageRequest;
import com.example.demo.dto.InboxItemDTO;
import com.example.demo.dto.MessageDTO;
import com.example.demo.model.Message;
import com.example.demo.model.User;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final EncryptionUtil encryptionUtil; // ✅

    public void sendMessage(ChatMessageRequest request, String senderUsername) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findByUsername(request.getReceiver())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(encryptionUtil.encrypt(request.getContent())) // ✅ encrypt before save
                .timestamp(LocalDateTime.now())
                .seen(false)
                .build();

        messageRepository.save(message);

        // ✅ Decrypt before sending over WebSocket so frontend receives plain text
        MessageDTO dto = MessageDTO.fromEntity(message, encryptionUtil.decrypt(message.getContent()));

        messagingTemplate.convertAndSendToUser(receiver.getUsername(), "/queue/messages", dto);
        messagingTemplate.convertAndSendToUser(sender.getUsername(), "/queue/messages", dto);
    }

    public Page<MessageDTO> getConversation(String user1, String user2, Pageable pageable) {
        return messageRepository.findConversation(user1, user2, pageable)
                .map(m -> MessageDTO.fromEntity(m, encryptionUtil.decrypt(m.getContent()))); 
    }

    public List<InboxItemDTO> getInbox(String username) {
        return messageRepository.findInbox(username).stream()
                .map(item -> new InboxItemDTO(
                        item.getUsername(),
                        encryptionUtil.decrypt(item.getLastMessage()), 
                        item.getLastMessageTime(),
                        item.getUnreadCount()
                ))
                .toList();
    }
}