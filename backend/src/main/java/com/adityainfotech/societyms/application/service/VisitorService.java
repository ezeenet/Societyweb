package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.VisitorExitRequest;
import com.adityainfotech.societyms.application.dto.request.VisitorRequest;
import com.adityainfotech.societyms.application.dto.response.VisitorResponse;
import com.adityainfotech.societyms.domain.entity.Flat;
import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.domain.entity.Visitor;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.FlatJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.MemberJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.VisitorJpaRepository;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitorService {

    private final VisitorJpaRepository      visitorRepository;
    private final FlatJpaRepository         flatRepository;
    private final MemberJpaRepository       memberRepository;
    private final UserJpaRepository         userRepository;
    private final PushNotificationService   pushNotificationService;

    @Transactional(readOnly = true)
    public List<VisitorResponse> findAll() {
        return visitorRepository.findAllByOrderByEntryTimeDesc()
            .stream().map(VisitorResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<VisitorResponse> findActive() {
        return visitorRepository.findByExitTimeIsNullOrderByEntryTimeDesc()
            .stream().map(VisitorResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<VisitorResponse> findByDateRange(LocalDate from, LocalDate to) {
        return visitorRepository.findByEntryTimeBetweenOrderByEntryTimeDesc(
            from.atStartOfDay(), to.plusDays(1).atStartOfDay()
        ).stream().map(VisitorResponse::from).toList();
    }

    @Transactional
    public VisitorResponse logEntry(VisitorRequest request) {
        Flat flat = flatRepository.findById(request.flatId())
            .orElseThrow(() -> ResourceNotFoundException.of("Flat", request.flatId()));

        Member host = null;
        if (request.hostMemberId() != null) {
            host = memberRepository.findById(request.hostMemberId()).orElse(null);
        }

        Long loggedBy = resolveCurrentUserId();

        Visitor visitor = Visitor.builder()
            .visitorName(request.visitorName().trim())
            .mobile(request.mobile())
            .purpose(request.purpose())
            .flat(flat)
            .hostMember(host)
            .vehicleNo(request.vehicleNo())
            .entryTime(LocalDateTime.now())
            .loggedBy(loggedBy)
            .build();

        Visitor saved = visitorRepository.save(visitor);
        log.info("Visitor entry logged: {} -> Flat {}", saved.getVisitorName(), flat.getFlatNumber());

        // Transaction commit नंतर notification पाठवा
        final Visitor finalSaved = saved;
        final Member finalHost   = host;
        org.springframework.transaction.support.TransactionSynchronizationManager
            .registerSynchronization(new org.springframework.transaction.support.TransactionSynchronizationAdapter() {
                @Override
                public void afterCommit() {
                    sendVisitorNotification(finalSaved, flat, finalHost);
                }
            });

        return VisitorResponse.from(saved);
    }

    @Transactional
    public VisitorResponse recordExit(Long id, VisitorExitRequest request) {
        Visitor visitor = getOrThrow(id);

        if (!visitor.isInsidePremises()) {
            throw new BusinessRuleException(
                "Exit already recorded for this visitor.", "EXIT_ALREADY_RECORDED"
            );
        }

        visitor.setExitTime(
            request.exitTime() != null ? request.exitTime() : LocalDateTime.now()
        );

        log.info("Visitor exit: {} at {}", visitor.getVisitorName(), visitor.getExitTime());
        return VisitorResponse.from(visitorRepository.save(visitor));
    }

    @Transactional
    public void delete(Long id) {
        visitorRepository.delete(getOrThrow(id));
    }

    public long countTodayVisitors() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);
        return visitorRepository.countTodayVisitors(startOfDay, endOfDay);
    }

    public long countActive() {
        return visitorRepository.countByExitTimeIsNull();
    }

    @Transactional
    public VisitorResponse approveVisitor(Long visitorId, Long memberId) {
        Visitor visitor = getOrThrow(visitorId);
        if (!"PENDING".equals(visitor.getApprovalStatus())) {
            throw new BusinessRuleException("Visitor already processed.", "VISITOR_ALREADY_PROCESSED");
        }
        visitor.setApprovalStatus("APPROVED");
        visitor.setApprovedByMemberId(memberId);
        visitor.setApprovedAt(LocalDateTime.now());
        log.info("Visitor approved: id={} by memberId={}", visitorId, memberId);
        return VisitorResponse.from(visitorRepository.save(visitor));
    }

    @Transactional
    public VisitorResponse denyVisitor(Long visitorId, Long memberId) {
        Visitor visitor = getOrThrow(visitorId);
        if (!"PENDING".equals(visitor.getApprovalStatus())) {
            throw new BusinessRuleException("Visitor already processed.", "VISITOR_ALREADY_PROCESSED");
        }
        visitor.setApprovalStatus("DENIED");
        visitor.setApprovedByMemberId(memberId);
        visitor.setApprovedAt(LocalDateTime.now());
        // Exit time set करा — entry cancel
        visitor.setExitTime(LocalDateTime.now());
        log.info("Visitor denied: id={} by memberId={}", visitorId, memberId);
        return VisitorResponse.from(visitorRepository.save(visitor));
    }

    @Transactional(readOnly = true)
    public List<VisitorResponse> findPendingForMember(Long memberId) {
        return visitorRepository.findPendingByMemberId(memberId)
            .stream().map(VisitorResponse::from).toList();
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private void sendVisitorNotification(Visitor visitor, Flat flat, Member host) {
        try {
            // Host specified असेल तर त्याला, नाहीतर flat च्या सगळ्या active members ना
            List<Member> targets = host != null
                ? List.of(host)
                : memberRepository.findByFlatIdAndIsActiveTrue(flat.getId());

            String wingFlat = (flat.getWing() != null ? flat.getWing().getName() + " - " : "")
                + flat.getFlatNumber();
            String title = "Visitor at Gate";
            String purpose = visitor.getPurpose() != null ? visitor.getPurpose() : "Visit";
            String body  = visitor.getVisitorName() + " is waiting at gate"
                + " (" + purpose + ")"
                + " — " + wingFlat;

            for (Member member : targets) {
                // Member चा user account शोधा
                userRepository.findByMemberId(member.getId()).ifPresent(user -> {
                    pushNotificationService.sendToUser(user.getId(), title, body, "visitor-entry");
                    log.info("Visitor notification sent to memberId={} userId={}", member.getId(), user.getId());
                });
            }
        } catch (Exception e) {
            // Notification fail झाली तरी visitor entry fail होऊ नये
            log.warn("Failed to send visitor notification: {}", e.getMessage());
        }
    }

    private Visitor getOrThrow(Long id) {
        return visitorRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Visitor", id));
    }

    private Long resolveCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).map(u -> u.getId()).orElse(null);
    }
}