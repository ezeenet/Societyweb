package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record BalanceSheetReport(
    String financialYear,
    List<BalanceSheetItem> liabilities,
    List<BalanceSheetItem> assets,
    BigDecimal totalLiabilities,
    BigDecimal totalAssets
) {}
