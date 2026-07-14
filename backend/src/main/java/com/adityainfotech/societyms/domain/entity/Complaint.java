package com.adityainfotech.societyms.domain.entity;

import com.adityainfotech.societyms.domain.enums.ComplaintCategory;
import com.adityainfotech.societyms.domain.enums.ComplaintStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * A complaint raised by a society member.
 *
 * Status flow:
 *   OPEN → IN_PROGRESS → RESOLVED → CLOSED
 *
 * Role rules (enforced in ComplaintService):
 *   MEMBER  : can create; can move to IN_PROGRESS only
 *   ADMIN / MANAGER / SECURITY : can move to any status
 *
 * Cascade: deleting a Member deletes all their complaints (ON DELETE CASCADE).
 */
@Entity
@Table(name = "complaints")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ComplaintCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(length = 500)
    private String remarks;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
