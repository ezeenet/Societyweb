package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.AmcContract;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public record AmcContractResponse(
    Long id,
    String contractName,
    Long vendorId,
    String vendorName,
    String category,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal amount,
    String paymentMode,
    String status,
    String notes,
    Integer reminderDays,
    Long daysRemaining,
    boolean isExpired,
    boolean isDueSoon,
    LocalDateTime createdAt
) {
    public static AmcContractResponse from(AmcContract a) {
        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, a.getEndDate());
        boolean isExpired = a.getEndDate().isBefore(today);
        boolean isDueSoon = !isExpired && daysRemaining <= (a.getReminderDays() != null ? a.getReminderDays() : 30);

        return new AmcContractResponse(
            a.getId(), a.getContractName(),
            a.getVendor() != null ? a.getVendor().getId() : null,
            a.getVendor() != null ? a.getVendor().getName() : a.getVendorName(),
            a.getCategory(), a.getStartDate(), a.getEndDate(),
            a.getAmount(), a.getPaymentMode(), a.getStatus(),
            a.getNotes(), a.getReminderDays(),
            daysRemaining, isExpired, isDueSoon,
            a.getCreatedAt()
        );
    }
}