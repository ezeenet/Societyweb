package com.adityainfotech.societyms.application.dto.request;

import jakarta.validation.constraints.*;

public record VisitorRequest(
    @NotBlank(message = "Visitor name is required")
    @Size(max = 200)
    String visitorName,

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number")
    String mobile,

    @Size(max = 200)
    String purpose,

    @NotNull(message = "Flat is required")
    Long flatId,

    Long hostMemberId,

    @Size(max = 20)
    String vehicleNo
) {}
