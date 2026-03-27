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
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

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

        List<Object[]> raw = nearbyLaborRepository.findNearbyLaborsByJobTitle(lat, lng, filter);

        // Split into inside/outside 500m
        List<Object[]> inside500 = raw.stream()
                .filter(row -> ((Number) row[7]).doubleValue() <= 0.5)
                .collect(Collectors.toList());

        // If nobody inside 500m, everyone is LOCKED
        boolean noOneInsideRange = inside500.isEmpty();

        AtomicInteger hirableCount = new AtomicInteger(0);

        List<NearbyLaborDTO> result = raw.stream().map(row -> {
            double distance = ((Number) row[7]).doubleValue();
            boolean insideRange = distance <= 0.5;

            String hireStatus;
            if (noOneInsideRange) {
                hireStatus = "LOCKED";
            } else if (insideRange && hirableCount.get() < 5) {
                hirableCount.incrementAndGet();
                hireStatus = "HIRABLE";
            } else {
                hireStatus = "LOCKED";
            }

            boolean isLocked = hireStatus.equals("LOCKED");

            return NearbyLaborDTO.builder()
                    .userId(isLocked ? null : ((Number) row[0]).longValue())
                    .latitude(((Number) row[1]).doubleValue())
                    .longitude(((Number) row[2]).doubleValue())
                    .firstName(isLocked ? "———" : (String) row[3])
                    .lastName(isLocked ? "———" : (String) row[4])
                    .username(isLocked ? null : (String) row[5])
                    .jobTitle((String) row[6])
                    .distanceKm(((Number) row[7]).doubleValue())
                    .averageStars(row[8] != null ? ((Number) row[8]).doubleValue() : null)
                    .totalRatings(((Number) row[9]).longValue())
                    .hireStatus(hireStatus)
                    .isHirable(hireStatus.equals("HIRABLE"))
                    .build();
        }).toList();

        return result;
    }
}