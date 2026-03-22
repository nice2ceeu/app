package com.example.demo.repository;

import com.example.demo.model.TokenTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TokenTransactionRepository extends JpaRepository<TokenTransaction, Long> {

    Optional<TokenTransaction> findByPaymongoSessionId(String sessionId);

    Page<TokenTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<TokenTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(TokenTransaction.TransactionStatus status);
}