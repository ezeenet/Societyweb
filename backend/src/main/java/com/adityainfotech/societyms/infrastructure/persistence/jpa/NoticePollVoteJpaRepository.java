package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.NoticePollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NoticePollVoteJpaRepository extends JpaRepository<NoticePollVote, Long> {

    boolean existsByPollIdAndMemberId(Long pollId, Long memberId);

    long countByPollIdAndSelectedOption(Long pollId, String option);

    long countByPollId(Long pollId);

    Optional<NoticePollVote> findByPollIdAndMemberId(Long pollId, Long memberId);
}
