package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record IncomeExpenseReport(
    String financialYear,
    LocalDate from,
    LocalDate to,
    List<IncomeExpenseRow> rows,
    BigDecimal totalIncome,
    BigDecimal totalExpense,
    BigDecimal netBalance
) {}
