package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "token_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Amount in PHP (e.g. 100, 200, 300, 500)
    @Column(nullable = false)
    private Integer amountPaid;

    // Tokens credited (amountPaid / 10)
    @Column(nullable = false)
    private Integer tokensAdded;

    // PayMongo checkout session ID — used to verify webhook
    @Column(nullable = true, unique = true)
    private String paymongoSessionId;

    // PayMongo checkout URL returned to frontend
    @Column(nullable = true, length = 1000)
    private String checkoutUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status; // PENDING, PAID, FAILED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = true)
    private LocalDateTime paidAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum TransactionStatus {
        PENDING,
        PAID,
        FAILED
    }
}