package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.LoginRequest;
import com.adityainfotech.societyms.application.dto.response.AuthResponse;
import com.adityainfotech.societyms.domain.entity.RefreshToken;
import com.adityainfotech.societyms.domain.entity.User;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.RefreshTokenJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserJpaRepository;
import com.adityainfotech.societyms.infrastructure.security.JwtProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

/**
 * Orchestrates all authentication use cases:
 *
 *  - login()   → validates credentials, issues access + refresh token
 *  - refresh() → validates refresh cookie, issues new access token
 *  - logout()  → revokes all refresh tokens for the user
 *
 * The refresh token travels exclusively via httpOnly Cookie — it never
 * appears in the response JSON body, protecting it from XSS.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final AuthenticationManager authManager;
    private final UserJpaRepository userRepository;
    private final RefreshTokenJpaRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;

    @Value("${app.jwt.refresh-token-expiry-days}")
    private int refreshTokenExpiryDays;

    // ── Login ────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        authenticate(request.username(), request.password());

        User user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!user.getIsActive()) {
            throw new DisabledException("Account is deactivated. Contact your administrator.");
        }

        String accessToken   = jwtProvider.generateAccessToken(user);
        String rawRefreshToken = createAndPersistRefreshToken(user);

        appendRefreshCookie(response, rawRefreshToken);
        userRepository.updateLastLogin(user.getId());

        log.info("User '{}' logged in with role {}", user.getUsername(), user.getRole());

        return new AuthResponse(
            accessToken,
            user.getUsername(),
            user.getFullName(),
            user.getRole(),
            user.getMemberId()
        );
    }

    // ── Refresh ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = extractRefreshCookie(request)
            .orElseThrow(() -> new BadCredentialsException("Refresh token not found"));

        RefreshToken stored = refreshTokenRepository.findByToken(rawToken)
            .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (!stored.isValid()) {
            refreshTokenRepository.revokeAllByUserId(stored.getUser().getId());
            throw new BadCredentialsException("Refresh token expired or revoked. Please login again.");
        }

        // Rotate: revoke old, issue new (prevents refresh token reuse attacks)
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        String newAccessToken    = jwtProvider.generateAccessToken(user);
        String newRawRefreshToken = createAndPersistRefreshToken(user);

        appendRefreshCookie(response, newRawRefreshToken);

        return new AuthResponse(
            newAccessToken,
            user.getUsername(),
            user.getFullName(),
            user.getRole(),
            user.getMemberId()
        );
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        extractRefreshCookie(request).ifPresent(token ->
            refreshTokenRepository.findByToken(token).ifPresent(stored -> {
                refreshTokenRepository.revokeAllByUserId(stored.getUser().getId());
                log.info("User '{}' logged out — all refresh tokens revoked", stored.getUser().getUsername());
            })
        );
        clearRefreshCookie(response);
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private void authenticate(String username, String password) {
        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );
        } catch (AuthenticationException e) {
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    private String createAndPersistRefreshToken(User user) {
        String rawToken = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(refreshTokenExpiryDays, ChronoUnit.DAYS);

        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .token(rawToken)
            .expiresAt(expiresAt)
            .revoked(false)
            .build();

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    private void appendRefreshCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, token);
        cookie.setHttpOnly(true);              // Inaccessible to JavaScript (XSS-proof)
        cookie.setSecure(false);               // Set to true in production (HTTPS only)
        cookie.setPath("/api/v1/auth");        // Scoped to auth endpoints only
        cookie.setMaxAge(refreshTokenExpiryDays * 24 * 60 * 60);
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge(0);                   // Immediately expire the cookie
        response.addCookie(cookie);
    }

    private Optional<String> extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
            .filter(c -> REFRESH_COOKIE_NAME.equals(c.getName()))
            .map(Cookie::getValue)
            .findFirst();
    }

}
