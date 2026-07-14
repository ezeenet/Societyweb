package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.*;
import com.adityainfotech.societyms.application.dto.response.*;
import com.adityainfotech.societyms.domain.entity.*;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.*;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoticeService {

    private final NoticeJpaRepository              noticeRepository;
    private final NoticePollJpaRepository          pollRepository;
    private final NoticePollVoteJpaRepository      voteRepository;
    private final NoticeAcknowledgementJpaRepository ackRepository;
    private final MemberJpaRepository              memberRepository;
    private final UserJpaRepository                userRepository;

    // ── Notice CRUD ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NoticeResponse> findAll() {
        return noticeRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> findActive() {
        return noticeRepository.findByIsActiveTrueOrderByCreatedAtDesc()
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public NoticeResponse create(NoticeRequest request) {
        String username   = SecurityContextHolder.getContext().getAuthentication().getName();
        var user          = userRepository.findByUsername(username).orElse(null);
        Long userId       = user != null ? user.getId() : null;
        String fullName   = user != null ? user.getFullName() : username;

        Notice notice = Notice.builder()
            .title(request.title().trim())
            .content(request.content())
            .category(request.category())
            .createdBy(userId)
            .createdByName(fullName)
            .isActive(true)
            .expiresAt(request.expiresAt())
            .build();

        return toResponse(noticeRepository.save(notice));
    }

    @Transactional
    public NoticeResponse update(Long id, NoticeRequest request) {
        Notice notice = getOrThrow(id);
        notice.setTitle(request.title().trim());
        notice.setContent(request.content());
        notice.setCategory(request.category());
        notice.setExpiresAt(request.expiresAt());
        return toResponse(noticeRepository.save(notice));
    }

    @Transactional
    public NoticeResponse toggle(Long id) {
        Notice notice = getOrThrow(id);
        notice.setIsActive(!notice.getIsActive());
        return toResponse(noticeRepository.save(notice));
    }

    /**
     * Delete notice — cascade order:
     *   1. DB ON DELETE CASCADE handles votes, acks, polls automatically.
     *   2. JPA just needs to delete the Notice entity.
     */
    @Transactional
    public void delete(Long id) {
        noticeRepository.delete(getOrThrow(id));
        log.info("Notice deleted: id={}", id);
    }

    // ── Polls ─────────────────────────────────────────────────────────────────

    @Transactional
    public PollResultResponse createPoll(Long noticeId, PollRequest request) {
        Notice notice = getOrThrow(noticeId);

        if (pollRepository.existsByNoticeId(noticeId)) {
            throw new BusinessRuleException(
                "This notice already has a poll. Edit the existing poll instead.",
                "POLL_ALREADY_EXISTS"
            );
        }

        NoticePoll poll = NoticePoll.builder()
            .notice(notice)
            .question(request.question().trim())
            .optionA(request.optionA())
            .optionB(request.optionB())
            .optionC(request.optionC())
            .optionD(request.optionD())
            .endsAt(request.endsAt())
            .isActive(true)
            .build();

        return toPollResult(pollRepository.save(poll), null);
    }

    @Transactional
    public PollResultResponse updatePoll(Long noticeId, PollRequest request) {
        NoticePoll poll = pollRepository.findByNoticeId(noticeId)
            .orElseThrow(() -> new BusinessRuleException("No poll found for this notice.", "POLL_NOT_FOUND"));

        poll.setQuestion(request.question().trim());
        poll.setOptionA(request.optionA());
        poll.setOptionB(request.optionB());
        poll.setOptionC(request.optionC());
        poll.setOptionD(request.optionD());
        poll.setEndsAt(request.endsAt());

        return toPollResult(pollRepository.save(poll), null);
    }

    @Transactional(readOnly = true)
    public PollResultResponse getPollResult(Long noticeId, Long memberId) {
        NoticePoll poll = pollRepository.findByNoticeId(noticeId)
            .orElseThrow(() -> new BusinessRuleException("No poll for this notice.", "POLL_NOT_FOUND"));

        String myVote = null;
        if (memberId != null) {
            voteRepository.findByPollIdAndMemberId(poll.getId(), memberId)
                .ifPresent(v -> { });  // resolved below
            myVote = voteRepository.findByPollIdAndMemberId(poll.getId(), memberId)
                .map(NoticePollVote::getSelectedOption).orElse(null);
        }

        return toPollResult(poll, myVote);
    }

    @Transactional
    public PollResultResponse vote(Long noticeId, VoteRequest request) {
        NoticePoll poll = pollRepository.findByNoticeId(noticeId)
            .orElseThrow(() -> new BusinessRuleException("No poll for this notice.", "POLL_NOT_FOUND"));

        if (!Boolean.TRUE.equals(poll.getIsActive())) {
            throw new BusinessRuleException("This poll is closed.", "POLL_CLOSED");
        }

        if (voteRepository.existsByPollIdAndMemberId(poll.getId(), request.memberId())) {
            throw new BusinessRuleException("You have already voted on this poll.", "ALREADY_VOTED");
        }

        // Validate option exists
        String opt = request.selectedOption();
        if (opt.equals("C") && poll.getOptionC() == null) {
            throw new BusinessRuleException("Option C is not available for this poll.", "INVALID_OPTION");
        }
        if (opt.equals("D") && poll.getOptionD() == null) {
            throw new BusinessRuleException("Option D is not available for this poll.", "INVALID_OPTION");
        }

        Member member = memberRepository.findById(request.memberId())
            .orElseThrow(() -> ResourceNotFoundException.of("Member", request.memberId()));

        NoticePollVote vote = NoticePollVote.builder()
            .poll(poll)
            .member(member)
            .selectedOption(request.selectedOption())
            .build();

        voteRepository.save(vote);
        log.info("Vote recorded: member={}, poll={}, option={}", member.getId(), poll.getId(), opt);

        return toPollResult(poll, request.selectedOption());
    }

    // ── Acknowledgements ──────────────────────────────────────────────────────

    @Transactional
    public void acknowledge(Long noticeId, AcknowledgeRequest request) {
        Notice notice = getOrThrow(noticeId);

        if (ackRepository.existsByNoticeIdAndMemberId(noticeId, request.memberId())) {
            return; // Idempotent — silently ignore duplicate acks
        }

        Member member = memberRepository.findById(request.memberId())
            .orElseThrow(() -> ResourceNotFoundException.of("Member", request.memberId()));

        NoticeAcknowledgement ack = NoticeAcknowledgement.builder()
            .notice(notice)
            .member(member)
            .build();

        ackRepository.save(ack);
    }

    @Transactional(readOnly = true)
    public AcknowledgementListResponse getAcknowledgements(Long noticeId) {
        long count = ackRepository.countByNoticeId(noticeId);
        List<AckEntry> members = ackRepository.findByNoticeIdWithMember(noticeId)
            .stream()
            .map(a -> new AckEntry(a.getMember().getFullName(), a.getReadAt()))
            .toList();
        return new AcknowledgementListResponse(count, members);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Notice getOrThrow(Long id) {
        return noticeRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Notice", id));
    }

    private NoticeResponse toResponse(Notice n) {
        boolean hasPoll = pollRepository.existsByNoticeId(n.getId());
        long ackCount   = ackRepository.countByNoticeId(n.getId());
        return NoticeResponse.from(n, hasPoll, ackCount);
    }

    private PollResultResponse toPollResult(NoticePoll poll, String myVote) {
        long vA = voteRepository.countByPollIdAndSelectedOption(poll.getId(), "A");
        long vB = voteRepository.countByPollIdAndSelectedOption(poll.getId(), "B");
        long vC = voteRepository.countByPollIdAndSelectedOption(poll.getId(), "C");
        long vD = voteRepository.countByPollIdAndSelectedOption(poll.getId(), "D");
        long total = voteRepository.countByPollId(poll.getId());

        return new PollResultResponse(
            poll.getId(), poll.getNotice().getId(),
            poll.getQuestion(),
            poll.getOptionA(), vA,
            poll.getOptionB(), vB,
            poll.getOptionC(), vC,
            poll.getOptionD(), vD,
            total, Boolean.TRUE.equals(poll.getIsActive()),
            poll.getEndsAt(), myVote
        );
    }

    public long countActive() { return noticeRepository.countByIsActiveTrue(); }
    public long countEmergencies() { return noticeRepository.countActiveEmergencies(); }
}
