package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.MaintenanceBill;
import com.adityainfotech.societyms.domain.enums.BillStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BillResponse(
    Long id,
    Long flatId,
    String flatNumber,
    String wingName,
    String memberName,
    String billMonth,
    BigDecimal amount,
    BigDecimal lateFine,
    BigDecimal totalDue,
    LocalDate dueDate,
    BillStatus status,
    String paidDate,
    String receiptNumber,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    /** Basic — memberName/paidDate/receiptNumber blank (backward compat) */
    public static BillResponse from(MaintenanceBill b) {
        return from(b, null, null, null);
    }

    /** Full — BillingService passes extra fields */
    public static BillResponse from(
        MaintenanceBill b,
        String memberName,
        String paidDate,
        String receiptNumber
    ) {
        return new BillResponse(
            b.getId(),
            b.getFlat().getId(),
            b.getFlat().getFlatNumber(),
            b.getFlat().getWing() != null ? b.getFlat().getWing().getName() : null,
            memberName,
            b.getBillMonth(),
            b.getAmount(),
            b.getLateFine(),
            b.getTotalDue(),
            b.getDueDate(),
            b.getStatus(),
            paidDate,
            receiptNumber,
            b.getCreatedAt(),
            b.getUpdatedAt()
        );
    }
}