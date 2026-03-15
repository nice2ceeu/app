package com.example.demo.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;

public class JwtUtil {

    // Fixed secret key (read from environment variable or properties in production)
    private static final String SECRET = System.getenv().getOrDefault("JWT_SECRET",
            "default-256-bit-secret-key-change-this");
    private static final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    private static final long EXPIRATION = 1000 * 60 * 60; // 1 hour

    // Generate JWT for a username
    public static String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(key)
                .compact();
    }

    // Validate JWT and return username
    public static String validateToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid or expired JWT token");
        }
    }
}