package com.adityainfotech.societyms.application.dto.request;

import jakarta.validation.constraints.*;

public record AcknowledgeRequest(
    @NotNull(message = "Member ID is required")
    Long memberId
) {}
