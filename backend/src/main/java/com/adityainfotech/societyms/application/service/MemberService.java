package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.MemberRequest;
import com.adityainfotech.societyms.application.dto.response.MemberExportRow;
import com.adityainfotech.societyms.application.dto.response.MemberResponse;
import com.adityainfotech.societyms.domain.entity.Flat;
import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.MemberJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.AccountEntryJpaRepository;
import com.adityainfotech.societyms.domain.entity.AccountEntry;
import com.adityainfotech.societyms.domain.enums.EntryType;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserJpaRepository;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.util.List;

@Service
@Slf4j
public class MemberService {

    private final MemberJpaRepository memberRepository;
    private final UserJpaRepository   userRepository;
    private final FlatService         flatService;
    private final BillingService      billingService;
    private final AccountEntryJpaRepository accountEntryRepository;

    public MemberService(MemberJpaRepository memberRepository,
                          UserJpaRepository userRepository,
                          FlatService flatService,
                          @Lazy BillingService billingService,
                          AccountEntryJpaRepository accountEntryRepository) {
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.flatService = flatService;
        this.billingService = billingService;
        this.accountEntryRepository = accountEntryRepository;
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> findAll(boolean includeInactive) {
        if (includeInactive) {
            return memberRepository.findAllWithFlat()
                .stream()
                .map(MemberResponse::from)
                .toList();
        }
        return memberRepository.findAllActiveWithFlat()
            .stream()
            .map(MemberResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> findAll() {
        return findAll(false);
    }

    @Transactional(readOnly = true)
    public Page<MemberResponse> search(String query, Pageable pageable) {
        return memberRepository.searchActive(query, pageable)
            .map(MemberResponse::from);
    }

    @Transactional(readOnly = true)
    public MemberResponse findById(Long id) {
        return MemberResponse.from(getOrThrow(id));
    }

    @Transactional
    public MemberResponse create(MemberRequest request) {
        Flat flat = flatService.getOrThrow(request.flatId());

        Member member = Member.builder()
            .fullName(request.fullName().trim())
            .mobile(request.mobile())
            .email(request.email() != null ? request.email().toLowerCase().trim() : null)
            .aadharNumber(request.aadharNumber())
            .memberType(request.memberType())
            .flat(flat)
            .moveInDate(request.moveInDate())
            .vehicleNumber(request.vehicleNumber())
            .parkingSlot(request.parkingSlot())
            .openingBalance(request.openingBalance() != null ? request.openingBalance() : BigDecimal.ZERO)
            .isActive(true)
            .build();

        Member saved = memberRepository.save(member);

        // Sync flat status → OCCUPIED
        flatService.markOccupied(flat.getId());

        // Opening Balance — auto arrears bill
        if (request.openingBalance() != null && request.openingBalance().compareTo(BigDecimal.ZERO) > 0) {
            billingService.createOpeningBalanceBill(saved, request.openingBalance());
        }

        // Share Capital — account entry
        if (request.shareCapital() != null && request.shareCapital().compareTo(BigDecimal.ZERO) > 0) {
            saved.setShareCapital(request.shareCapital());
            memberRepository.save(saved);
            createShareCapitalEntry(saved, request.shareCapital());
        }

        log.info("Member created: id={}, name={}, flat={}", saved.getId(), saved.getFullName(), flat.getFlatNumber());
        return MemberResponse.from(saved);
    }

    @Transactional
    public MemberResponse update(Long id, MemberRequest request) {
        Member member = getOrThrow(id);
        Long oldFlatId = member.getFlat() != null ? member.getFlat().getId() : null;

        Flat newFlat = flatService.getOrThrow(request.flatId());

        member.setFullName(request.fullName().trim());
        member.setMobile(request.mobile());
        member.setEmail(request.email() != null ? request.email().toLowerCase().trim() : null);
        member.setAadharNumber(request.aadharNumber());
        member.setMemberType(request.memberType());
        member.setFlat(newFlat);
        member.setMoveInDate(request.moveInDate());
        member.setVehicleNumber(request.vehicleNumber());
        member.setParkingSlot(request.parkingSlot());

        if (request.openingBalance() != null) {
            member.setOpeningBalance(request.openingBalance());
        }

        BigDecimal oldShareCapital = member.getShareCapital() != null ? member.getShareCapital() : BigDecimal.ZERO;
        if (request.shareCapital() != null) {
            member.setShareCapital(request.shareCapital());
        }

        Member saved = memberRepository.save(member);

        if (request.openingBalance() != null && request.openingBalance().compareTo(BigDecimal.ZERO) > 0) {
            billingService.createOpeningBalanceBill(saved, request.openingBalance());
        }

        // Share capital entry — delete old and create new if changed
        if (request.shareCapital() != null
                && request.shareCapital().compareTo(oldShareCapital) != 0) {
            // Delete old entry
            accountEntryRepository.deleteByReference("SC-" + saved.getId());
            // Create new entry only if amount > 0
            if (request.shareCapital().compareTo(BigDecimal.ZERO) > 0) {
                createShareCapitalEntry(saved, request.shareCapital());
            }
        }

        // If flat changed, sync both flats
        if (oldFlatId != null && !oldFlatId.equals(request.flatId())) {
            flatService.markVacant(oldFlatId);
        }
        flatService.markOccupied(newFlat.getId());

        return MemberResponse.from(saved);
    }

    /**
     * Cascade delete.
     *
     * The DB handles:
     *   - complaints (ON DELETE CASCADE)
     *   - payments   (ON DELETE CASCADE)
     *   - poll votes (ON DELETE CASCADE)
     *   - notice acks(ON DELETE CASCADE)
     *
     * The service handles:
     *   - users.member_id  → NULL  (ON DELETE SET NULL in DB — automatic)
     *   - flat status sync → VACANT (if no other members remain)
     */
    @Transactional
    public void delete(Long id) {
        Member member = getOrThrow(id);
        Long flatId = member.getFlat() != null ? member.getFlat().getId() : null;

        memberRepository.delete(member);

        // Reset flat status if no other active members remain
        if (flatId != null) {
            flatService.markVacant(flatId);
        }

        log.info("Member deleted (cascade): id={}, name={}", id, member.getFullName());
    }

    /**
     * Exports all active members as a CSV string.
     * Called by MemberController which streams this as a file download.
     */
    @Transactional(readOnly = true)
    public String exportCsv() {
        List<MemberExportRow> rows = memberRepository.findAllForExport()
            .stream()
            .map(MemberExportRow::from)
            .toList();

        StringWriter sw = new StringWriter();
        sw.write("ID,Full Name,Mobile,Email,Aadhaar,Type,Flat,Wing,Move-In Date,Vehicle,Parking,Status\n");

        for (MemberExportRow r : rows) {
            sw.write(String.format("%d,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                r.id(),
                csvEscape(r.fullName()),
                nvl(r.mobile()),
                nvl(r.email()),
                nvl(r.aadharNumber()),
                nvl(r.memberType()),
                nvl(r.flatNumber()),
                nvl(r.wingName()),
                nvl(r.moveInDate()),
                nvl(r.vehicleNumber()),
                nvl(r.parkingSlot()),
                nvl(r.status())
            ));
        }

        return sw.toString();
    }

    @Transactional
    public MemberResponse moveOut(Long id, java.time.LocalDate moveOutDate) {
        Member member = getOrThrow(id);
        Long flatId = member.getFlat() != null ? member.getFlat().getId() : null;

        // Use direct update query to avoid Lombok setter issues
        java.time.LocalDate outDate = moveOutDate != null ? moveOutDate : java.time.LocalDate.now();
        memberRepository.markMoveOut(id, outDate);

        // Mark flat as VACANT if no other active members remain
        if (flatId != null) {
            long others = memberRepository.findAllActiveWithFlat()
                .stream()
                .filter(m -> !m.getId().equals(id) && m.getFlat() != null && m.getFlat().getId().equals(flatId))
                .count();
            if (others == 0) {
                flatService.markVacant(flatId);
            }
        }

        log.info("Member moved out: id={}, name={}, date={}", id, member.getFullName(), outDate);
        return MemberResponse.from(getOrThrow(id));
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private void createShareCapitalEntry(Member member, java.math.BigDecimal amount) {
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
            Long userId = userRepository.findByUsername(username).map(u -> u.getId()).orElse(null);

            AccountEntry entry = AccountEntry.builder()
                .title("Share Capital — " + member.getFullName())
                .amount(amount)
                .entryType(EntryType.INCOME)
                .category("Share Capital")
                .description("Share capital received from member: " + member.getFullName())
                .entryDate(java.time.LocalDate.now())
                .reference("SC-" + member.getId())
                .isVerified(true)
                .createdBy(userId)
                .build();

            accountEntryRepository.save(entry);
            log.info("Share capital entry created for member: {}", member.getFullName());
        } catch (Exception e) {
            log.error("Failed to create share capital entry: {}", e.getMessage());
        }
    }

    public Member getOrThrow(Long id) {
        return memberRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Member", id));
    }

    private String nvl(String value) {
        return value != null ? value : "";
    }

    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}