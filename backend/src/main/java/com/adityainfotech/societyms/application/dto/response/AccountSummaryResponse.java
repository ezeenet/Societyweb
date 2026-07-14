package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;

public record AccountSummaryResponse(
    BigDecimal openingBalance,
    BigDecimal totalIncome,
    BigDecimal totalExpense,
    BigDecimal closingBalance
) {}
