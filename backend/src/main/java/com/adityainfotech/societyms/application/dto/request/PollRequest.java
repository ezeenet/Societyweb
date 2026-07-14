package com.adityainfotech.societyms.application.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public record PollRequest(
    @NotBlank(message = "Question is required")
    @Size(max = 500)
    String question,

    @NotBlank(message = "Option A is required")
    @Size(max = 200)
    String optionA,

    @NotBlank(message = "Option B is required")
    @Size(max = 200)
    String optionB,

    @Size(max = 200)
    String optionC,

    @Size(max = 200)
    String optionD,

    LocalDateTime endsAt
) {}
