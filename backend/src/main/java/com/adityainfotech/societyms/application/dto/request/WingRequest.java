package com.adityainfotech.societyms.application.dto.request;

import jakarta.validation.constraints.*;

public record WingRequest(
    @NotBlank(message = "Wing name is required")
    @Size(min = 1, max = 100, message = "Wing name must be between 1 and 100 characters")
    String name
) {}
