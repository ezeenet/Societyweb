package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.EntryType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AccountEntryRequest(

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    String title,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    BigDecimal amount,

    @NotNull(message = "Entry type is required")
    EntryType entryType,

    @NotBlank(message = "Category is required")
    @Size(max = 100)
    String category,

    @Size(max = 100)
    String subCategory,

    @Size(max = 5000)
    String description,

    @NotNull(message = "Date is required")
    LocalDate entryDate,

    @Size(max = 100)
    String reference

) {}
