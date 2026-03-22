package com.example.demo.dto;

import com.example.demo.model.TokenTransaction.TransactionStatus;
import lombok.Data;

import java.time.LocalDateTime;

public class TokenDTO {

    // ── Frontend sends this to create a checkout session ──────────────────────
    @Data
    public static class CheckoutRequest {
        private Long userId;
        private Integer amount; // PHP amount: 100, 200, 300, 500
    }

    // ── Backend returns this so frontend can redirect ──────────────────────────
    @Data
    public static class CheckoutResponse {
        private String checkoutUrl;
        private Long transactionId;
    }

    // ── Wallet info ───────────────────────────────────────────────────────────
    @Data
    public static class WalletResponse {
        private Long walletId;
        private Long userId;
        private String userName;
        private Integer balance;
        private Integer totalPurchased;
        private Integer totalSpent;
        private LocalDateTime updatedAt;
    }

    // ── Transaction record ────────────────────────────────────────────────────
    @Data
    public static class TransactionResponse {
        private Long id;
        private Long userId;
        private String userName;
        private Integer amountPaid;
        private Integer tokensAdded;
        private TransactionStatus status;
        private String paymongoSessionId;
        private LocalDateTime createdAt;
        private LocalDateTime paidAt;
    }
}