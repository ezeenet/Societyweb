package com.adityainfotech.societyms.application.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AmcContractRequest(
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
    Integer reminderDays
) {}