package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record FundSummaryResponse(List<FundBalance> funds, BigDecimal grandTotal) {}
