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
@RequestMapping("/api/admin/tokens")
@RequiredArgsConstructor
// @PreAuthorize("hasRole('ADMIN')")
public class AdminTokenController {

    private final TokenService tokenService;

    // All transactions across all users
    @GetMapping("/transactions")
    public ResponseEntity<Page<TokenDTO.TransactionResponse>> getAllTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(tokenService.getAllTransactions(
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    // Transactions for a specific user
    @GetMapping("/transactions/user/{userId}")
    public ResponseEntity<Page<TokenDTO.TransactionResponse>> getUserTransactions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(tokenService.getUserHistory(userId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    // View a specific user's wallet balance
    @GetMapping("/wallet/{userId}")
    public ResponseEntity<TokenDTO.WalletResponse> getUserWallet(@PathVariable Long userId) {
        return ResponseEntity.ok(tokenService.getWallet(userId));
    }
}