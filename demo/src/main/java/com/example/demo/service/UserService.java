package com.example.demo.service;

import com.example.demo.dto.UpdatePasswordDTO;
import com.example.demo.dto.UpdateProfileDTO;
import com.example.demo.dto.UserProfileDTO;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // ── Create ──────────────────────────────────────────────

    public User createUser(User user) {
        String firstName = user.getFirstName();
        String lastName  = user.getLastName();
        String username  = user.getUsername();
        String password  = user.getPassword();
        String address   = user.getAddress();

        if (firstName == null || firstName.length() <= 3)
            throw new IllegalArgumentException("First name must be longer than 3 characters");
        if (lastName == null || lastName.length() <= 2)
            throw new IllegalArgumentException("Last name must be longer than 2 characters");
        if (username == null || username.length() < 6)
            throw new IllegalArgumentException("Username must be at least 6 characters");
        if (password == null || password.length() <= 8)
            throw new IllegalArgumentException("Password must be longer than 8 characters");
        if (address == null || address.length() <= 8)
            throw new IllegalArgumentException("Address must be longer than 8 characters");

        if (userRepo.findByUsername(username).isPresent())
            throw new IllegalArgumentException("Username already exists. Please choose a different name.");

        user.setPassword(passwordEncoder.encode(password));
        return userRepo.save(user);
    }

    // ── Read ─────────────────────────────────────────────────

    public Optional<User> getUserById(Long id) {
        return userRepo.findById(id);
    }

    public User findByUsername(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserProfileDTO getProfile(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDTO(user);
    }

    public String role(String username) {
        return findByUsername(username).getUserRole().name();
    }


    public UserProfileDTO updateProfile(Long id, UpdateProfileDTO dto) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getFirstName() != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName()  != null) user.setLastName(dto.getLastName());
        if (dto.getUsername()  != null) user.setUsername(dto.getUsername());
        if (dto.getAddress()   != null) user.setAddress(dto.getAddress());
        if (dto.getJobTitle()  != null) user.setJobTitle(dto.getJobTitle());

        return toDTO(userRepo.save(user));
    }

    public void updatePassword(Long id, UpdatePasswordDTO dto) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword()))
            throw new RuntimeException("Incorrect current password");

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepo.save(user);
    }

    // ── Auth ─────────────────────────────────────────────────

    public String login(String username, String rawPassword) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword()))
            throw new IllegalArgumentException("Invalid password");

        return JwtUtil.generateToken(user.getUsername());
    }

    public String validateTokenAndGetUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new IllegalArgumentException("Missing or invalid Authorization header");

        return JwtUtil.validateToken(authHeader.substring(7));
    }

    public void signOut(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwt", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }



    private UserProfileDTO toDTO(User user) {
        UserProfileDTO.LocationDTO locationDTO = null;
        if (user.getLocation() != null) {
            locationDTO = new UserProfileDTO.LocationDTO(
                user.getLocation().getLatitude(),
                user.getLocation().getLongitude()
            );
        }
        return new UserProfileDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getUsername(),
                user.getAddress(),
                user.getJobTitle(),
                user.getUserRole(),
                user.getVerified(),
                locationDTO
        );
    }
    public UserProfileDTO getProfile(String username) {
        User user = findByUsername(username);
        return toDTO(user);
    }

}
