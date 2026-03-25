package com.example.demo.service;
import com.example.demo.model.User;
import com.example.demo.dto.NearbyLaborDTO;
import com.example.demo.model.TokenWallet;
import com.example.demo.model.UserLocation;
import com.example.demo.repository.NearbyLaborRepository;
import com.example.demo.repository.TokenWalletRepository;
import com.example.demo.repository.UserLocationRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NearbyLaborService {
    private final NearbyLaborRepository nearbyLaborRepository;
    private final UserLocationRepository userLocationRepository;
    private final TokenWalletRepository walletRepository;
    
    public List<NearbyLaborDTO> getNearbyLabor(String employerUsername, String jobTitle) {

        UserLocation employerLocation = userLocationRepository.findByUserUsername(employerUsername)
                .orElseThrow(() -> new IllegalStateException("Your location is not set."));
    
        User user = employerLocation.getUser();
    
        if (!Boolean.TRUE.equals(user.getVerified())) {
            throw new IllegalStateException("Account is not verified.");
        }
    
        if (employerLocation.getLatitude() == null || employerLocation.getLongitude() == null) {
            throw new IllegalStateException("Your location coordinates are incomplete.");
        }
    
        TokenWallet wallet = walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Wallet not found. Please top up first."));
    
        if (wallet.getBalance() < 3) {
            throw new IllegalStateException("Insufficient tokens. Minimum 3 tokens required to search for workers.");
        }

        double lat = employerLocation.getLatitude().doubleValue();
        double lng = employerLocation.getLongitude().doubleValue();

        String filter = (jobTitle != null && !jobTitle.isBlank()) ? jobTitle : "";

        return nearbyLaborRepository.findNearbyLaborsByJobTitle(lat, lng, filter)
        .stream()
        .map(row -> new NearbyLaborDTO(
                ((Number) row[0]).longValue(),
                ((Number) row[1]).doubleValue(),
                ((Number) row[2]).doubleValue(),
                (String) row[3],
                (String) row[4],
                (String) row[5],
                (String) row[6],
                ((Number) row[7]).doubleValue(),
                row[8] != null ? ((Number) row[8]).doubleValue() : null,
                row[9] != null ? ((Number) row[9]).longValue() : 0L,
                row[10] != null && (Boolean) row[10]
        ))
    .toList();
    }
}