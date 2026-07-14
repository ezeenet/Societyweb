package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.ComplaintRequest;
import com.adityainfotech.societyms.application.dto.request.ComplaintStatusRequest;
import com.adityainfotech.societyms.application.dto.response.ComplaintResponse;
import com.adityainfotech.societyms.domain.entity.Complaint;
import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.domain.enums.ComplaintStatus;
import com.adityainfotech.societyms.domain.enums.Role;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.ComplaintJpaRepository;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintJpaRepository complaintRepository;
    private final MemberService          memberService;

    @Transactional(readOnly = true)
    public List<ComplaintResponse> findAll() {
        return complaintRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(ComplaintResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> findByMember(Long memberId) {
        return complaintRepository.findByMemberIdOrderByCreatedAtDesc(memberId)
            .stream().map(ComplaintResponse::from).toList();
    }

    @Transactional
    public ComplaintResponse create(ComplaintRequest request) {
        Member member = memberService.getOrThrow(request.memberId());

        Complaint complaint = Complaint.builder()
            .title(request.title().trim())
            .description(request.description())
            .category(request.category())
            .status(ComplaintStatus.OPEN)
            .member(member)
            .build();

        return ComplaintResponse.from(complaintRepository.save(complaint));
    }

    /**
     * Update complaint status.
     *
     * Role rules enforced here:
     *   MEMBER  → can only set IN_PROGRESS (cannot resolve or close own complaint)
     *   Others  → any valid status transition
     */
    @Transactional
    public ComplaintResponse updateStatus(Long id, ComplaintStatusRequest request) {
        Complaint complaint = getOrThrow(id);
        Role currentRole    = resolveCurrentRole();

        if (currentRole == Role.MEMBER) {
            if (!ComplaintStatus.isMemberAllowed(request.status())) {
                throw new BusinessRuleException(
                    "Members can only mark complaints as In Progress.",
                    "MEMBER_STATUS_RESTRICTED"
                );
            }
        }

        complaint.setStatus(request.status());
        complaint.setRemarks(request.remarks());

        if (request.status() == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
        }

        return ComplaintResponse.from(complaintRepository.save(complaint));
    }

    @Transactional
    public void delete(Long id) {
        Complaint complaint = getOrThrow(id);
        complaintRepository.delete(complaint);
        log.info("Complaint deleted: id={}", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Complaint getOrThrow(Long id) {
        return complaintRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Complaint", id));
    }

    private Role resolveCurrentRole() {
        return SecurityContextHolder.getContext().getAuthentication()
            .getAuthorities().stream().findFirst()
            .map(a -> Role.valueOf(a.getAuthority().replace("ROLE_", "")))
            .orElse(Role.MEMBER);
    }

    public long countByStatus(ComplaintStatus status) {
        return complaintRepository.countByStatus(status);
    }
}
