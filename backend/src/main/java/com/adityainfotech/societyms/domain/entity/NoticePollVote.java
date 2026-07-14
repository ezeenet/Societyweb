package com.adityainfotech.societyms.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "notice_poll_votes",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_vote_poll_member",
        columnNames = { "poll_id", "member_id" }
    )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NoticePollVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    private NoticePoll poll;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "selected_option", nullable = false, length = 1)
    private String selectedOption;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() { this.createdAt = LocalDateTime.now(); }
}
