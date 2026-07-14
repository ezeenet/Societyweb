package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.ExpenseVoucher;
import com.adityainfotech.societyms.domain.entity.ExpenseVoucherItem;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ExpenseVoucherResponse(
    Long id,
    String voucherNumber,
    String voucherType,
    String expenseFor,
    String vendorName,
    LocalDate voucherDate,
    List<VoucherItemResponse> items,
    BigDecimal subTotal,
    BigDecimal totalAmount,
    BigDecimal paidAmount,
    BigDecimal balanceAmount,
    String paymentMode,
    String description,
    LocalDateTime createdAt
) {
    public static ExpenseVoucherResponse from(ExpenseVoucher v) {
        return new ExpenseVoucherResponse(
            v.getId(), v.getVoucherNumber(), v.getVoucherType(), v.getExpenseFor(), v.getVendorName(),
            v.getVoucherDate(),
            v.getItems().stream().map(VoucherItemResponse::from).toList(),
            v.getSubTotal(), v.getTotalAmount(), v.getPaidAmount(), v.getBalanceAmount(),
            v.getPaymentMode(), v.getDescription(), v.getCreatedAt()
        );
    }

    public record VoucherItemResponse(
        Long id, String itemName, BigDecimal quantity,
        BigDecimal pricePerUnit, BigDecimal amount
    ) {
        public static VoucherItemResponse from(ExpenseVoucherItem i) {
            return new VoucherItemResponse(i.getId(), i.getItemName(), i.getQuantity(), i.getPricePerUnit(), i.getAmount());
        }
    }
}