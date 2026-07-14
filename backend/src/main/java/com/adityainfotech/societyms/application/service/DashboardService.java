package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.response.DashboardStatsResponse;
import com.adityainfotech.societyms.domain.enums.*;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Aggregates all 12 dashboard KPI cards in a single service call.
 * Each repository call is a COUNT or SUM query — no full entity load.
 *
 * KPI groups:
 *   Property   : totalMembers, totalFlats, occupiedFlats, vacantFlats
 *   Financial  : pendingBills, totalCollected, totalIncome, totalExpense
 *   Operations : openComplaints, visitorsToday, activeNotices, bankBalance
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MemberJpaRepository          memberRepository;
    private final FlatJpaRepository            flatRepository;
    private final MaintenanceBillJpaRepository billRepository;
    private final PaymentJpaRepository         paymentRepository;
    private final AccountEntryJpaRepository    accountRepository;
    private final ComplaintJpaRepository       complaintRepository;
    private final VisitorJpaRepository         visitorRepository;
    private final NoticeJpaRepository          noticeRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {

        // ── Property ──────────────────────────────────────────────────────────
        long totalMembers  = memberRepository.countByIsActiveTrue();
        long totalFlats    = flatRepository.count();
        long occupiedFlats = flatRepository.countByStatus(FlatStatus.OCCUPIED);
        long vacantFlats   = flatRepository.countByStatus(FlatStatus.VACANT);

        // ── Financial ─────────────────────────────────────────────────────────
        long pendingBills       = billRepository.countByStatus(BillStatus.PENDING);
        BigDecimal totalCollected = paymentRepository.sumApprovedPayments();

        // Total income = all INCOME account entries (FY-wide for quick dashboard view)
        LocalDate fyStart = currentFyStart();
        LocalDate fyEnd   = fyStart.plusYears(1).minusDays(1);

        BigDecimal totalIncome  = accountRepository.sumByTypeAndDateRange(EntryType.INCOME,  fyStart, fyEnd);
        BigDecimal totalExpense = accountRepository.sumByTypeAndDateRange(EntryType.EXPENSE, fyStart, fyEnd);

        // ── Operations ────────────────────────────────────────────────────────
        long openComplaints = complaintRepository.countByStatus(ComplaintStatus.OPEN);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);
        long visitorsToday = visitorRepository.countTodayVisitors(startOfDay, endOfDay);

        long activeNotices  = noticeRepository.countByIsActiveTrue();

        // Bank balance ≈ sum of UPI/NEFT/RTGS/ONLINE approved payments
        // (approximate — full bank book is in Reports)
        BigDecimal bankBalance = paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED)
            .stream()
            .filter(p -> p.getPaymentMode().isBankMode())
            .map(p -> p.getAmountPaid())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardStatsResponse(
            totalMembers, totalFlats, occupiedFlats, vacantFlats,
            pendingBills, totalCollected, totalIncome, totalExpense,
            openComplaints, visitorsToday, activeNotices, bankBalance
        );
    }

    private LocalDate currentFyStart() {
        LocalDate now  = LocalDate.now();
        int year = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        return LocalDate.of(year, 4, 1);
    }
}
