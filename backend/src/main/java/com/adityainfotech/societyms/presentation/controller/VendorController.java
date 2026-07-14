package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.VendorRequest;
import com.adityainfotech.societyms.application.dto.response.ApiResponse;
import com.adityainfotech.societyms.application.dto.response.VendorResponse;
import com.adityainfotech.societyms.application.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<VendorResponse>>> findAll(
        @RequestParam(defaultValue = "false") boolean activeOnly
    ) {
        return ResponseEntity.ok(ApiResponse.success(activeOnly ? vendorService.findActive() : vendorService.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<VendorResponse>> create(@RequestBody VendorRequest request) {
        return ResponseEntity.ok(ApiResponse.success(vendorService.create(request), "Vendor added"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNTANT')")
    public ResponseEntity<ApiResponse<VendorResponse>> update(
        @PathVariable Long id, @RequestBody VendorRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(vendorService.update(id, request), "Vendor updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        vendorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Vendor deleted"));
    }
}