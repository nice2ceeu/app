package com.example.demo.controller;

import com.example.demo.dto.UserLocationDTO;
import com.example.demo.service.UserLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user-location")
@RequiredArgsConstructor
public class UserLocationController {

    
    private final UserLocationService userLocationService;

    @PostMapping
    public ResponseEntity<UserLocationDTO> saveLocation(@RequestBody UserLocationDTO dto) {
        UserLocationDTO saved = userLocationService.saveLocation(dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserLocationDTO> getLocation(@PathVariable Long userId) {
        UserLocationDTO location = userLocationService.getLocationByUserId(userId);
        return ResponseEntity.ok(location);
    }
}