package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.AccountEntryRequest;
import com.adityainfotech.societyms.application.dto.response.*;
import com.adityainfotech.societyms.application.service.AccountService;
import com.adityainfotech.societyms.application.service.BillingService;
import com.adityainfotech.societyms.application.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.time.Month;
import java.util.List;

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','ACCOUNTANT')")
@Tag(name = "Accounts", description = "General ledger entries and account summaries")
class AccountController {

    private final AccountService accountService;

    // ── General Entries (Tab 1) ───────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all account entries")
    public ResponseEntity<ApiResponse<List<AccountEntryResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(accountService.findAll()));
    }

    @GetMapping("/summary")
    @Operation(summary = "Account summary: opening, income, expense, closing balance")
    public ResponseEntity<ApiResponse<AccountSummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(accountService.getSummary()));
    }

    @PostMapping
    @Operation(summary = "Create a new account entry")
    public ResponseEntity<ApiResponse<AccountEntryResponse>> create(
        @Valid @RequestBody AccountEntryRequest request
    ) {
        AccountEntryResponse created = accountService.create(request);
        return ResponseEntity
            .created(URI.create("/api/v1/accounts/" + created.id()))
            .body(ApiResponse.success(created, "Entry created"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an account entry")
    public ResponseEntity<ApiResponse<AccountEntryResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody AccountEntryRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(accountService.update(id, request), "Entry updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an account entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        accountService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Entry deleted"));
    }

    // ── Member Ledger (Tab 3) ─────────────────────────────────────────────────

    @GetMapping("/ledger/{memberId}/annual")
    @Operation(summary = "Get annual statement for a member for a given financial year")
    public ResponseEntity<ApiResponse<MemberLedgerResponse>> getMemberAnnualStatement(
        @PathVariable Long memberId,
        @RequestParam(required = false) String fyStart,
        @RequestParam(required = false) String fyEnd
    ) {
        java.time.LocalDate today = java.time.LocalDate.now();
        int fyStartYear = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
        java.time.LocalDate from = fyStart != null ? java.time.LocalDate.parse(fyStart) : java.time.LocalDate.of(fyStartYear, 4, 1);
        java.time.LocalDate to   = fyEnd   != null ? java.time.LocalDate.parse(fyEnd)   : java.time.LocalDate.of(fyStartYear + 1, 3, 31);
        return ResponseEntity.ok(ApiResponse.success(accountService.getMemberAnnualStatement(memberId, from, to)));
    }

    @GetMapping("/ledger/{memberId}")
    @Operation(summary = "Get Dr/Cr running balance ledger for a member")
    public ResponseEntity<ApiResponse<MemberLedgerResponse>> getMemberLedger(
        @PathVariable Long memberId
    ) {
        return ResponseEntity.ok(ApiResponse.success(accountService.getMemberLedger(memberId)));
    }

    // ── Fund Management (Tab 5) ───────────────────────────────────────────────

    @GetMapping("/funds")
    @Operation(summary = "Get fund balances: Sinking, Repair, Corpus, Reserve")
    public ResponseEntity<ApiResponse<FundSummaryResponse>> getFunds() {
        return ResponseEntity.ok(ApiResponse.success(accountService.getFundSummary()));
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// REPORT CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','ACCOUNTANT')")
@Tag(name = "Reports", description = "Financial, operational and member reports")
class ReportController {

    private final ReportService  reportService;
    private final BillingService billingService;

    /** Default FY: current April 1 → March 31 */
    private LocalDate fyStart() {
        LocalDate now = LocalDate.now();
        int year = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        return LocalDate.of(year, Month.APRIL, 1);
    }
    private LocalDate fyEnd() { return fyStart().plusYears(1).minusDays(1); }

    // ── Financial Reports (Tab 1) ─────────────────────────────────────────────

    @GetMapping("/income-expense")
    @Operation(summary = "Income & Expense report grouped by category")
    public ResponseEntity<ApiResponse<IncomeExpenseReport>> incomeExpense(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            reportService.getIncomeExpenseReport(
                from != null ? from : fyStart(),
                to   != null ? to   : fyEnd()
            )
        ));
    }

    @GetMapping("/balance-sheet")
    @Operation(summary = "Balance Sheet in Tally T-format (Assets | Liabilities)")
    public ResponseEntity<ApiResponse<BalanceSheetReport>> balanceSheet(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            reportService.getBalanceSheet(
                from != null ? from : fyStart(),
                to   != null ? to   : fyEnd()
            )
        ));
    }

    @GetMapping("/trial-balance")
    @Operation(summary = "Trial Balance — Dr side must always equal Cr side")
    public ResponseEntity<ApiResponse<TrialBalanceReport>> trialBalance(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            reportService.getTrialBalance(
                from != null ? from : fyStart(),
                to   != null ? to   : fyEnd()
            )
        ));
    }

    @GetMapping("/cash-book")
    @Operation(summary = "Cash Book: CASH + CHEQUE entries with running balance")
    public ResponseEntity<ApiResponse<CashBankBookReport>> cashBook(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            reportService.getCashBook(
                from != null ? from : fyStart(),
                to   != null ? to   : fyEnd()
            )
        ));
    }

    @GetMapping("/bank-book")
    @Operation(summary = "Bank Book: UPI + NEFT + RTGS + ONLINE entries")
    public ResponseEntity<ApiResponse<CashBankBookReport>> bankBook(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            reportService.getBankBook(
                from != null ? from : fyStart(),
                to   != null ? to   : fyEnd()
            )
        ));
    }

    @GetMapping("/defaulters")
    @Operation(summary = "Members with pending maintenance bills")
    public ResponseEntity<ApiResponse<DefaulterReport>> defaulters() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDefaulters()));
    }

    @GetMapping("/collection-summary")
    @Operation(summary = "Month-wise bill collection summary")
    public ResponseEntity<ApiResponse<List<CollectionSummaryRow>>> collectionSummary() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getCollectionSummary()));
    }
}
