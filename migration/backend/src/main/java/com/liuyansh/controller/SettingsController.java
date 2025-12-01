package com.liuyansh.controller;
import com.liuyansh.entity.Settings;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Map;
@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private static Settings settings = new Settings("app-settings", "", "mock", "", "", "UTC", null, "[]");
    @GetMapping("/email")
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(Map.of("success", true, "data", settings));
    }
    @PostMapping("/email")
    public ResponseEntity<Map<String, Object>> saveSettings(@RequestBody Settings newSettings) {
        settings.setRecipient(newSettings.getRecipient());
        settings.setProvider(newSettings.getProvider());
        settings.setApiUrl(newSettings.getApiUrl());
        settings.setApiKey(newSettings.getApiKey());
        settings.setTimezone(newSettings.getTimezone());
        return ResponseEntity.ok(Map.of("success", true, "data", settings));
    }
    @PostMapping("/send-weekly")
    public ResponseEntity<Map<String, Object>> sendWeekly() {
        settings.setLastSentTs(Instant.now());
        // In a real app, you would update the logs properly.
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of("status", "Mock send successful", "sentCount", 1)));
    }
}