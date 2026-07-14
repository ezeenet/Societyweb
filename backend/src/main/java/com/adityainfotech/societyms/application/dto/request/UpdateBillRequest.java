package com.adityainfotech.societyms.application.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateBillRequest(
    BigDecimal amount,
    BigDecimal lateFine,
    LocalDate dueDate
) {}