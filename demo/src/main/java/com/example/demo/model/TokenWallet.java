package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "token_wallets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Integer balance = 0;

    @Column(nullable = false)
    private Integer totalPurchased = 0;

    @Column(nullable = false)
    private Integer totalSpent = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = true)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void addTokens(int amount) {
        this.balance += amount;
        this.totalPurchased += amount;
    }

    public void deductTokens(int amount) {
        if (this.balance < amount) {
            throw new RuntimeException(
                "Insufficient tokens. Required: " + amount + ", Available: " + this.balance);
        }
        this.balance -= amount;
        this.totalSpent += amount;
    }
}