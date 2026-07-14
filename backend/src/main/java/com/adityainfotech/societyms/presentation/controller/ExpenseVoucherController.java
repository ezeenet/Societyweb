package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.ExpenseVoucherRequest;
import com.adityainfotech.societyms.application.dto.response.ApiResponse;
import com.adityainfotech.societyms.application.dto.response.ExpenseVoucherResponse;
import com.adityainfotech.societyms.application.service.ExpenseVoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/expense-vouchers")
@RequiredArgsConstructor
public class ExpenseVoucherController {

    private final ExpenseVoucherService voucherService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<ExpenseVoucherResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(voucherService.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ExpenseVoucherResponse>> create(@RequestBody ExpenseVoucherRequest request) {
        return ResponseEntity.ok(ApiResponse.success(voucherService.create(request), "Voucher created"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        voucherService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Voucher deleted"));
    }
}