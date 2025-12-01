package com.liuyansh.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "settings")
public class Settings {
    @Id
    private String id = "app-settings";
    private String recipient;
    private String provider;
    private String apiUrl;
    @Column(length = 1024)
    private String apiKey;
    private String timezone;
    private Instant lastSentTs;
    @Column(columnDefinition = "TEXT")
    private String sendLogs; // Storing as JSON string for simplicity
}