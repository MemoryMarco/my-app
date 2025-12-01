package com.liuyansh.service;
import com.liuyansh.entity.AuthUser;
import com.liuyansh.repository.AuthUserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
@Service
public class AuthService {
    private final AuthUserRepository authUserRepository;
    private final SecretKey jwtKey;
    private static final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private static final Map<String, Long> rateLimitStore = new ConcurrentHashMap<>();
    public AuthService(AuthUserRepository authUserRepository, @Value("${jwt.secret}") String secret) {
        this.authUserRepository = authUserRepository;
        this.jwtKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    public Optional<String> requestOtp(String phone) {
        long now = System.currentTimeMillis();
        if (rateLimitStore.getOrDefault(phone, 0L) > now - 60000) {
            return Optional.empty(); // Rate limited
        }
        String code = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
        otpStore.put(phone, code);
        rateLimitStore.put(phone, now);
        return Optional.of(code);
    }
    public Optional<String> verifyOtpAndLogin(String phone, String code) {
        if (code == null || !code.equals(otpStore.get(phone))) {
            return Optional.empty();
        }
        otpStore.remove(phone);
        AuthUser user = authUserRepository.findByPhone(phone)
                .orElseGet(() -> authUserRepository.save(new AuthUser(null, phone)));
        return Optional.of(generateToken(user));
    }
    private String generateToken(AuthUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("phone", user.getPhone())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(7, ChronoUnit.DAYS)))
                .signWith(jwtKey)
                .compact();
    }
}