package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.StaffRequest;
import com.adityainfotech.societyms.application.dto.request.StaffSalaryRequest;
import com.adityainfotech.societyms.application.dto.response.ApiResponse;
import com.adityainfotech.societyms.application.dto.response.StaffResponse;
import com.adityainfotech.societyms.application.dto.response.StaffSalaryResponse;
import com.adityainfotech.societyms.application.service.StaffService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
@Tag(name = "Staff", description = "Staff management and salary")
public class StaffController {

    private final StaffService staffService;

    // ── Staff CRUD ──────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<StaffResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(staffService.findAll()));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(staffService.getSummary()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<StaffResponse>> create(@RequestBody StaffRequest request) {
        return ResponseEntity.ok(ApiResponse.success(staffService.create(request), "Staff added"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<StaffResponse>> update(
        @PathVariable Long id, @RequestBody StaffRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(staffService.update(id, request), "Staff updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        staffService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Staff deleted"));
    }

    // ── Salary ─────────────────────────────────────────────────────────────

    @GetMapping("/{id}/salary")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<StaffSalaryResponse>>> getSalaryHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(staffService.getSalaryHistory(id)));
    }

    @GetMapping("/salary/month/{month}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlySummary(@PathVariable String month) {
        return ResponseEntity.ok(ApiResponse.success(staffService.getMonthlySummary(month)));
    }

    @PostMapping("/{id}/salary")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<StaffSalaryResponse>> generateSalary(
        @PathVariable Long id, @RequestBody StaffSalaryRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(staffService.generateSalary(id, request), "Salary generated"));
    }

    @PostMapping("/salary/bulk/{month}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<StaffSalaryResponse>>> generateBulkSalary(@PathVariable String month) {
        return ResponseEntity.ok(ApiResponse.success(staffService.generateBulkSalary(month), "Bulk salary generated"));
    }

    @PostMapping("/salary/{salaryId}/pay")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<StaffSalaryResponse>> markPaid(@PathVariable Long salaryId) {
        return ResponseEntity.ok(ApiResponse.success(staffService.markSalaryPaid(salaryId), "Salary marked as paid"));
    }
}