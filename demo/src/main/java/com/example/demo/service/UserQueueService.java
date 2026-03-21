package com.example.demo.service;


import com.example.demo.model.User;
import com.example.demo.model.UserLocation;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserLocationRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
@Service
@RequiredArgsConstructor
public class UserQueueService {

    private final UserRepository userRepository;
    private final UserLocationRepository userLocationRepository;

    public void setReadyForNearbyWork(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (!Boolean.TRUE.equals(user.getVerified())) {
            throw new IllegalStateException("Account is not verified.");
        }

        UserLocation location = userLocationRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Location has not been set."));

        if (location.getLatitude() == null || location.getLongitude() == null) {
            throw new IllegalStateException("Location coordinates are incomplete.");
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