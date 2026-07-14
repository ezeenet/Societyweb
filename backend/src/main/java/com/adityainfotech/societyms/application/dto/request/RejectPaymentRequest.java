package com.adityainfotech.societyms.application.dto.request;

import jakarta.validation.constraints.*;

public record RejectPaymentRequest(
    @NotBlank(message = "Rejection reason is required")
    @Size(max = 300)
    String reason
) {}
