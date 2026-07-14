package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;

public record CollectionSummaryRow(
    String billMonth,
    int totalFlats,
    int paidCount,
    int pendingCount,
    BigDecimal amountBilled,
    BigDecimal amountCollected,
    BigDecimal amountPending
) {}
