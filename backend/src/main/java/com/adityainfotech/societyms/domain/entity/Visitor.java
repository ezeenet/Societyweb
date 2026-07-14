package com.adityainfotech.societyms.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "visitors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Visitor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visitor_name", nullable = false, length = 200)
    private String visitorName;

    @Column(length = 15)
    private String mobile;

    @Column(length = 200)
    private String purpose;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flat_id")
    private Flat flat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_member")
    private Member hostMember;

    @Column(name = "entry_time", nullable = false)
    @Builder.Default
    private LocalDateTime entryTime = LocalDateTime.now();

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @Column(name = "vehicle_no", length = 20)
    private String vehicleNo;

    @Column(name = "logged_by")
    private Long loggedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** PENDING → Member ने approve/deny केलेले नाही
     *  APPROVED → Member ने approve केले → inside
     *  DENIED → Member ने deny केले → entry cancel
     */
    @Column(name = "approval_status", length = 20, nullable = false)
    @Builder.Default
    private String approvalStatus = "PENDING";

    @Column(name = "approved_by_member_id")
    private Long approvedByMemberId;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.approvalStatus == null) this.approvalStatus = "PENDING";
    }

    public boolean isInsidePremises() {
        return exitTime == null && "APPROVED".equals(approvalStatus);
    }
}