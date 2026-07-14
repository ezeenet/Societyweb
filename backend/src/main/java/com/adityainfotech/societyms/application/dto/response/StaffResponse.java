package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Staff;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record StaffResponse(
    Long id, String fullName, String mobile, String address,
    String designation, BigDecimal salary, LocalDate joinDate,
    String status, String notes,
    LocalDateTime createdAt
) {
    public static StaffResponse from(Staff s) {
        return new StaffResponse(
            s.getId(), s.getFullName(), s.getMobile(), s.getAddress(),
            s.getDesignation(), s.getSalary(), s.getJoinDate(),
            s.getStatus(), s.getNotes(), s.getCreatedAt()
        );
    }
}