package com.example.demo.service;

import com.example.demo.dto.NearbyLaborDTO;
import com.example.demo.model.UserLocation;
import com.example.demo.repository.NearbyLaborRepository;
import com.example.demo.repository.UserLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NearbyLaborService {

    private final NearbyLaborRepository nearbyLaborRepository;
    private final UserLocationRepository userLocationRepository;

    public List<NearbyLaborDTO> getNearbyLabor(String employerUsername, String jobTitle) {
        UserLocation employerLocation = userLocationRepository.findByUserUsername(employerUsername)
                .orElseThrow(() -> new IllegalStateException("Your location is not set."));

        if (employerLocation.getLatitude() == null || employerLocation.getLongitude() == null) {
            throw new IllegalStateException("Your location coordinates are incomplete.");
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
                        ((Number) row[7]).doubleValue()
                ))
                .toList();
    }
}