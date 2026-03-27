package com.example.demo.repository;

import com.example.demo.model.User;
import com.example.demo.model.UserRole;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    List<User> findByUserRoleNot(UserRole userRole);
    @Modifying
    @Query("UPDATE User u SET u.upgraded = true WHERE u.id = :userId")
    void upgradeUser(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE User u SET u.upgraded = false WHERE u.id = :userId")
    void downgradeUser(@Param("userId") Long userId);

}
