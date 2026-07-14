package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.NoticeCategory;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record NoticeRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200)
    String title,

    @Size(max = 10000)
    String content,

    NoticeCategory category,

    LocalDate expiresAt
) {}
