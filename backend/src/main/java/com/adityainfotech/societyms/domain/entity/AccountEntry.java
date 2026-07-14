package com.adityainfotech.societyms.domain.entity;

import com.adityainfotech.societyms.domain.enums.EntryType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * General ledger entry.
 *
 * Categories map to accounting heads:
 *   INCOME    → Maintenance, Sinking Fund, Repair Fund, Corpus Fund, Reserve Fund, Other Income
 *   EXPENSE   → Salary, Repair, Utilities, Security, Cleaning, Event, Admin, Other
 *   OPENING_BALANCE → Cash / Bank (used once per financial year to seed balances)
 *
 * Fund entries use category = "Sinking Fund" | "Repair Fund" | "Corpus Fund" | "Reserve Fund".
 * The Fund Management tab aggregates these by summing INCOME − EXPENSE per fund.
 *
 * Cash Book  = entries where category is "Cash"  + payments with mode CASH/CHEQUE
 * Bank Book  = entries where category is "Bank"  + payments with mode UPI/NEFT/RTGS/ONLINE
 * Trial Balance = Cash Dr + Bank Dr + Expense Dr | Maintenance Income Cr + Other Income Cr + Opening Balance Cr
 */
@Entity
@Table(name = "account_entries")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AccountEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 30)
    private EntryType entryType;

    /** Accounting head — drives Cash Book / Bank Book / Fund grouping. */
    @Column(length = 100)
    private String category;

    /** More granular classification within a category. */
    @Column(name = "sub_category", length = 100)
    private String subCategory;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    /** Cheque number / UTR / voucher reference. */
    @Column(length = 100)
    private String reference;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "created_by")
    private Long createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
