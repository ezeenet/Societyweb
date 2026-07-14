package com.adityainfotech.societyms.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "notice_acknowledgements",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_ack_notice_member",
        columnNames = { "notice_id", "member_id" }
    )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NoticeAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    public void prePersist() { this.readAt = LocalDateTime.now(); }
}
