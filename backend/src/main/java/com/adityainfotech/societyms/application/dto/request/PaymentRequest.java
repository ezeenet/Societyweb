package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.PaymentMode;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
    @NotNull(message = "Bill ID is required")
    Long billId,

    @NotNull(message = "Member ID is required")
    Long memberId,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.0", message = "Amount must be greater than 0")
    BigDecimal amountPaid,

    @NotNull(message = "Payment date is required")
    LocalDate paymentDate,

    @NotNull(message = "Payment mode is required")
    PaymentMode paymentMode,

    @Size(max = 100)
    String referenceNo,

    @Size(max = 500)
    String remarks
) {}
