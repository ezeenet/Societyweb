package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.ComplaintCategory;
import jakarta.validation.constraints.*;

public record ComplaintRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200)
    String title,

    @Size(max = 2000)
    String description,

    ComplaintCategory category,

    @NotNull(message = "Member ID is required")
    Long memberId
) {}
