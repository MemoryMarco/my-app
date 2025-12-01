package com.liuyansh.controller;
import com.liuyansh.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    @PostMapping("/request-otp")
    public ResponseEntity<Map<String, Object>> requestOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.get("phone");
        if (phone == null || !phone.matches("^\\d{11}$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid phone number format."));
        }
        return authService.requestOtp(phone)
                .map(code -> ResponseEntity.ok(Map.of("success", true, "data", Map.of("demoCode", code))))
                .orElse(ResponseEntity.badRequest().body(Map.of("success", false, "error", "Too many requests. Please wait 60 seconds.")));
    }
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.get("phone");
        String code = payload.get("code");
        return authService.verifyOtpAndLogin(phone, code)
                .map(token -> {
                    Map<String, String> user = Map.of("id", "user:" + phone, "phone", phone);
                    return ResponseEntity.ok(Map.of("success", true, "data", Map.of("token", token, "user", user)));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid or expired code.")));
    }
}