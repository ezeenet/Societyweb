package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.MaintenanceBill;
import com.adityainfotech.societyms.domain.entity.Payment;
import com.adityainfotech.societyms.domain.enums.ApprovalStatus;
import com.adityainfotech.societyms.domain.enums.PaymentMode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PaymentResponse(
    Long id, Long billId, String billMonth,
    String flatNumber, String wingName,
    Long memberId, String memberName,
    String flatOwnerName,
    BigDecimal amountPaid, LocalDate paymentDate,
    PaymentMode paymentMode, String referenceNo,
    String receiptNumber, String remarks,
    ApprovalStatus approvalStatus, String rejectionReason,
    LocalDateTime approvedAt, LocalDateTime createdAt
) {
    /** Basic from — flatOwnerName will be set by BillingService */
    public static PaymentResponse from(Payment p) {
        return from(p, null);
    }

    /** Full from — BillingService passes flatOwnerName */
    public static PaymentResponse from(Payment p, String flatOwnerName) {
        MaintenanceBill bill = p.getBill();
        return new PaymentResponse(
            p.getId(), bill.getId(), bill.getBillMonth(),
            bill.getFlat().getFlatNumber(),
            bill.getFlat().getWing() != null ? bill.getFlat().getWing().getName() : null,
            p.getMember().getId(), p.getMember().getFullName(),
            flatOwnerName,
            p.getAmountPaid(), p.getPaymentDate(), p.getPaymentMode(),
            p.getReferenceNo(), p.getReceiptNumber(), p.getRemarks(),
            p.getApprovalStatus(), p.getRejectionReason(),
            p.getApprovedAt(), p.getCreatedAt()
        );
    }
}