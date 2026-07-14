package com.adityainfotech.societyms.domain.entity;

import com.adityainfotech.societyms.domain.enums.BillStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One maintenance bill per flat per month.
 *
 * The UNIQUE constraint on (flat_id, bill_month) is the primary guard
 * against duplicate bill generation. BillingService also checks before insert.
 *
 * bill_month format: "YYYY-MM" (e.g. "2025-04") — stored as CHAR(7).
 * This is intentionally not a date type so month boundaries are always
 * unambiguous regardless of timezone or partial-month edge cases.
 *
 * total_due = amount + late_fine
 * Late fine is auto-calculated by a nightly @Scheduled job (Phase 7).
 */
@Entity
@Table(
    name = "maintenance_bills",
    uniqueConstraints = @UniqueConstraint(
        name  = "uq_bill_flat_month",
        columnNames = { "flat_id", "bill_month" }
    )
)
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MaintenanceBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flat_id", nullable = false)
    private Flat flat;

    /** Format: YYYY-MM */
    @Column(name = "bill_month", nullable = false, length = 7)
    private String billMonth;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "late_fine", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal lateFine = BigDecimal.ZERO;

    @Column(name = "total_due", precision = 10, scale = 2)
    private BigDecimal totalDue;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BillStatus status = BillStatus.PENDING;

    /** FK to users.id — who generated this bill. */
    @Column(name = "generated_by")
    private Long generatedBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Convenience: recompute totalDue whenever amount/lateFine changes. */
    @PrePersist
    @PreUpdate
    public void recalculateTotalDue() {
        BigDecimal fine = this.lateFine != null ? this.lateFine : BigDecimal.ZERO;
        this.totalDue   = this.amount.add(fine);
    }
}
