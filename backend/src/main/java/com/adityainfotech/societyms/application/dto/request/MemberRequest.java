package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.MemberType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MemberRequest(
    @NotBlank(message = "Full name is required")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    String fullName,

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
    String mobile,

    @Email(message = "Enter a valid email address")
    @Size(max = 100)
    String email,

    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be exactly 12 digits")
    String aadharNumber,

    MemberType memberType,

    @NotNull(message = "Flat is required")
    Long flatId,

    LocalDate moveInDate,

    @Size(max = 20)
    String vehicleNumber,

    @Size(max = 20)
    String parkingSlot,

    @DecimalMin(value = "0.0", inclusive = true, message = "Opening balance cannot be negative")
    BigDecimal openingBalance,
    @DecimalMin(value = "0.0", inclusive = true, message = "Share capital cannot be negative")
    BigDecimal shareCapital
) {}