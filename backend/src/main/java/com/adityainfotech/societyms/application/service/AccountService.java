package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.AccountEntryRequest;
import com.adityainfotech.societyms.application.dto.response.*;
import com.adityainfotech.societyms.domain.entity.AccountEntry;
import com.adityainfotech.societyms.domain.entity.MaintenanceBill;
import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.domain.entity.Payment;
import com.adityainfotech.societyms.domain.enums.ApprovalStatus;
import com.adityainfotech.societyms.domain.enums.EntryType;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.*;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Accounts module business logic.
 *
 * Tab 1 – General Entries   : CRUD on account_entries
 * Tab 2 – Maintenance Receipts: reads from payments table (approved only)
 * Tab 3 – Member Ledger     : Dr=bills, Cr=approved payments, running balance
 * Tab 4 – Cash Book         : Cash/Cheque entries + payments
 * Tab 5 – Fund Management   : Sinking/Repair/Corpus/Reserve fund balances
 * Tab 6 – All Payments      : read from payments (already in BillingService)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final AccountEntryJpaRepository  accountRepository;
    private final MaintenanceBillJpaRepository billRepository;
    private final PaymentJpaRepository        paymentRepository;
    private final MemberJpaRepository         memberRepository;
    private final UserJpaRepository           userRepository;

    private static final List<String> FUND_NAMES =
        List.of("Sinking Fund", "Repair Fund", "Corpus Fund", "Reserve Fund");

    // ── TAB 1: General Entries ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AccountEntryResponse> findAll() {
        return accountRepository.findAllByOrderByEntryDateDescCreatedAtDesc()
            .stream().map(AccountEntryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AccountSummaryResponse getSummary() {
        BigDecimal opening = accountRepository.totalOpeningBalance();
        BigDecimal income  = accountRepository.findByEntryTypeOrderByEntryDateDesc(EntryType.INCOME)
            .stream().map(AccountEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expense = accountRepository.findByEntryTypeOrderByEntryDateDesc(EntryType.EXPENSE)
            .stream().map(AccountEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal closing = opening.add(income).subtract(expense);
        return new AccountSummaryResponse(opening, income, expense, closing);
    }

    @Transactional
    public AccountEntryResponse create(AccountEntryRequest request) {
        Long userId = resolveCurrentUserId();

        AccountEntry entry = AccountEntry.builder()
            .title(request.title().trim())
            .amount(request.amount())
            .entryType(request.entryType())
            .category(request.category())
            .subCategory(request.subCategory())
            .description(request.description())
            .entryDate(request.entryDate())
            .reference(request.reference())
            .isVerified(false)
            .createdBy(userId)
            .build();

        return AccountEntryResponse.from(accountRepository.save(entry));
    }

    @Transactional
    public AccountEntryResponse update(Long id, AccountEntryRequest request) {
        AccountEntry entry = getOrThrow(id);
        entry.setTitle(request.title().trim());
        entry.setAmount(request.amount());
        entry.setEntryType(request.entryType());
        entry.setCategory(request.category());
        entry.setSubCategory(request.subCategory());
        entry.setDescription(request.description());
        entry.setEntryDate(request.entryDate());
        entry.setReference(request.reference());
        return AccountEntryResponse.from(accountRepository.save(entry));
    }

    @Transactional
    public void delete(Long id) {
        accountRepository.delete(getOrThrow(id));
    }

    // ── TAB 3: Member Ledger ──────────────────────────────────────────────────

    /**
     * Builds a Dr/Cr running balance ledger for one member.
     *
     * DEBIT  = maintenance bill raised for the member's flat
     * CREDIT = approved payment made by the member
     *
     * A negative closing balance means the member has paid in advance (overpaid).
     */
    @Transactional(readOnly = true)
    public MemberLedgerResponse getMemberAnnualStatement(Long memberId, java.time.LocalDate fyStart, java.time.LocalDate fyEnd) {
        MemberLedgerResponse fullLedger = getMemberLedger(memberId);

        // Opening balance = running balance just before fyStart
        java.math.BigDecimal openingBal = java.math.BigDecimal.ZERO;
        java.util.List<LedgerRow> yearRows = new java.util.ArrayList<>();

        for (LedgerRow row : fullLedger.rows()) {
            if (row.date().isBefore(fyStart)) {
                openingBal = row.balance();
            } else if (!row.date().isAfter(fyEnd)) {
                yearRows.add(row);
            }
        }

        // Prepend opening balance row if non-zero
        java.util.List<LedgerRow> finalRows = new java.util.ArrayList<>();
        if (openingBal.compareTo(java.math.BigDecimal.ZERO) != 0) {
            finalRows.add(new LedgerRow(fyStart, "Opening Balance B/F",
                openingBal.max(java.math.BigDecimal.ZERO),
                openingBal.compareTo(java.math.BigDecimal.ZERO) < 0 ? openingBal.abs() : java.math.BigDecimal.ZERO,
                openingBal, "OPENING", null));
        }
        finalRows.addAll(yearRows);

        java.math.BigDecimal totalDr = yearRows.stream().map(LedgerRow::debit).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal totalCr = yearRows.stream().map(LedgerRow::credit).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal closing = finalRows.isEmpty() ? java.math.BigDecimal.ZERO : finalRows.get(finalRows.size() - 1).balance();

        return new MemberLedgerResponse(
            fullLedger.memberId(), fullLedger.memberName(),
            fullLedger.flatNumber(), fullLedger.wingName(),
            finalRows, totalDr, totalCr, closing,
            closing.compareTo(java.math.BigDecimal.ZERO) < 0
        );
    }

    @Transactional(readOnly = true)
    public MemberLedgerResponse getMemberLedger(Long memberId) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> ResourceNotFoundException.of("Member", memberId));

        if (member.getFlat() == null) {
            return new MemberLedgerResponse(memberId, member.getFullName(),
                null, null, List.of(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, false);
        }

        Long flatId = member.getFlat().getId();

        // All bills for the flat
        List<MaintenanceBill> bills = billRepository.findByFlatIdOrderByBillMonthDesc(flatId);

        // All approved payments from this member
        List<Payment> payments = paymentRepository.findApprovedByFlatId(flatId);

        // Merge and sort by date
        List<LedgerRow> rows = new ArrayList<>();

        for (MaintenanceBill bill : bills) {
            rows.add(new LedgerRow(
                bill.getDueDate() != null ? bill.getDueDate() : bill.getCreatedAt().toLocalDate(),
                "Bill – " + bill.getBillMonth(),
                bill.getTotalDue(), BigDecimal.ZERO,
                BigDecimal.ZERO, // recalculated below
                "BILL",
                bill.getBillMonth()
            ));
        }

        for (Payment pay : payments) {
            rows.add(new LedgerRow(
                pay.getPaymentDate(),
                "Payment – " + pay.getBill().getBillMonth(),
                BigDecimal.ZERO, pay.getAmountPaid(),
                BigDecimal.ZERO,
                "PAYMENT",
                pay.getReceiptNumber()
            ));
        }

        // Sort chronologically
        rows.sort((a, b) -> a.date().compareTo(b.date()));

        // Calculate running balance
        BigDecimal running    = BigDecimal.ZERO;
        BigDecimal totalDr    = BigDecimal.ZERO;
        BigDecimal totalCr    = BigDecimal.ZERO;
        List<LedgerRow> final_ = new ArrayList<>();

        for (LedgerRow row : rows) {
            running = running.add(row.debit()).subtract(row.credit());
            totalDr = totalDr.add(row.debit());
            totalCr = totalCr.add(row.credit());
            final_.add(new LedgerRow(
                row.date(), row.description(),
                row.debit(), row.credit(),
                running,    // running balance after this row
                row.type(), row.reference()
            ));
        }

        boolean hasAdvance = running.compareTo(BigDecimal.ZERO) < 0;

        return new MemberLedgerResponse(
            member.getId(), member.getFullName(),
            member.getFlat().getFlatNumber(),
            member.getFlat().getWing() != null ? member.getFlat().getWing().getName() : null,
            final_, totalDr, totalCr, running, hasAdvance
        );
    }

    // ── TAB 5: Fund Management ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public FundSummaryResponse getFundSummary() {
        List<FundBalance> funds = FUND_NAMES.stream().map(fundName -> {
            List<AccountEntry> entries = accountRepository.findByCategoryOrderByEntryDateDesc(fundName);
            BigDecimal income  = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.INCOME)
                .map(AccountEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal expense = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.EXPENSE)
                .map(AccountEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            return new FundBalance(fundName, income, expense, income.subtract(expense));
        }).toList();

        BigDecimal grandTotal = funds.stream()
            .map(FundBalance::balance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new FundSummaryResponse(funds, grandTotal);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AccountEntry getOrThrow(Long id) {
        return accountRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("AccountEntry", id));
    }

    private Long resolveCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).map(u -> u.getId()).orElse(null);
    }
}
