package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;

public record TrialBalanceRow(String accountHead, BigDecimal debit, BigDecimal credit) {}
