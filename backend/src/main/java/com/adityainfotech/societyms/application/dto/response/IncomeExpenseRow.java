package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;

public record IncomeExpenseRow(
    String category,
    BigDecimal income,
    BigDecimal expense,
    BigDecimal net
) {}
