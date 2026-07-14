package com.adityainfotech.societyms.application.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ExpenseVoucherRequest(
    String voucherType,
    String expenseFor,
    String vendorName,
    Long vendorId,
    LocalDate voucherDate,
    List<VoucherItemRequest> items,
    BigDecimal paidAmount,
    String paymentMode,
    String description
) {
    public record VoucherItemRequest(
        String itemName,
        BigDecimal quantity,
        BigDecimal pricePerUnit
    ) {}
}