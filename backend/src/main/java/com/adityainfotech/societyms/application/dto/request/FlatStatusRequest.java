package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.FlatStatus;
import jakarta.validation.constraints.*;

public record FlatStatusRequest(
    @NotNull(message = "Status is required")
    FlatStatus status
) {}
