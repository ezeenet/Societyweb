package com.adityainfotech.societyms.application.dto.response;
import com.adityainfotech.societyms.domain.entity.BankTransaction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BankTransactionResponse(
    Long id, Long bankAccountId, String accountName,
    String transactionType, BigDecimal amount,
    String description, LocalDate transactionDate,
    String reference, BigDecimal runningBalance,
    LocalDateTime createdAt
) {
    public static BankTransactionResponse from(BankTransaction t, BigDecimal runningBalance) {
        return new BankTransactionResponse(
            t.getId(), t.getBankAccount().getId(), t.getBankAccount().getAccountName(),
            t.getTransactionType(), t.getAmount(),
            t.getDescription(), t.getTransactionDate(),
            t.getReference(), runningBalance, t.getCreatedAt()
        );
    }
}