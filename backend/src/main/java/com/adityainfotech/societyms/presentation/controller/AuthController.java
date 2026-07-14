package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.LoginRequest;
import com.adityainfotech.societyms.application.dto.response.ApiResponse;
import com.adityainfotech.societyms.application.dto.response.AuthResponse;
import com.adityainfotech.societyms.application.service.AuthService;
import com.adityainfotech.societyms.domain.entity.User;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Handles authentication lifecycle: login, refresh, logout, and profile.
 *
 * All endpoints prefixed: /api/v1/auth
 * Public endpoints: /login, /refresh
 * Protected endpoint: /logout, /me (require valid access token)
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, token refresh, and logout")
public class AuthController {

    private final AuthService authService;
    private final UserJpaRepository userRepository;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and issue JWT tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.login(request, response);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Login successful"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Silently renew access token using httpOnly refresh cookie")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.refresh(request, response);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Token refreshed"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke all refresh tokens for the current user")
    public ResponseEntity<ApiResponse<Void>> logout(
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        authService.logout(request, response);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user profile")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(
        @AuthenticationPrincipal UserDetails principal
    ) {
        User user = userRepository.findByUsername(principal.getUsername())
            .orElseThrow();

        AuthResponse profile = new AuthResponse(
            null,   // No new token issued here
            user.getUsername(),
            user.getFullName(),
            user.getRole(),
            user.getMemberId()
        );

        return ResponseEntity.ok(ApiResponse.success(profile));
    }

}
