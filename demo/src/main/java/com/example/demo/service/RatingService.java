package com.example.demo.service;

import com.example.demo.dto.RatingRequestDTO;
import com.example.demo.dto.RatingResponseDTO;
import com.example.demo.dto.WorkerRatingSummaryDTO;
import com.example.demo.model.Rating;
import com.example.demo.model.User;
import com.example.demo.repository.RatingRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;

    // ── Submit a rating after ending a contract ──────────────────────────────

    @Transactional
    public RatingResponseDTO submitRating(RatingRequestDTO request, User employer, User worker) {

        // Guard: one rating per hire
        if (ratingRepository.existsByHireId(request.getHireId())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "A rating for this contract already exists."
            );
        }

        // Guard: stars must be 1–5 (also validated by @Valid on the controller,
        // but double-checked here as a service-layer safeguard)
        if (request.getStars() < 1 || request.getStars() > 5) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Stars must be between 1 and 5."
            );
        }

        Rating rating = new Rating();
        rating.setHireId(request.getHireId());
        rating.setWorker(worker);
        rating.setEmployer(employer);
        rating.setStars(request.getStars());
        rating.setComment(
            request.getComment() != null ? request.getComment().trim() : null
        );

        Rating saved = ratingRepository.save(rating);
        return toResponse(saved);
    }

    // ── Get all ratings + summary for a worker ───────────────────────────────

    @Transactional(readOnly = true)
    public WorkerRatingSummaryDTO getWorkerSummary(Long workerId) {
        User worker = userRepository.findById(workerId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Worker not found."
            ));

        List<RatingResponseDTO> reviews = ratingRepository
            .findByWorkerId(workerId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());

        Double avg = ratingRepository.findAverageStarsByWorkerId(workerId);
        long count = ratingRepository.countByWorkerId(workerId);

        return new WorkerRatingSummaryDTO(
            workerId,
            worker.getFirstName() + " " + worker.getLastName(),
            avg != null ? Math.round(avg * 10.0) / 10.0 : null, // round to 1 decimal
            count,
            reviews
        );
    }

    // ── Check if a hire has already been rated (used by the frontend) ─────────

    @Transactional(readOnly = true)
    public boolean isAlreadyRated(Long hireId) {
        return ratingRepository.existsByHireId(hireId);
    }

    // ── Helper: entity → DTO ─────────────────────────────────────────────────

    private RatingResponseDTO toResponse(Rating r) {
        return new RatingResponseDTO(
            r.getId(),
            r.getHireId(),
            r.getWorker().getId(),
            r.getWorker().getFirstName() + " " + r.getWorker().getLastName(),
            r.getEmployer().getId(),
            r.getEmployer().getFirstName() + " " + r.getEmployer().getLastName(),
            r.getStars(),
            r.getComment(),
            r.getCreatedAt()
        );
    }
}