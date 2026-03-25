package com.example.demo.repository;

import com.example.demo.model.VerificationApplication;
import com.example.demo.model.User;
import com.example.demo.model.UserRole;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VerificationApplicationRepository extends JpaRepository<VerificationApplication, Long> {
    Optional<VerificationApplication> findByUser(User user);
    
    @Query("SELECT a FROM VerificationApplication a WHERE a.user.userRole != :role ORDER BY a.submittedAt DESC")
    List<VerificationApplication> findAllUnverifiedNonAdmin(@Param("role") UserRole role);
}