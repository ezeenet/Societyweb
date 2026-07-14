package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.NoticeAcknowledgement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeAcknowledgementJpaRepository extends JpaRepository<NoticeAcknowledgement, Long> {

    boolean existsByNoticeIdAndMemberId(Long noticeId, Long memberId);

    long countByNoticeId(Long noticeId);

    @Query("""
        SELECT a FROM NoticeAcknowledgement a
        JOIN FETCH a.member m
        WHERE a.notice.id = :noticeId
        ORDER BY a.readAt DESC
        """)
    List<NoticeAcknowledgement> findByNoticeIdWithMember(@Param("noticeId") Long noticeId);
}
