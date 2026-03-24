package com.example.demo.controller;

import com.example.demo.dto.TokenDTO;
import com.example.demo.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tokens")
@RequiredArgsConstructor
public class TokenController {

    private final TokenService tokenService;

    // ── POST /api/tokens/checkout ─────────────────────────────────────────────
    @PostMapping("/checkout")
    public ResponseEntity<TokenDTO.CheckoutResponse> createCheckout(
            @RequestBody TokenDTO.CheckoutRequest request) {
        return ResponseEntity.ok(tokenService.createCheckout(request));
    }

    // ── GET /api/tokens/wallet/{userId} ───────────────────────────────────────
    // Returns current token balance for the logged-in user
    @GetMapping("/wallet/{userId}")
    public ResponseEntity<TokenDTO.WalletResponse> getWallet(@PathVariable Long userId) {
        return ResponseEntity.ok(tokenService.getWallet(userId));
    }

    // ── GET /api/tokens/history/{userId} ─────────────────────────────────────
    // Full top-up history for a user
    @GetMapping("/history/{userId}")
    public ResponseEntity<Page<TokenDTO.TransactionResponse>> getHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(tokenService.getUserHistory(userId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }


    @PostMapping("/hire")
    public ResponseEntity<Void> hire(@RequestBody TokenDTO.HireRequest request) {
        tokenService.processHire(request.getEmployerId(), request.getWorkerId());
        return ResponseEntity.ok().build();
    }
}