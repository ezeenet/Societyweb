package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record TrialBalanceReport(
    String financialYear,
    List<TrialBalanceRow> rows,
    BigDecimal totalDebit,
    BigDecimal totalCredit,
    boolean isBalanced
) {}
