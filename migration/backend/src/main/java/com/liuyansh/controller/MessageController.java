package com.liuyansh.controller;
import com.liuyansh.entity.Message;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
@RestController
@RequestMapping("/api")
public class MessageController {
    // Using in-memory list for demo. Replace with service and repository in a real app.
    private static final List<Message> messages = new ArrayList<>();
    static {
        Message msg1 = new Message(UUID.randomUUID(), "demo-user-1", "138****1234", "欢���来到「留声」。这是一个注重视觉与交互体验���留言板。", Instant.now().minusSeconds(86400), 1, new ArrayList<>(), new ArrayList<>());
        messages.add(msg1);
    }
    @GetMapping("/messages")
    public ResponseEntity<Map<String, Object>> getMessages() {
        // In a real app, this would involve complex queries to build the reply tree.
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of("items", messages)));
    }
    @PostMapping("/messages")
    public ResponseEntity<Map<String, Object>> createMessage(@RequestBody Map<String, String> payload, @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }
        // Dummy auth check
        String phone = authHeader.split("-")[3];
        String phoneMasked = phone.substring(0, 3) + "****" + phone.substring(7);
        Message newMessage = new Message(UUID.randomUUID(), "user:" + phone, phoneMasked, payload.get("text"), Instant.now(), 0, new ArrayList<>(), new ArrayList<>());
        messages.add(0, newMessage);
        return ResponseEntity.ok(Map.of("success", true, "data", newMessage));
    }
    // Dummy endpoints for replies and likes
    @PostMapping("/replies")
    public ResponseEntity<Map<String, Object>> createReply() {
        return ResponseEntity.status(501).body(Map.of("success", false, "error", "Not Implemented"));
    }
    @PutMapping("/likes/{targetId}")
    public ResponseEntity<Map<String, Object>> toggleLike() {
        return ResponseEntity.status(501).body(Map.of("success", false, "error", "Not Implemented"));
    }
}