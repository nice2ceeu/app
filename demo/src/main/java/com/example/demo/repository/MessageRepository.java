package com.example.demo.repository;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.dto.InboxItemDTO;
import com.example.demo.model.Message;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query(value = """
        SELECT m FROM Message m
        WHERE (m.sender.username = :user1 AND m.receiver.username = :user2)
        OR (m.sender.username = :user2 AND m.receiver.username = :user1)
        ORDER BY m.timestamp ASC
    """,
    countQuery = """
        SELECT COUNT(m) FROM Message m
        WHERE (m.sender.username = :user1 AND m.receiver.username = :user2)
        OR (m.sender.username = :user2 AND m.receiver.username = :user1)
    """)
    Page<Message> findConversation(
            @Param("user1") String user1,
            @Param("user2") String user2,
            Pageable pageable
    );

    @Query("""
    SELECT new com.example.demo.dto.InboxItemDTO(
        CASE WHEN m.sender.username = :username
            THEN m.receiver.username
            ELSE m.sender.username END,
        MAX(m.content),
        MAX(m.timestamp),
        SUM(CASE WHEN m.seen = false AND m.receiver.username = :username THEN 1 ELSE 0 END)
        )
        FROM Message m
        WHERE m.sender.username = :username OR m.receiver.username = :username
        GROUP BY
            CASE WHEN m.sender.username = :username
                THEN m.receiver.username
                ELSE m.sender.username END
        ORDER BY MAX(m.timestamp) DESC
    """)
    List<InboxItemDTO> findInbox(@Param("username") String username);
    @Modifying
    @Query("DELETE FROM Message m WHERE (m.sender.id = :user1 AND m.receiver.id = :user2) OR (m.sender.id = :user2 AND m.receiver.id = :user1)")
    void deleteConversation(@Param("user1") Long user1, @Param("user2") Long user2);
}