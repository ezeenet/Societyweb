package com.adityainfotech.societyms.application.dto.request;
import java.math.BigDecimal;
import java.time.LocalDate;
public record BankTransactionRequest(
    Long bankAccountId, String transactionType,
    BigDecimal amount, String description,
    LocalDate transactionDate, String reference,
    Boolean contraEntry
) {}