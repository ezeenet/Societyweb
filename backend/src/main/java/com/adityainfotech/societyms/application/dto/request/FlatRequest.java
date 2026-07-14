package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.FlatType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record FlatRequest(
    @NotNull(message = "Wing is required")
    Long wingId,

    @NotBlank(message = "Flat number is required")
    @Size(max = 20, message = "Flat number must not exceed 20 characters")
    String flatNumber,

    @Min(value = 0, message = "Floor number cannot be negative")
    Integer floorNumber,

    FlatType flatType,

    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    BigDecimal areaSqft
) {}
