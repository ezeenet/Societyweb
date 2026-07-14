package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.enums.Role;

/**
 * Payload returned after a successful login.
 *
 * The access token is sent in the response body.
 * The refresh token is sent via Set-Cookie (httpOnly) — NOT included here.
 */
public record AuthResponse(
    String accessToken,
    String username,
    String fullName,
    Role role,
    Long memberId            // null for non-member roles; used by frontend to scope data
) {}
