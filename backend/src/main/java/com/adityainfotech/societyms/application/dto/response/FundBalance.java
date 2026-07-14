package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;

public record FundBalance(
    String fundName,
    BigDecimal totalIncome,
    BigDecimal totalExpense,
    BigDecimal balance
) {}
