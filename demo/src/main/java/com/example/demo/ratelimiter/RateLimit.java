package com.example.demo.ratelimiter;

import java.lang.annotation.*;

@Target(ElementType.METHOD) // can only put on methods
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    int requests() default 5;        // max requests
    int durationSeconds() default 60; // time window in seconds
}