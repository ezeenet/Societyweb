package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.ComplaintStatus;
import jakarta.validation.constraints.*;

public record ComplaintStatusRequest(
    @NotNull(message = "Status is required")
    ComplaintStatus status,

    @Size(max = 500)
    String remarks
) {}
