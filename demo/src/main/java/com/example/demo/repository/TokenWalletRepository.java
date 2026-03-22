package com.example.demo.repository;

import com.example.demo.model.TokenWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TokenWalletRepository extends JpaRepository<TokenWallet, Long> {
    Optional<TokenWallet> findByUserId(Long userId);
}