package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.StaffSalary;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record StaffSalaryResponse(
    Long id, Long staffId, String staffName, String designation,
    String salaryMonth, BigDecimal amount, LocalDate paidDate,
    String status, String notes, LocalDateTime createdAt
) {
    public static StaffSalaryResponse from(StaffSalary s) {
        return new StaffSalaryResponse(
            s.getId(), s.getStaff().getId(), s.getStaff().getFullName(),
            s.getStaff().getDesignation(), s.getSalaryMonth(), s.getAmount(),
            s.getPaidDate(), s.getStatus(), s.getNotes(), s.getCreatedAt()
        );
    }
}