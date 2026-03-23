package com.example.demo.service;

import com.example.demo.dto.TokenDTO;
import com.example.demo.model.TokenTransaction;
import com.example.demo.model.TokenTransaction.TransactionStatus;
import com.example.demo.model.TokenWallet;
import com.example.demo.model.User;
import com.example.demo.repository.TokenTransactionRepository;
import com.example.demo.repository.TokenWalletRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenService {

    private final TokenWalletRepository walletRepository;
    private final TokenTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PayMongoService payMongoService;

    // ── 1. Frontend calls this → returns checkoutUrl for redirect ─────────────
    @Transactional
    public TokenDTO.CheckoutResponse createCheckout(TokenDTO.CheckoutRequest request) {
        if (request.getAmount() == null || request.getAmount() < 50) {
            throw new RuntimeException("Minimum top-up amount is ₱50.");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.getUserId()));

        int tokens = request.getAmount() / 10; // ₱10 = 1 token

        // Call PayMongo to create checkout session
        String description = "Top Up – " + tokens + " tokens";
        JsonNode paymongoResponse = payMongoService.createCheckoutSession(request.getAmount(), description);

        String sessionId  = paymongoResponse.path("data").path("id").asText();
        String checkoutUrl = paymongoResponse
                .path("data").path("attributes").path("checkout_url").asText();

        // Save a PENDING transaction
        TokenTransaction tx = new TokenTransaction();
        tx.setUser(user);
        tx.setAmountPaid(request.getAmount());
        tx.setTokensAdded(tokens);
        tx.setPaymongoSessionId(sessionId);
        tx.setCheckoutUrl(checkoutUrl);
        tx.setStatus(TransactionStatus.PENDING);
        transactionRepository.save(tx);

        TokenDTO.CheckoutResponse response = new TokenDTO.CheckoutResponse();
        response.setCheckoutUrl(checkoutUrl);
        response.setTransactionId(tx.getId());
        return response;
    }

    // ── 2. PayMongo webhook calls this when payment succeeds ──────────────────
    @Transactional
    public void handleWebhook(String sessionId) {
        TokenTransaction tx = transactionRepository.findByPaymongoSessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found for session: " + sessionId));

        if (tx.getStatus() == TransactionStatus.PAID) {
            log.info("Webhook already processed for session: {}", sessionId);
            return; // idempotent — safe to call twice
        }

        // Credit tokens to wallet
        creditWallet(tx);

        tx.setStatus(TransactionStatus.PAID);
        tx.setPaidAt(LocalDateTime.now());
        transactionRepository.save(tx);
        
        log.info("Tokens credited: {} tokens to user {} (session {})",
        tx.getTokensAdded(), tx.getUser().getId(), sessionId);
    }

    // ── 3. Called from success_url page to confirm payment ────────────────────
    // This is a fallback in case the webhook is delayed
    @Transactional
    public TokenDTO.TransactionResponse confirmBySessionId(String sessionId) {
        TokenTransaction tx = transactionRepository.findByPaymongoSessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found."));

        if (tx.getStatus() == TransactionStatus.PAID) {
            return toTransactionResponse(tx); // already done
        }

        // Verify from PayMongo
        JsonNode session = payMongoService.getCheckoutSession(sessionId);
        String paymentStatus = session
                .path("data").path("attributes").path("payment_status").asText();

        if ("paid".equalsIgnoreCase(paymentStatus)) {
            creditWallet(tx);
            tx.setStatus(TransactionStatus.PAID);
            tx.setPaidAt(LocalDateTime.now());
            transactionRepository.save(tx);
        }

        return toTransactionResponse(tx);
    }

    // ── Wallet: get or create ─────────────────────────────────────────────────
    @Transactional
    public TokenWallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));
            TokenWallet wallet = new TokenWallet();
            wallet.setUser(user);
            wallet.setBalance(0);
            wallet.setTotalPurchased(0);
            wallet.setTotalSpent(0);
            return walletRepository.save(wallet);
        });
    }

    public TokenDTO.WalletResponse getWallet(Long userId) {
        return toWalletResponse(getOrCreateWallet(userId));
    }

    // ── Transaction history ───────────────────────────────────────────────────
    public Page<TokenDTO.TransactionResponse> getUserHistory(Long userId, Pageable pageable) {
        return transactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toTransactionResponse);
    }

    // Admin
    public Page<TokenDTO.TransactionResponse> getAllTransactions(Pageable pageable) {
        return transactionRepository
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toTransactionResponse);
    }

    // ── Spend tokens (visibility / scan nearby) ───────────────────────────────
    @Transactional
    public void spendTokens(Long userId, int cost, String reason) {
        TokenWallet wallet = getOrCreateWallet(userId);
        wallet.deductTokens(cost); // throws if insufficient
        walletRepository.save(wallet);
        log.info("User {} spent {} tokens for: {}", userId, cost, reason);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────
    private void creditWallet(TokenTransaction tx) {
        TokenWallet wallet = getOrCreateWallet(tx.getUser().getId());
        wallet.addTokens(tx.getTokensAdded());
        walletRepository.save(wallet);
    }

    private TokenDTO.WalletResponse toWalletResponse(TokenWallet w) {
        TokenDTO.WalletResponse r = new TokenDTO.WalletResponse();
        r.setWalletId(w.getId());
        r.setUserId(w.getUser().getId());
        r.setUserName(w.getUser().getFirstName() + " " + w.getUser().getLastName());
        r.setBalance(w.getBalance());
        r.setTotalPurchased(w.getTotalPurchased());
        r.setTotalSpent(w.getTotalSpent());
        r.setUpdatedAt(w.getUpdatedAt());
        return r;
    }

    private TokenDTO.TransactionResponse toTransactionResponse(TokenTransaction t) {
        TokenDTO.TransactionResponse r = new TokenDTO.TransactionResponse();
        r.setId(t.getId());
        r.setUserId(t.getUser().getId());
        r.setUserName(t.getUser().getFirstName() + " " + t.getUser().getLastName());
        r.setAmountPaid(t.getAmountPaid());
        r.setTokensAdded(t.getTokensAdded());
        r.setStatus(t.getStatus());
        r.setPaymongoSessionId(t.getPaymongoSessionId());
        r.setCreatedAt(t.getCreatedAt());
        r.setPaidAt(t.getPaidAt());
        return r;
    }
}