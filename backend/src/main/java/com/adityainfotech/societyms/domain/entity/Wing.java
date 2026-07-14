package com.adityainfotech.societyms.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A wing represents a building block in the society (e.g. "Wing A", "Tower 1").
 * Each wing contains one or more flats.
 *
 * Deletion rule: a wing can only be deleted if it has no flats assigned.
 * This is enforced in WingService, not via DB cascade, so the error message
 * can be user-friendly rather than a raw SQL constraint violation.
 */
@Entity
@Table(name = "wings")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Bidirectional mapping kept for count queries only.
     * Never use this to load all flats — use FlatRepository with pagination instead.
     */
    @OneToMany(mappedBy = "wing", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Flat> flats = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Convenience: total flat count without loading all flat entities. */
    public int getFlatCount() {
        return flats.size();
    }
}
