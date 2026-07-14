package com.adityainfotech.societyms.infrastructure.security;

import com.adityainfotech.societyms.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
@Slf4j
public class JwtProvider {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        log.info("JwtProvider ready — key: {} bytes", keyBytes.length);
    }

    // ── Generate — accepts User entity (used by AuthService) ─────────────────

    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole() != null ? user.getRole().name() : "");
        claims.put("fullName", user.getFullName() != null ? user.getFullName() : "");
        return buildToken(claims, user.getUsername(), accessTokenExpiryMs);
    }

    // ── Generate — accepts UserDetails (used by other places) ────────────────

    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", userDetails.getAuthorities().stream()
            .findFirst()
            .map(a -> a.getAuthority())
            .orElse(""));
        return buildToken(claims, userDetails.getUsername(), accessTokenExpiryMs);
    }

    public String generateToken(String username) {
        return buildToken(Map.of(), username, accessTokenExpiryMs);
    }

    public String generateToken(String username, Map<String, Object> extraClaims) {
        return buildToken(extraClaims, username, accessTokenExpiryMs);
    }

    private String buildToken(Map<String, Object> claims, String subject, long expiryMs) {
        return Jwts.builder()
            .claims(claims)
            .subject(subject)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiryMs))
            .signWith(signingKey)
            .compact();
    }

    // ── Validate ──────────────────────────────────────────────────────────────

    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return !isExpired(token);
        } catch (Exception e) {
            log.warn("JWT invalid: {}", e.getMessage());
            return false;
        }
    }

    public boolean validateToken(String token) {
        return isTokenValid(token);
    }

    public boolean isExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ── Extract ───────────────────────────────────────────────────────────────

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
