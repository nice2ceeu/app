package com.example.demo.ratelimiter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Aspect
@Component
public class RateLimitAspect {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final HttpServletRequest request;

    public RateLimitAspect(HttpServletRequest request) {
        this.request = request;
    }

    @Around("@annotation(rateLimit)")
    public Object limit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        String ip = request.getRemoteAddr();
        String key = ip + ":" + joinPoint.getSignature().toShortString();

        Bucket bucket = buckets.computeIfAbsent(key, k -> createBucket(rateLimit.requests(), rateLimit.durationSeconds()));

        if (bucket.tryConsume(1)) {
            return joinPoint.proceed();
        } else {
            // Returns proper HTTP 429 Too Many Requests
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Try again later.");
        }
    }

    private Bucket createBucket(int requests, int durationSeconds) {
    Bandwidth limit = Bandwidth.builder()
            .capacity(requests)
            .refillGreedy(requests, Duration.ofSeconds(durationSeconds))
            .build();

    return Bucket.builder()
            .addLimit(limit)
            .build();
}
}