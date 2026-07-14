package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LedgerRow(
    LocalDate date,
    String description,
    BigDecimal debit,
    BigDecimal credit,
    BigDecimal balance,
    String type,
    String reference
) {}
