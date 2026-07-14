package com.adityainfotech.societyms.domain.entity;

import com.adityainfotech.societyms.domain.enums.FlatStatus;
import com.adityainfotech.societyms.domain.enums.FlatType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A flat belongs to exactly one wing and may have at most one active member.
 *
 * Business rules enforced at the service layer (not DB):
 *  - Cannot manually set status to VACANT if a member is linked (FlatService)
 *  - Cannot delete a flat if status is OCCUPIED (FlatService)
 *  - flat_number must be unique within a wing (DB UNIQUE constraint)
 */
@Entity
@Table(
    name = "flats",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_flat_number_wing",
        columnNames = { "flat_number", "wing_id" }
    )
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flat_number", nullable = false, length = 20)
    private String flatNumber;

    @Column(name = "floor_number")
    private Integer floorNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "flat_type", length = 20)
    private FlatType flatType;

    @Column(name = "area_sqft", precision = 10, scale = 2)
    private BigDecimal areaSqft;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FlatStatus status = FlatStatus.VACANT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wing_id", nullable = false)
    private Wing wing;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isOccupied() {
        return FlatStatus.OCCUPIED.equals(this.status);
    }

    public boolean isVacant() {
        return FlatStatus.VACANT.equals(this.status);
    }
}
