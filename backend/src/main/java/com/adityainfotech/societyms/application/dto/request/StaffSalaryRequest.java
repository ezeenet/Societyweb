package com.adityainfotech.societyms.application.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StaffSalaryRequest(
    String salaryMonth,
    BigDecimal amount,
    LocalDate paidDate,
    String status,
    String notes
) {}