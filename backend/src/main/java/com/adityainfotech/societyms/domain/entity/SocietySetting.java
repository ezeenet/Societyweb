package com.adityainfotech.societyms.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Society-wide configuration — single row (id=1 always).
 *
 * The UI displays this in 4 sections:
 *   Section 1 → Society Info (name, registration, address, contact)
 *   Section 2 → Maintenance Config (amount, due day, late fine)
 *   Section 3 → Bank Details (name, account, IFSC, branch)
 *   Section 4 → Financial Year & System (FY start, currency, logo)
 *
 * Version field enables optimistic locking — prevents two admins
 * overwriting each other's changes simultaneously.
 */
@Entity
@Table(name = "society_settings")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SocietySetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Section 1: Society Info ───────────────────────────────────────────────
    @Column(name = "society_name", length = 200)
    private String societyName;

    @Column(name = "registration_no", length = 100)
    private String registrationNo;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Column(name = "contact_phone", length = 15)
    private String contactPhone;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Column(length = 200)
    private String website;

    // ── Section 2: Maintenance Config ────────────────────────────────────────
    @Column(name = "default_maintenance_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal defaultMaintenanceAmount = new BigDecimal("2000.00");

    @Column(name = "maintenance_due_day_of_month")
    @Builder.Default
    private Integer maintenanceDueDayOfMonth = 10;

    @Column(name = "late_fine_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal lateFineAmount = new BigDecimal("100.00");

    @Column(name = "late_fine_days_after_due")
    @Builder.Default
    private Integer lateFineDaysAfterDue = 5;

    // ── Section 3: Bank Details ───────────────────────────────────────────────
    @Column(name = "bank_name", length = 200)
    private String bankName;

    @Column(name = "bank_account_no", length = 50)
    private String bankAccountNo;

    @Column(name = "bank_ifsc_code", length = 20)
    private String bankIfscCode;

    @Column(name = "bank_branch", length = 200)
    private String bankBranch;

    // ── Section 4: Financial Year & System ───────────────────────────────────
    @Column(name = "financial_year_start", length = 10)
    @Builder.Default
    private String financialYearStart = "01-04";   // dd-MM

    @Column(length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "logo_path", length = 500)
    private String logoPath;

    // ── Email Configuration ──────────────────────────────────────────────────
    @Column(name = "email_username", length = 200)
    private String emailUsername;

    @Column(name = "email_password", length = 200)
    private String emailPassword;

    // ── Email Reminder Template ──────────────────────────────────────────────
    @Column(name = "reminder_email_subject", length = 200)
    @Builder.Default
    private String reminderEmailSubject = "Maintenance Due Reminder";

    @Column(name = "reminder_email_body", columnDefinition = "TEXT")
    @Builder.Default
    private String reminderEmailBody =
        "Dear {memberName},\n\nThis is a reminder that your pending maintenance amount is {amountDue}.\nPlease clear it at the earliest.\n\nRegards,\nSociety Management";

    @Version
    @Builder.Default
    private Integer version = 0;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
