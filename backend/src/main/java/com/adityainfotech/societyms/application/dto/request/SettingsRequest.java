package com.adityainfotech.societyms.application.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record SettingsRequest(
    @Size(max = 200) String societyName,
    @Size(max = 100) String registrationNo,
    String address,
    @Size(max = 100) String city,
    @Size(max = 100) String state,
    @Size(max = 10)  String pincode,
    @Size(max = 15)  String contactPhone,
    @Email @Size(max = 100) String contactEmail,
    @Size(max = 200) String website,
    @DecimalMin("0.01") BigDecimal defaultMaintenanceAmount,
    @Min(1) @Max(28)    Integer maintenanceDueDayOfMonth,
    @DecimalMin("0")    BigDecimal lateFineAmount,
    @Min(0)             Integer lateFineDaysAfterDue,
    @Size(max = 200) String bankName,
    @Size(max = 50)  String bankAccountNo,
    @Size(max = 20)  String bankIfscCode,
    @Size(max = 200) String bankBranch,
    @Pattern(regexp = "^\\d{2}-\\d{2}$", message = "Format: dd-MM") String financialYearStart,
    @Size(max = 10) String currency,
    @Size(max = 200) String reminderEmailSubject,
    String reminderEmailBody,
    @Size(max = 200) String emailUsername,
    @Size(max = 200) String emailPassword
) {}
