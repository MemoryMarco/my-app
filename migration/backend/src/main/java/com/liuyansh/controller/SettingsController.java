package com.liuyansh.controller;
import com.liuyansh.entity.Settings;
import com.liuyansh.repository.SettingsRepository;
import com.liuyansh.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final SettingsRepository settingsRepository;
    private final EmailService emailService;
    public SettingsController(SettingsRepository settingsRepository, EmailService emailService) {
        this.settingsRepository = settingsRepository;
        this.emailService = emailService;
    }
    @GetMapping("/email")
    public ResponseEntity<Map<String, Object>> getSettings() {
        Settings settings = settingsRepository.findById("app-settings").orElse(new Settings());
        return ResponseEntity.ok(Map.of("success", true, "data", settings));
    }
    @PostMapping("/email")
    public ResponseEntity<Map<String, Object>> saveSettings(@RequestBody Settings newSettings) {
        newSettings.setId("app-settings");
        Settings savedSettings = settingsRepository.save(newSettings);
        return ResponseEntity.ok(Map.of("success", true, "data", savedSettings));
    }
    @PostMapping("/send-weekly")
    public ResponseEntity<Map<String, Object>> sendWeekly() {
        emailService.sendWeeklyEmail();
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of("status", "Email job triggered.", "sentCount", -1)));
    }
}