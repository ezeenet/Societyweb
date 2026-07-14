package com.adityainfotech.societyms.application.dto.request;

import jakarta.validation.constraints.*;

public record VoteRequest(
    @NotBlank(message = "Selected option is required")
    @Pattern(regexp = "^[ABCD]$", message = "Option must be A, B, C, or D")
    String selectedOption,

    @NotNull(message = "Member ID is required")
    Long memberId
) {}
