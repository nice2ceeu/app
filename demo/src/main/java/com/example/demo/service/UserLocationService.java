package com.example.demo.service;

import com.example.demo.dto.UserLocationDTO;
import com.example.demo.model.User;
import com.example.demo.model.UserLocation;
import com.example.demo.repository.UserLocationRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserLocationService {

    private final UserLocationRepository userLocationRepository;
    private final UserRepository userRepository;

    // Save or update — upsert by userId
    public UserLocationDTO saveLocation(UserLocationDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserLocation location = userLocationRepository.findByUserId(user.getId())
                .orElse(new UserLocation());

        location.setUser(user);
        location.setLatitude(dto.getLatitude());
        location.setLongitude(dto.getLongitude());

        return toDTO(userLocationRepository.save(location));
    }

    public UserLocationDTO getLocationByUserId(Long userId) {
        UserLocation location = userLocationRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Location not found for user " + userId));
        return toDTO(location);
    }

    private UserLocationDTO toDTO(UserLocation location) {
        UserLocationDTO dto = new UserLocationDTO();
        dto.setUserId(location.getUser().getId());
        dto.setLatitude(location.getLatitude());
        dto.setLongitude(location.getLongitude());
        return dto;
    }
}