package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record DefaulterRow(
    Long memberId,
    String memberName,
    String flatNumber,
    String wingName,
    BigDecimal totalDue,
    int pendingMonths,
    List<DefaulterBillDetail> bills
) {}