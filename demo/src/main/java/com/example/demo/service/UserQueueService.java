package com.example.demo.service;


import com.example.demo.model.User;
import com.example.demo.model.UserLocation;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserLocationRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.demo.model.TokenWallet;
import com.example.demo.repository.TokenWalletRepository;
@Service
@RequiredArgsConstructor
public class UserQueueService {

    private final UserRepository userRepository;
    private final UserLocationRepository userLocationRepository;
    private final TokenWalletRepository walletRepository;
    public void setReadyForNearbyWork(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found."));
    
        if (!Boolean.TRUE.equals(user.getVerified())) {
            throw new IllegalStateException("Account is not verified.");
        }
    
        if (Boolean.TRUE.equals(user.getHired())) {
            user.setVisible(false);
            userRepository.save(user);
            throw new IllegalStateException("You are currently hired and cannot be set as available.");
        }
    
        UserLocation location = userLocationRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Location has not been set."));
    
        if (location.getLatitude() == null || location.getLongitude() == null) {
            throw new IllegalStateException("Location coordinates are incomplete.");
        }
    
        TokenWallet wallet = walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Wallet not found. Please top up first."));
    
        if (wallet.getBalance() < 3) {
            throw new IllegalStateException("Insufficient tokens. Minimum 3 tokens required to go visible.");
        }
    
        user.setVisible(true);
        userRepository.save(user);
    }

    public void cancelReadyForNearbyWork(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found."));
        user.setVisible(false);
        userRepository.save(user);
    }
    public boolean getVisibility(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found."));
        return Boolean.TRUE.equals(user.getVisible());
    }

    
}