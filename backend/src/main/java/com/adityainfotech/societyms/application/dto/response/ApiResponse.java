package com.adityainfotech.societyms.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Unified API response envelope.
 *
 * All endpoints return this shape so the frontend can handle responses
 * predictably without per-endpoint parsing logic.
 *
 * Success:  { "status": "success", "data": {...}, "message": "..." }
 * Error:    { "status": "error",   "code": "...", "message": "...", "errors": [...] }
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final String status;
    private final T data;
    private final String message;
    private final String code;
    private final LocalDateTime timestamp;

    private ApiResponse(String status, T data, String message, String code) {
        this.status = status;
        this.data = data;
        this.message = message;
        this.code = code;
        this.timestamp = LocalDateTime.now();
    }

    // ── Factory methods ──────────────────────────────────────────────────────

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("success", data, null, null);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>("success", data, message, null);
    }

    public static <T> ApiResponse<T> error(String message, String code) {
        return new ApiResponse<>("error", null, message, code);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>("error", null, message, "GENERAL_ERROR");
    }

}
