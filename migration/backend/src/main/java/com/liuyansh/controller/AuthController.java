package com.liuyansh.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    // In-memory store for OTPs and rate limits for demo purposes.
    // In production, use Redis or a database.
    private static final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private static final Map<String, Long> rateLimitStore = new ConcurrentHashMap<>();
    @PostMapping("/request-otp")
    public ResponseEntity<Map<String, Object>> requestOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.get("phone");
        if (phone == null || !phone.matches("^\\d{11}$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid phone number format."));
        }
        long now = System.currentTimeMillis();
        if (rateLimitStore.getOrDefault(phone, 0L) > now - 60000) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Too many requests. Please wait 60 seconds."));
        }
        String code = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
        otpStore.put(phone, code);
        rateLimitStore.put(phone, now);
        // In a real app, you would send the OTP via an SMS gateway.
        // For this demo, we return it in the response.
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of("demoCode", code)));
    }
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.get("phone");
        String code = payload.get("code");
        if (phone == null || code == null || !code.equals(otpStore.get(phone))) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid or expired code."));
        }
        otpStore.remove(phone); // OTP is single-use
        // In a real app, you would find or create a user, then generate a JWT.
        // For this demo, we'll simulate it.
        String token = "demo-jwt-token-for-" + phone;
        Map<String, String> user = Map.of("id", "user:" + phone, "phone", phone);
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of("token", token, "user", user)));
    }
}