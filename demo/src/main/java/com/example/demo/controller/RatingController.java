package com.example.demo.controller;

import com.example.demo.dto.RatingRequestDTO;
import com.example.demo.dto.RatingResponseDTO;
import com.example.demo.dto.WorkerRatingSummaryDTO;
import com.example.demo.model.User;
import com.example.demo.ratelimiter.RateLimit;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.RatingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;
    private final UserRepository userRepository;
    @RateLimit(requests = 5, durationSeconds = 60)
    @PostMapping
    public ResponseEntity<RatingResponseDTO> submitRating(
        @Valid @RequestBody RatingRequestDTO request,
        @RequestParam("workerId") Long workerId,
        HttpServletRequest httpRequest
    ) {
        User employer = resolveCurrentUser(httpRequest);
        User worker = userRepository.findById(workerId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Worker not found."
            ));

        RatingResponseDTO response = ratingService.submitRating(request, employer, worker);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @RateLimit(requests = 20, durationSeconds = 60)
    @GetMapping("/worker/{workerId}")
    public ResponseEntity<WorkerRatingSummaryDTO> getWorkerRatings(
        @PathVariable Long workerId
    ) {
        return ResponseEntity.ok(ratingService.getWorkerSummary(workerId));
    }
    @RateLimit(requests = 20, durationSeconds = 60)
    @GetMapping("/check/{hireId}")
    public ResponseEntity<Map<String, Boolean>> checkRated(
        @PathVariable Long hireId
    ) {
        boolean rated = ratingService.isAlreadyRated(hireId);
        return ResponseEntity.ok(Map.of("rated", rated));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private User resolveCurrentUser(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Authenticated user not found."
            ));
    }
}