package com.liuyansh.controller;
import com.liuyansh.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;
@RestController
@RequestMapping("/api")
public class MessageController {
    private final MessageService messageService;
    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }
    @GetMapping("/messages")
    public ResponseEntity<Map<String, Object>> getMessages() {
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of("items", messageService.getAllMessages())));
    }
    @PostMapping("/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> createMessage(@RequestBody Map<String, String> payload) {
        // In a real app, get user details from SecurityContext
        String userId = "dummy-user-id";
        String phoneMasked = "123****5678";
        return ResponseEntity.ok(Map.of("success", true, "data", messageService.createMessage(payload.get("text"), userId, phoneMasked)));
    }
    @PostMapping("/replies")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> createReply() {
        return ResponseEntity.status(501).body(Map.of("success", false, "error", "Not Implemented"));
    }
    @PutMapping("/likes/{targetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable UUID targetId, @RequestParam String type) {
        String userId = "dummy-user-id";
        boolean liked = messageService.toggleLike(userId, targetId, type);
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of("liked", liked)));
    }
}