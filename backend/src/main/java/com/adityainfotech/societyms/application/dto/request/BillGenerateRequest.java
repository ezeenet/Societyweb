package com.adityainfotech.societyms.application.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record BillGenerateRequest(
    @NotBlank(message = "Bill month is required")
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Month must be in YYYY-MM format")
    String billMonth,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.0", message = "Amount must be greater than 0")
    BigDecimal amount,

    @NotNull(message = "Due date is required")
    LocalDate dueDate
) {}
