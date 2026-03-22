package com.example.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayMongoService {

    @Value("${paymongo.secret-key}")
    private String secretKey;

    @Value("${paymongo.success-url}")
    private String successUrl;

    @Value("${paymongo.cancel-url}")
    private String cancelUrl;

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String PAYMONGO_BASE = "https://api.paymongo.com/v1";

    /**
     * Creates a PayMongo checkout session.
     *
     * @param amountInPHP  e.g. 100 (will be converted to centavos: 10000)
     * @param description  shown on the checkout page
     * @return             the full JsonNode response from PayMongo
     */
    public JsonNode createCheckoutSession(int amountInPHP, String description) {
        try {
            int amountInCentavos = amountInPHP * 100;

            String json = objectMapper.writeValueAsString(java.util.Map.of(
                "data", java.util.Map.of(
                    "attributes", java.util.Map.of(
                        "send_email_receipt", true,
                        "show_description", true,
                        "show_line_items", true,
                        "line_items", java.util.List.of(
                            java.util.Map.of(
                                "currency", "PHP",
                                "name", description,
                                "quantity", 1,
                                "amount", amountInCentavos
                            )
                        ),
                        "payment_method_types", java.util.List.of(
                            "gcash", "paymaya", "shopee_pay"
                        ),
                        "success_url", successUrl,
                        "cancel_url", cancelUrl
                    )
                )
            ));

            RequestBody body = RequestBody.create(
                MediaType.parse("application/json"), json);

            Request request = new Request.Builder()
                .url(PAYMONGO_BASE + "/checkout_sessions")
                .post(body)
                .addHeader("accept", "application/json")
                .addHeader("Content-Type", "application/json")
                .addHeader("authorization", buildAuthHeader())
                .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body().string();
                if (!response.isSuccessful()) {
                    log.error("PayMongo error: {}", responseBody);
                    throw new RuntimeException("PayMongo checkout session creation failed: " + responseBody);
                }
                return objectMapper.readTree(responseBody);
            }

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create PayMongo checkout session", e);
        }
    }

    /**
     * Fetches a checkout session by ID to verify its payment status.
     * Used when PayMongo calls our webhook or when user returns to success_url.
     */
    public JsonNode getCheckoutSession(String sessionId) {
        try {
            Request request = new Request.Builder()
                .url(PAYMONGO_BASE + "/checkout_sessions/" + sessionId)
                .get()
                .addHeader("accept", "application/json")
                .addHeader("authorization", buildAuthHeader())
                .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body().string();
                if (!response.isSuccessful()) {
                    throw new RuntimeException("Failed to fetch PayMongo session: " + responseBody);
                }
                return objectMapper.readTree(responseBody);
            }

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch PayMongo checkout session", e);
        }
    }

    // Base64-encode "secretKey:" for Basic auth
    private String buildAuthHeader() {
        String credentials = secretKey + ":";
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes());
    }
}