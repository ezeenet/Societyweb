package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record MemberLedgerResponse(
    Long memberId,
    String memberName,
    String flatNumber,
    String wingName,
    List<LedgerRow> rows,
    BigDecimal totalDebits,
    BigDecimal totalCredits,
    BigDecimal closingBalance,
    boolean hasAdvance
) {}
