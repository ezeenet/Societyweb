package com.adityainfotech.societyms.application.dto.response;
import com.adityainfotech.societyms.domain.entity.BankAccount;
import java.math.BigDecimal;

public record BankAccountResponse(
    Long id, String accountName, String bankName,
    String accountNumber, String branch,
    BigDecimal openingBalance, BigDecimal currentBalance
) {
    public static BankAccountResponse from(BankAccount a, BigDecimal txnBalance) {
        BigDecimal current = (a.getOpeningBalance() != null ? a.getOpeningBalance() : BigDecimal.ZERO)
            .add(txnBalance != null ? txnBalance : BigDecimal.ZERO);
        return new BankAccountResponse(
            a.getId(), a.getAccountName(), a.getBankName(),
            a.getAccountNumber(), a.getBranch(),
            a.getOpeningBalance(), current
        );
    }
}