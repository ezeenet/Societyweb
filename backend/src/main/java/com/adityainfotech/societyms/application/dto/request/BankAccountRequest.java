package com.adityainfotech.societyms.application.dto.request;
import java.math.BigDecimal;
public record BankAccountRequest(
    String accountName, String bankName,
    String accountNumber, String branch,
    BigDecimal openingBalance
) {}