package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.FlatRequest;
import com.adityainfotech.societyms.application.dto.request.FlatStatusRequest;
import com.adityainfotech.societyms.application.dto.request.MemberRequest;
import com.adityainfotech.societyms.application.dto.request.WingRequest;
import com.adityainfotech.societyms.application.dto.response.*;
import com.adityainfotech.societyms.application.service.FlatService;
import com.adityainfotech.societyms.application.service.MemberService;
import com.adityainfotech.societyms.application.service.WingService;
import com.adityainfotech.societyms.domain.enums.FlatStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

// ─────────────────────────────────────────────────────────────────────────────
// WING CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/wings")
@RequiredArgsConstructor
@Tag(name = "Wings", description = "Building wing management")
class WingController {

    private final WingService wingService;

    @GetMapping
    @Operation(summary = "List all wings with flat counts")
    public ResponseEntity<ApiResponse<List<WingResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(wingService.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Create a new wing")
    public ResponseEntity<ApiResponse<WingResponse>> create(@Valid @RequestBody WingRequest request) {
        WingResponse created = wingService.create(request);
        return ResponseEntity
            .created(URI.create("/api/v1/wings/" + created.id()))
            .body(ApiResponse.success(created, "Wing created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Update a wing")
    public ResponseEntity<ApiResponse<WingResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody WingRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(wingService.update(id, request), "Wing updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a wing (only if it has no flats)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        wingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Wing deleted successfully"));
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// FLAT CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/flats")
@RequiredArgsConstructor
@Tag(name = "Flats", description = "Flat management within wings")
class FlatController {

    private final FlatService flatService;

    @GetMapping
    @Operation(summary = "List all flats (optional filter by wingId or status)")
    public ResponseEntity<ApiResponse<List<FlatResponse>>> findAll(
        @RequestParam(required = false) Long wingId,
        @RequestParam(required = false) FlatStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success(flatService.findAll(wingId, status)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get flat by ID")
    public ResponseEntity<ApiResponse<FlatResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(flatService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Add a new flat to a wing")
    public ResponseEntity<ApiResponse<FlatResponse>> create(@Valid @RequestBody FlatRequest request) {
        FlatResponse created = flatService.create(request);
        return ResponseEntity
            .created(URI.create("/api/v1/flats/" + created.id()))
            .body(ApiResponse.success(created, "Flat created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Update flat details")
    public ResponseEntity<ApiResponse<FlatResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody FlatRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(flatService.update(id, request), "Flat updated"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Override flat status (VACANT/OCCUPIED)")
    public ResponseEntity<ApiResponse<FlatResponse>> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody FlatStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(flatService.updateStatus(id, request), "Status updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a flat (only if vacant)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        flatService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Flat deleted successfully"));
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// MEMBER CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
@Tag(name = "Members", description = "Society member management")
class MemberController {

    private final MemberService memberService;

    @GetMapping
    @Operation(summary = "List all members (paginated with search)")
    public ResponseEntity<ApiResponse<Page<MemberResponse>>> findAll(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
        return ResponseEntity.ok(ApiResponse.success(memberService.search(search, pageable)));
    }

    @GetMapping("/all")
    @Operation(summary = "List all members — active + optionally inactive")
    public ResponseEntity<ApiResponse<List<MemberResponse>>> findAllList(
        @RequestParam(defaultValue = "false") boolean includeInactive
    ) {
        return ResponseEntity.ok(ApiResponse.success(memberService.findAll(includeInactive)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get member by ID")
    public ResponseEntity<ApiResponse<MemberResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(memberService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Add a new member")
    public ResponseEntity<ApiResponse<MemberResponse>> create(@Valid @RequestBody MemberRequest request) {
        MemberResponse created = memberService.create(request);
        return ResponseEntity
            .created(URI.create("/api/v1/members/" + created.id()))
            .body(ApiResponse.success(created, "Member added successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Update member details")
    public ResponseEntity<ApiResponse<MemberResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody MemberRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(memberService.update(id, request), "Member updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete member (cascade: complaints, payments, votes, acks)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        memberService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Member deleted successfully"));
    }

    @PostMapping("/{id}/move-out")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Mark member as moved out (inactive)")
    public ResponseEntity<ApiResponse<MemberResponse>> moveOut(
        @PathVariable Long id,
        @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate moveOutDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            memberService.moveOut(id, moveOutDate), "Member moved out successfully"
        ));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Export all members as CSV")
    public ResponseEntity<byte[]> exportCsv() {
        String csv      = memberService.exportCsv();
        String filename = "members-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".csv";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv.getBytes());
    }
}
