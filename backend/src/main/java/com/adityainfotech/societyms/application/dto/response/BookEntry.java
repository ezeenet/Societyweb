package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BookEntry(
    LocalDate date,
    String particulars,
    String voucherType,
    BigDecimal receipts,
    BigDecimal payments,
    BigDecimal balance
) {}
