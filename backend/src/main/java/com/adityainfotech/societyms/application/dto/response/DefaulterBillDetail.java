package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DefaulterBillDetail(
    String billMonth,
    BigDecimal amount,
    LocalDate dueDate
) {}