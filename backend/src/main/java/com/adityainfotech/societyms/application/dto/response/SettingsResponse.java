package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.SocietySetting;
import java.math.BigDecimal;

public record SettingsResponse(
    Long id, String societyName, String registrationNo, String address,
    String city, String state, String pincode, String contactPhone,
    String contactEmail, String website,
    BigDecimal defaultMaintenanceAmount, Integer maintenanceDueDayOfMonth,
    BigDecimal lateFineAmount, Integer lateFineDaysAfterDue,
    String bankName, String bankAccountNo, String bankIfscCode, String bankBranch,
    String financialYearStart, String currency, String logoPath, Integer version,
    String reminderEmailSubject, String reminderEmailBody,
    String emailUsername, String emailPassword
) {
    public static SettingsResponse from(SocietySetting s) {
        return new SettingsResponse(
            s.getId(), s.getSocietyName(), s.getRegistrationNo(), s.getAddress(),
            s.getCity(), s.getState(), s.getPincode(), s.getContactPhone(),
            s.getContactEmail(), s.getWebsite(),
            s.getDefaultMaintenanceAmount(), s.getMaintenanceDueDayOfMonth(),
            s.getLateFineAmount(), s.getLateFineDaysAfterDue(),
            s.getBankName(), s.getBankAccountNo(), s.getBankIfscCode(), s.getBankBranch(),
            s.getFinancialYearStart(), s.getCurrency(), s.getLogoPath(), s.getVersion(),
            s.getReminderEmailSubject(), s.getReminderEmailBody(),
            s.getEmailUsername(), s.getEmailPassword()
        );
    }
}
