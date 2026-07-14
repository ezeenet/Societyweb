package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.NoticePoll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NoticePollJpaRepository extends JpaRepository<NoticePoll, Long> {

    Optional<NoticePoll> findByNoticeId(Long noticeId);

    boolean existsByNoticeId(Long noticeId);
}
