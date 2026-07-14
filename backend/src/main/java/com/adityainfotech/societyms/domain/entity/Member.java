package com.adityainfotech.societyms.domain.entity;

import com.adityainfotech.societyms.domain.enums.MemberType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A society member linked to a flat.
 *
 * Cascade delete rules (enforced in MemberService):
 *   - Deleting a member → cascade-delete: complaints, payments, poll votes, notice acks
 *   - users.member_id FK is set to NULL (ON DELETE SET NULL in DB)
 *   - The member's flat status is reset to VACANT
 *
 * One flat may have multiple members (owner + tenant + co-owner),
 * but billing is per flat, not per member.
 */
@Entity
@Table(name = "members")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(length = 15)
    private String mobile;

    @Column(length = 100)
    private String email;

    @Column(name = "aadhar_number", length = 12)
    private String aadharNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_type", length = 20)
    @Builder.Default
    private MemberType memberType = MemberType.OWNER;

    /**
     * LAZY fetch: controllers never need the entire Flat graph when listing members.
     * Use @EntityGraph on specific queries that require flat+wing data.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flat_id")
    private Flat flat;

    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(name = "move_out_date")
    private LocalDate moveOutDate;

    @Column(name = "vehicle_number", length = 20)
    private String vehicleNumber;

    @Column(name = "parking_slot", length = 20)
    private String parkingSlot;

    /** Member add करताना previous due (opening balance). One-time use — bill auto-create साठी. */
    @Column(name = "opening_balance", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal openingBalance = BigDecimal.ZERO;

    /** Share Capital paid by member (one-time, as per bye-laws). */
    @Column(name = "share_capital", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal shareCapital = BigDecimal.ZERO;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}