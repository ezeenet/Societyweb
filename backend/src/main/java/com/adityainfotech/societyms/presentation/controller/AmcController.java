package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.AmcContractRequest;
import com.adityainfotech.societyms.application.dto.response.AmcContractResponse;
import com.adityainfotech.societyms.application.dto.response.ApiResponse;
import com.adityainfotech.societyms.application.service.AmcService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/amc")
@RequiredArgsConstructor
public class AmcController {

    private final AmcService amcService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<AmcContractResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(amcService.findAll()));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(amcService.getSummary()));
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<AmcContractResponse>>> getUpcoming(
        @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(ApiResponse.success(amcService.getUpcomingRenewals(days)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<AmcContractResponse>> create(@RequestBody AmcContractRequest request) {
        return ResponseEntity.ok(ApiResponse.success(amcService.create(request), "AMC contract created"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<AmcContractResponse>> update(
        @PathVariable Long id, @RequestBody AmcContractRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(amcService.update(id, request), "AMC contract updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        amcService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "AMC contract deleted"));
    }
}