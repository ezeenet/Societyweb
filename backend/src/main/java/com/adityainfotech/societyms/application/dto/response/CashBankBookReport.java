package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CashBankBookReport(
    String bookType,
    LocalDate from,
    LocalDate to,
    BigDecimal openingBalance,
    List<BookEntry> entries,
    BigDecimal totalReceipts,
    BigDecimal totalPayments,
    BigDecimal closingBalance
) {}
