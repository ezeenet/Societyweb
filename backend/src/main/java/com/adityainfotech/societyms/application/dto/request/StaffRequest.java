package com.adityainfotech.societyms.application.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StaffRequest(
    String fullName,
    String mobile,
    String address,
    String designation,
    BigDecimal salary,
    LocalDate joinDate,
    String status,
    String notes
) {}