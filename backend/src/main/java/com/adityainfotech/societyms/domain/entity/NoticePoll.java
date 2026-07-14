package com.adityainfotech.societyms.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notice_polls")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NoticePoll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @Column(nullable = false, length = 500)
    private String question;

    @Column(name = "option_a", nullable = false, length = 200)
    private String optionA;

    @Column(name = "option_b", nullable = false, length = 200)
    private String optionB;

    @Column(name = "option_c", length = 200)
    private String optionC;

    @Column(name = "option_d", length = 200)
    private String optionD;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "ends_at")
    private LocalDateTime endsAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() { this.createdAt = LocalDateTime.now(); }
}
