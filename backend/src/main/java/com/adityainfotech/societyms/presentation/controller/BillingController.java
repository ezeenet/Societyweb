package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.BillGenerateRequest;
import com.adityainfotech.societyms.application.dto.request.PaymentRequest;
import com.adityainfotech.societyms.application.dto.request.RejectPaymentRequest;
import com.adityainfotech.societyms.application.dto.request.UpdateBillRequest;
import com.adityainfotech.societyms.application.dto.response.*;
import com.adityainfotech.societyms.application.service.BillingService;
import com.adityainfotech.societyms.domain.entity.User;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@Tag(name = "Billing", description = "Maintenance bill generation, payments, and approvals")
public class BillingController {

    private final BillingService billingService;
    private final UserJpaRepository userJpaRepository;

    // ── Bill Generation ───────────────────────────────────────────────────────

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<BulkGenerateResult>> generateBills(
        @Valid @RequestBody BillGenerateRequest request
    ) {
        BulkGenerateResult result = billingService.generateBillsForAllFlats(request);
        String msg = result.generated() + " bill(s) generated" +
            (result.skipped() > 0 ? ", " + result.skipped() + " skipped (already existed)" : "");
        return ResponseEntity.ok(ApiResponse.success(result, msg));
    }

    // ── Year Close ────────────────────────────────────────────────────────────

    @PostMapping("/year-close")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Year close — pending bills carry forward to new year")
    public ResponseEntity<ApiResponse<Map<String, Object>>> yearClose(
        @RequestParam String newYearMonth
    ) {
        Map<String, Object> result = billingService.yearClose(newYearMonth);
        return ResponseEntity.ok(ApiResponse.success(result, result.get("message").toString()));
    }

    // ── Bill Edit / Delete (ADMIN only) ──────────────────────────────────────

    @PutMapping("/bills/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BillResponse>> updateBill(
        @PathVariable Long id,
        @RequestBody UpdateBillRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(billingService.updateBill(id, request), "Bill updated"));
    }

    @PostMapping("/bills/{id}/unpaid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BillResponse>> markAsUnpaid(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(billingService.markAsUnpaid(id), "Bill marked as unpaid"));
    }

    @DeleteMapping("/bills/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBill(@PathVariable Long id) {
        billingService.deleteBill(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Bill deleted"));
    }

    // ── Bill Queries ──────────────────────────────────────────────────────────

    @GetMapping("/bills")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getAllBills() {
        return ResponseEntity.ok(ApiResponse.success(billingService.findAllBills()));
    }

    @GetMapping("/bills/pending")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getPendingBills() {
        return ResponseEntity.ok(ApiResponse.success(billingService.findPendingBills()));
    }

    @GetMapping("/bills/mine")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getMyBills(
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long memberId = resolveMemberId(principal);
        return ResponseEntity.ok(ApiResponse.success(billingService.findMyBills(memberId)));
    }

    // ── Payment ───────────────────────────────────────────────────────────────

    @PostMapping("/pay")
    public ResponseEntity<ApiResponse<PaymentResponse>> pay(
        @Valid @RequestBody PaymentRequest request
    ) {
        PaymentResponse payment = billingService.recordPayment(request);
        String msg = payment.approvalStatus().name().equals("APPROVED")
            ? "Payment recorded and approved"
            : "Payment submitted — pending admin approval";
        return ResponseEntity.ok(ApiResponse.success(payment, msg));
    }

    // ── Payment Queries ───────────────────────────────────────────────────────

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments() {
        return ResponseEntity.ok(ApiResponse.success(billingService.findAllPayments()));
    }

    @GetMapping("/payments/pending")
    @PreAuthorize("hasAnyRole('ADMIN','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPendingPayments() {
        return ResponseEntity.ok(ApiResponse.success(billingService.findPendingPayments()));
    }

    @GetMapping("/payments/mine")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments(
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long memberId = resolveMemberId(principal);
        return ResponseEntity.ok(ApiResponse.success(billingService.findMyPayments(memberId)));
    }

    // ── Approval ──────────────────────────────────────────────────────────────

    @PostMapping("/payments/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> approvePayment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
            billingService.approvePayment(id), "Payment approved successfully"
        ));
    }

    @PostMapping("/payments/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> rejectPayment(
        @PathVariable Long id,
        @Valid @RequestBody RejectPaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            billingService.rejectPayment(id, request), "Payment rejected"
        ));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Long resolveMemberId(UserDetails principal) {
        User user = userJpaRepository.findByUsername(principal.getUsername())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "User not found: " + principal.getUsername()
            ));
        if (user.getMemberId() == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Account not linked to a member. Please contact admin."
            );
        }
        return user.getMemberId();
    }
}
