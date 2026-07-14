package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.response.*;
import com.adityainfotech.societyms.domain.entity.*;
import com.adityainfotech.societyms.domain.enums.*;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Report generation service.
 *
 * All financial reports honour the financial year window (default Apr 1 – Mar 31).
 *
 * TRIAL BALANCE invariant: Dr must always = Cr.
 *   Dr side: Cash-in-Hand + Bank Balance + All Expenses
 *   Cr side: Maintenance Income + Opening Balance + Other Income
 *
 * BALANCE SHEET is in Tally-style T-format:
 *   Liabilities (left) : Capital + Reserves + Funds
 *   Assets      (right): Cash + Bank + Pending Dues
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final AccountEntryJpaRepository    accountRepository;
    private final MaintenanceBillJpaRepository billRepository;
    private final PaymentJpaRepository         paymentRepository;
    private final MemberJpaRepository          memberRepository;
    private final ComplaintJpaRepository       complaintRepository;
    private final VisitorJpaRepository         visitorRepository;
    private final NoticeJpaRepository          noticeRepository;
    private final com.adityainfotech.societyms.infrastructure.persistence.jpa.BankTransactionJpaRepository bankTransactionRepository;

    // ═══════════════════════════════════════════════════════════════════════════
    // FINANCIAL REPORTS
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Income & Expense ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public IncomeExpenseReport getIncomeExpenseReport(LocalDate from, LocalDate to) {
        List<AccountEntry> entries = accountRepository.findByDateRange(from, to);

        // Group income by category
        Map<String, BigDecimal> incomeMap = entries.stream()
            .filter(e -> e.getEntryType() == EntryType.INCOME)
            .collect(Collectors.groupingBy(
                e -> e.getCategory() != null ? e.getCategory() : "Other",
                Collectors.reducing(BigDecimal.ZERO, AccountEntry::getAmount, BigDecimal::add)
            ));

        // Also add maintenance receipts from payments table
        List<Payment> payments = paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED);
        BigDecimal maintenanceIncome = payments.stream()
            .filter(p -> {
                LocalDate pd = p.getPaymentDate();
                return !pd.isBefore(from) && !pd.isAfter(to);
            })
            .map(Payment::getAmountPaid)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        incomeMap.merge("Maintenance Income", maintenanceIncome, BigDecimal::add);

        // Group expense by category
        Map<String, BigDecimal> expenseMap = entries.stream()
            .filter(e -> e.getEntryType() == EntryType.EXPENSE)
            .collect(Collectors.groupingBy(
                e -> e.getCategory() != null ? e.getCategory() : "Other",
                Collectors.reducing(BigDecimal.ZERO, AccountEntry::getAmount, BigDecimal::add)
            ));

        // Build merged rows
        Set<String> allCategories = new LinkedHashSet<>();
        allCategories.addAll(incomeMap.keySet());
        allCategories.addAll(expenseMap.keySet());

        List<IncomeExpenseRow> rows = allCategories.stream()
            .map(cat -> {
                BigDecimal inc = incomeMap.getOrDefault(cat, BigDecimal.ZERO);
                BigDecimal exp = expenseMap.getOrDefault(cat, BigDecimal.ZERO);
                return new IncomeExpenseRow(cat, inc, exp, inc.subtract(exp));
            })
            .sorted(Comparator.comparing(r -> r.income().negate()))
            .toList();

        BigDecimal totalIncome  = rows.stream().map(IncomeExpenseRow::income).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = rows.stream().map(IncomeExpenseRow::expense).reduce(BigDecimal.ZERO, BigDecimal::add);

        return new IncomeExpenseReport(
            fyLabel(from), from, to, rows,
            totalIncome, totalExpense, totalIncome.subtract(totalExpense)
        );
    }

    // ── Trial Balance — Dr must = Cr ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public TrialBalanceReport getTrialBalance(LocalDate from, LocalDate to) {
        List<AccountEntry> entries = accountRepository.findByDateRange(from, to);

        // === DEBIT SIDE ===
        // Cash-in-Hand: CASH + CHEQUE payments + Cash category account entries (INCOME type)
        BigDecimal cashPayments = paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED)
            .stream()
            .filter(p -> {
                LocalDate pd = p.getPaymentDate();
                return !pd.isBefore(from) && !pd.isAfter(to) &&
                    (p.getPaymentMode() == PaymentMode.CASH || p.getPaymentMode() == PaymentMode.CHEQUE);
            })
            .map(Payment::getAmountPaid)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashAccountEntries = entries.stream()
            .filter(e -> "Cash".equals(e.getCategory()) && e.getEntryType() == EntryType.INCOME)
            .map(AccountEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashInHand = cashPayments.add(cashAccountEntries);

        // Bank Balance: UPI + NEFT + RTGS + ONLINE payments + Bank category entries
        BigDecimal bankPayments = paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED)
            .stream()
            .filter(p -> {
                LocalDate pd = p.getPaymentDate();
                return !pd.isBefore(from) && !pd.isAfter(to) && p.getPaymentMode().isBankMode();
            })
            .map(Payment::getAmountPaid)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bankAccountEntries = entries.stream()
            .filter(e -> "Bank".equals(e.getCategory()) && e.getEntryType() == EntryType.INCOME)
            .map(AccountEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bankBalance = bankPayments.add(bankAccountEntries);

        // All expenses (Dr)
        Map<String, BigDecimal> expensesByCategory = entries.stream()
            .filter(e -> e.getEntryType() == EntryType.EXPENSE)
            .collect(Collectors.groupingBy(
                e -> e.getCategory() != null ? e.getCategory() : "Other Expense",
                Collectors.reducing(BigDecimal.ZERO, AccountEntry::getAmount, BigDecimal::add)
            ));

        // === CREDIT SIDE ===
        BigDecimal maintenanceIncomeCr = paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED)
            .stream()
            .filter(p -> {
                LocalDate pd = p.getPaymentDate();
                return !pd.isBefore(from) && !pd.isAfter(to);
            })
            .map(Payment::getAmountPaid)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal openingBalanceCr = accountRepository.totalOpeningBalance();

        Map<String, BigDecimal> otherIncomeCr = entries.stream()
            .filter(e -> e.getEntryType() == EntryType.INCOME
                && !"Cash".equals(e.getCategory())
                && !"Bank".equals(e.getCategory()))
            .collect(Collectors.groupingBy(
                e -> e.getCategory() != null ? e.getCategory() : "Other Income",
                Collectors.reducing(BigDecimal.ZERO, AccountEntry::getAmount, BigDecimal::add)
            ));

        // Build rows
        List<TrialBalanceRow> rows = new ArrayList<>();
        rows.add(new TrialBalanceRow("Cash-in-Hand",    cashInHand,    BigDecimal.ZERO));
        rows.add(new TrialBalanceRow("Bank Balance",    bankBalance,   BigDecimal.ZERO));
        expensesByCategory.forEach((cat, amt) ->
            rows.add(new TrialBalanceRow(cat, amt, BigDecimal.ZERO)));
        rows.add(new TrialBalanceRow("Opening Balance", BigDecimal.ZERO, openingBalanceCr));
        rows.add(new TrialBalanceRow("Maintenance Income", BigDecimal.ZERO, maintenanceIncomeCr));
        otherIncomeCr.forEach((cat, amt) ->
            rows.add(new TrialBalanceRow(cat, BigDecimal.ZERO, amt)));

        BigDecimal totalDr = rows.stream().map(TrialBalanceRow::debit).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCr = rows.stream().map(TrialBalanceRow::credit).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Balance the trial balance (rounding safe)
        boolean isBalanced = totalDr.subtract(totalCr).abs().compareTo(new BigDecimal("0.01")) < 0;
        log.info("Trial Balance: Dr={} Cr={} Balanced={}", totalDr, totalCr, isBalanced);

        return new TrialBalanceReport(fyLabel(from), rows, totalDr, totalCr, isBalanced);
    }

    // ── Balance Sheet — T-Format ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public BalanceSheetReport getBalanceSheet(LocalDate from, LocalDate to) {
        // Assets
        List<AccountEntry> entries = accountRepository.findByDateRange(from, to);

        BigDecimal cashInHand = paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED)
            .stream()
            .filter(p -> !p.getPaymentDate().isBefore(from) && !p.getPaymentDate().isAfter(to)
                && (p.getPaymentMode() == PaymentMode.CASH || p.getPaymentMode() == PaymentMode.CHEQUE))
            .map(Payment::getAmountPaid)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bankBalance = paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED)
            .stream()
            .filter(p -> !p.getPaymentDate().isBefore(from) && !p.getPaymentDate().isAfter(to)
                && p.getPaymentMode().isBankMode())
            .map(Payment::getAmountPaid)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingDues = billRepository.sumPendingDues();

        List<BalanceSheetItem> assets = List.of(
            new BalanceSheetItem("Cash-in-Hand",    cashInHand),
            new BalanceSheetItem("Bank Balance",    bankBalance),
            new BalanceSheetItem("Pending Dues",    pendingDues)
        );
        BigDecimal totalAssets = assets.stream().map(BalanceSheetItem::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Liabilities — Bye-laws Format ────────────────────────────────────
        // Share Capital from account entries
        BigDecimal shareCapital = accountRepository.findByDateRange(
                java.time.LocalDate.of(2000, 1, 1), to)
            .stream()
            .filter(e -> "Share Capital".equals(e.getCategory()) && e.getEntryType() == EntryType.INCOME)
            .map(AccountEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Reserve Fund (Statutory — 25% of surplus as per bye-laws)
        BigDecimal totalIncome  = entries.stream()
            .filter(e -> e.getEntryType() == EntryType.INCOME)
            .map(AccountEntry::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = entries.stream()
            .filter(e -> e.getEntryType() == EntryType.EXPENSE)
            .map(AccountEntry::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Include maintenance income in surplus
        BigDecimal maintenanceIncome = paymentRepository
            .findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED)
            .stream()
            .filter(p -> !p.getPaymentDate().isBefore(from) && !p.getPaymentDate().isAfter(to))
            .map(Payment::getAmountPaid)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossSurplus = totalIncome.add(maintenanceIncome).subtract(totalExpense);
        BigDecimal surplus      = grossSurplus.max(BigDecimal.ZERO);

        BigDecimal reserveFund = accountRepository.getFundBalance("Reserve Fund");
        BigDecimal sinkingFund = accountRepository.getFundBalance("Sinking Fund");
        BigDecimal repairFund  = accountRepository.getFundBalance("Repair Fund");
        BigDecimal corpusFund  = accountRepository.getFundBalance("Corpus Fund");

        List<BalanceSheetItem> liabilities = new java.util.ArrayList<>(List.of(
            new BalanceSheetItem("Share Capital (Members' Fund)", shareCapital),
            new BalanceSheetItem("Reserve Fund (Statutory)",      reserveFund),
            new BalanceSheetItem("Sinking Fund",                  sinkingFund),
            new BalanceSheetItem("Repair & Maintenance Fund",     repairFund),
            new BalanceSheetItem("Corpus Fund",                   corpusFund),
            new BalanceSheetItem("Surplus from I&E Account",      surplus)
        ));
        BigDecimal totalLiabilities = liabilities.stream().map(BalanceSheetItem::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Assets — Bye-laws Format ──────────────────────────────────────────
        List<BalanceSheetItem> byeLawAssets = new java.util.ArrayList<>(List.of(
            new BalanceSheetItem("Cash in Hand",                          cashInHand),
            new BalanceSheetItem("Cash at Bank",                          bankBalance),
            new BalanceSheetItem("Outstanding Maintenance (Receivables)", pendingDues)
        ));
        BigDecimal totalByeLawAssets = byeLawAssets.stream().map(BalanceSheetItem::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new BalanceSheetReport(fyLabel(from), liabilities, byeLawAssets, totalLiabilities, totalByeLawAssets);
    }

    // ── Cash Book ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CashBankBookReport getCashBook(LocalDate from, LocalDate to) {
        List<BookEntry> entries = new ArrayList<>();

        // Cash/Cheque approved payments
        paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED)
            .stream()
            .filter(p -> !p.getPaymentDate().isBefore(from) && !p.getPaymentDate().isAfter(to)
                && p.getPaymentMode().isCashMode())
            .forEach(p -> entries.add(new BookEntry(
                p.getPaymentDate(),
                "Receipt: " + p.getMember().getFullName() + " – " + p.getBill().getBillMonth(),
                p.getPaymentMode().name(),
                p.getAmountPaid(), BigDecimal.ZERO, BigDecimal.ZERO
            )));

        // Cash account entries
        accountRepository.findCashEntries(from, to).forEach(e -> entries.add(new BookEntry(
            e.getEntryDate(), e.getTitle(),
            e.getEntryType().name(),
            e.getEntryType() == EntryType.INCOME ? e.getAmount() : BigDecimal.ZERO,
            e.getEntryType() == EntryType.EXPENSE ? e.getAmount() : BigDecimal.ZERO,
            BigDecimal.ZERO
        )));

        return buildBook("Cash Book", from, to, entries);
    }

    // ── Bank Book ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CashBankBookReport getBankBook(LocalDate from, LocalDate to) {
        List<BookEntry> entries = new ArrayList<>();

        paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED)
            .stream()
            .filter(p -> !p.getPaymentDate().isBefore(from) && !p.getPaymentDate().isAfter(to)
                && p.getPaymentMode().isBankMode())
            .forEach(p -> entries.add(new BookEntry(
                p.getPaymentDate(),
                "Receipt: " + p.getMember().getFullName() + " – " + p.getBill().getBillMonth(),
                p.getPaymentMode().name(),
                p.getAmountPaid(), BigDecimal.ZERO, BigDecimal.ZERO
            )));

        accountRepository.findBankEntries(from, to).forEach(e -> entries.add(new BookEntry(
            e.getEntryDate(), e.getTitle(),
            e.getEntryType().name(),
            e.getEntryType() == EntryType.INCOME ? e.getAmount() : BigDecimal.ZERO,
            e.getEntryType() == EntryType.EXPENSE ? e.getAmount() : BigDecimal.ZERO,
            BigDecimal.ZERO
        )));

        // Bank Module transactions (Deposit/Withdrawal across all bank accounts)
        bankTransactionRepository.findAll().stream()
            .filter(t -> !t.getTransactionDate().isBefore(from) && !t.getTransactionDate().isAfter(to))
            .forEach(t -> entries.add(new BookEntry(
                t.getTransactionDate(),
                (t.getDescription() != null ? t.getDescription() : t.getTransactionType())
                    + " (" + t.getBankAccount().getAccountName() + ")",
                t.getTransactionType(),
                "DEPOSIT".equals(t.getTransactionType()) ? t.getAmount() : BigDecimal.ZERO,
                "WITHDRAWAL".equals(t.getTransactionType()) ? t.getAmount() : BigDecimal.ZERO,
                BigDecimal.ZERO
            )));

        return buildBook("Bank Book", from, to, entries);
    }

    // ── Defaulter Report ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DefaulterReport getDefaulters() {
        List<DefaulterRow> rows = new ArrayList<>();

        memberRepository.findAllWithFlat().forEach(member -> {
            if (member.getFlat() == null) return;

            List<MaintenanceBill> pending = billRepository
                .findByFlatIdOrderByBillMonthDesc(member.getFlat().getId())
                .stream()
                .filter(b -> b.getStatus() == BillStatus.PENDING)
                .toList();

            if (!pending.isEmpty()) {
                BigDecimal totalDue = pending.stream()
                    .map(MaintenanceBill::getTotalDue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                List<DefaulterBillDetail> billDetails = pending.stream()
                    .map(b -> new DefaulterBillDetail(b.getBillMonth(), b.getTotalDue(), b.getDueDate()))
                    .toList();

                rows.add(new DefaulterRow(
                    member.getId(), member.getFullName(),
                    member.getFlat().getFlatNumber(),
                    member.getFlat().getWing() != null ? member.getFlat().getWing().getName() : null,
                    totalDue, pending.size(), billDetails
                ));
            }
        });

        rows.sort(Comparator.comparing(DefaulterRow::totalDue).reversed());
        BigDecimal totalOutstanding = rows.stream()
            .map(DefaulterRow::totalDue).reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DefaulterReport(rows, totalOutstanding);
    }

    // ── Collection Summary ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CollectionSummaryRow> getCollectionSummary() {
        List<MaintenanceBill> allBills = billRepository
            .findAllByOrderByBillMonthDescFlat_Wing_NameAscFlat_FlatNumberAsc();

        Map<String, List<MaintenanceBill>> byMonth = allBills.stream()
            .collect(Collectors.groupingBy(MaintenanceBill::getBillMonth));

        return byMonth.entrySet().stream()
            .sorted(Map.Entry.<String, List<MaintenanceBill>>comparingByKey().reversed())
            .map(e -> {
                List<MaintenanceBill> bills = e.getValue();
                int paid    = (int) bills.stream().filter(b -> b.getStatus() == BillStatus.PAID).count();
                int pending = bills.size() - paid;
                BigDecimal billed    = bills.stream().map(MaintenanceBill::getTotalDue).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal collected = bills.stream()
                    .filter(b -> b.getStatus() == BillStatus.PAID)
                    .map(MaintenanceBill::getTotalDue).reduce(BigDecimal.ZERO, BigDecimal::add);
                return new CollectionSummaryRow(e.getKey(), bills.size(), paid, pending,
                    billed, collected, billed.subtract(collected));
            })
            .toList();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    private CashBankBookReport buildBook(String bookType, LocalDate from, LocalDate to,
                                          List<BookEntry> unsorted) {
        unsorted.sort(Comparator.comparing(BookEntry::date));

        BigDecimal running  = BigDecimal.ZERO;
        BigDecimal totRec   = BigDecimal.ZERO;
        BigDecimal totPay   = BigDecimal.ZERO;
        List<BookEntry> out = new ArrayList<>();

        for (BookEntry e : unsorted) {
            running = running.add(e.receipts()).subtract(e.payments());
            totRec  = totRec.add(e.receipts());
            totPay  = totPay.add(e.payments());
            out.add(new BookEntry(e.date(), e.particulars(), e.voucherType(),
                e.receipts(), e.payments(), running));
        }

        return new CashBankBookReport(bookType, from, to,
            BigDecimal.ZERO, out, totRec, totPay, running);
    }

    private String fyLabel(LocalDate from) {
        int startYear = from.getMonthValue() >= 4 ? from.getYear() : from.getYear() - 1;
        return startYear + "-" + String.format("%02d", (startYear + 1) % 100);
    }

    // Expose complaint/visitor/notice repos for Report controller
    public ComplaintJpaRepository getComplaintRepo()  { return complaintRepository; }
    public VisitorJpaRepository   getVisitorRepo()    { return visitorRepository; }
    public NoticeJpaRepository    getNoticeRepo()     { return noticeRepository; }
    public MemberJpaRepository    getMemberRepo()     { return memberRepository; }
}
