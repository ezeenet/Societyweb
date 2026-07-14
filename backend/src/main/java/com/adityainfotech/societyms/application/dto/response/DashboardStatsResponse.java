package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;

public record DashboardStatsResponse(
    long totalMembers,
    long totalFlats,
    long occupiedFlats,
    long vacantFlats,
    long pendingBills,
    BigDecimal totalCollected,
    BigDecimal totalIncome,
    BigDecimal totalExpense,
    long openComplaints,
    long visitorsToday,
    long activeNotices,
    BigDecimal bankBalance
) {}
