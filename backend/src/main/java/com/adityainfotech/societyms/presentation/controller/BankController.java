package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.BankAccountRequest;
import com.adityainfotech.societyms.application.dto.request.BankTransactionRequest;
import com.adityainfotech.societyms.application.dto.response.ApiResponse;
import com.adityainfotech.societyms.application.dto.response.BankAccountResponse;
import com.adityainfotech.societyms.application.dto.response.BankTransactionResponse;
import com.adityainfotech.societyms.application.service.BankService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bank")
@RequiredArgsConstructor
public class BankController {

    private final BankService bankService;

    @GetMapping("/accounts")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> findAllAccounts() {
        return ResponseEntity.ok(ApiResponse.success(bankService.findAllAccounts()));
    }

    @PostMapping("/accounts")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<BankAccountResponse>> createAccount(@RequestBody BankAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.success(bankService.createAccount(request), "Account created"));
    }

    @PutMapping("/accounts/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<BankAccountResponse>> updateAccount(
        @PathVariable Long id, @RequestBody BankAccountRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(bankService.updateAccount(id, request), "Account updated"));
    }

    @DeleteMapping("/accounts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable Long id) {
        bankService.deleteAccount(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Account deleted"));
    }

    @GetMapping("/accounts/{id}/transactions")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<BankTransactionResponse>>> getTransactions(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(bankService.getTransactions(id)));
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<BankTransactionResponse>> addTransaction(@RequestBody BankTransactionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(bankService.addTransaction(request), "Transaction added"));
    }

    @DeleteMapping("/transactions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable Long id) {
        bankService.deleteTransaction(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Transaction deleted"));
    }
}