package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.*;
import com.adityainfotech.societyms.application.dto.response.*;
import com.adityainfotech.societyms.application.service.*;
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
import java.util.List;
import java.util.Map;

// ─────────────────────────────────────────────────────────────────────────────
// COMPLAINT CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Complaint management with role-based status transitions")
class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SECURITY')")
    @Operation(summary = "List all complaints")
    public ResponseEntity<ApiResponse<List<ComplaintResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(complaintService.findAll()));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Member: list own complaints")
    public ResponseEntity<ApiResponse<List<ComplaintResponse>>> findMine(
        @RequestParam Long memberId
    ) {
        return ResponseEntity.ok(ApiResponse.success(complaintService.findByMember(memberId)));
    }

    @PostMapping
    @Operation(summary = "Raise a new complaint")
    public ResponseEntity<ApiResponse<ComplaintResponse>> create(
        @Valid @RequestBody ComplaintRequest request
    ) {
        ComplaintResponse created = complaintService.create(request);
        return ResponseEntity
            .created(URI.create("/api/v1/complaints/" + created.id()))
            .body(ApiResponse.success(created, "Complaint raised successfully"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update complaint status (role restrictions apply)")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody ComplaintStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            complaintService.updateStatus(id, request), "Status updated"
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Delete a complaint")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        complaintService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Complaint deleted"));
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// VISITOR CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/visitors")
@RequiredArgsConstructor
@Tag(name = "Visitors", description = "Visitor entry and exit tracking")
class VisitorController {

    private final VisitorService visitorService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SECURITY','MEMBER')")
    @Operation(summary = "List all visitors (optionally filter by date range)")
    public ResponseEntity<ApiResponse<List<VisitorResponse>>> findAll(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        List<VisitorResponse> result = (from != null && to != null)
            ? visitorService.findByDateRange(from, to)
            : visitorService.findAll();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SECURITY','MEMBER')")
    @Operation(summary = "List visitors currently inside premises")
    public ResponseEntity<ApiResponse<List<VisitorResponse>>> findActive() {
        return ResponseEntity.ok(ApiResponse.success(visitorService.findActive()));
    }

    /** Member च्या flat वर pending approval असलेले visitors */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MEMBER','ADMIN','MANAGER')")
    @Operation(summary = "List visitors pending approval for a member")
    public ResponseEntity<ApiResponse<List<VisitorResponse>>> findPending(
        @RequestParam Long memberId
    ) {
        return ResponseEntity.ok(ApiResponse.success(visitorService.findPendingForMember(memberId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SECURITY')")
    @Operation(summary = "Log a new visitor entry")
    public ResponseEntity<ApiResponse<VisitorResponse>> logEntry(
        @Valid @RequestBody VisitorRequest request
    ) {
        VisitorResponse created = visitorService.logEntry(request);
        return ResponseEntity
            .created(URI.create("/api/v1/visitors/" + created.id()))
            .body(ApiResponse.success(created, "Visitor entry logged"));
    }

    /** Member approves visitor entry */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MEMBER','ADMIN','MANAGER')")
    @Operation(summary = "Approve a visitor entry")
    public ResponseEntity<ApiResponse<VisitorResponse>> approve(
        @PathVariable Long id,
        @RequestBody Map<String, Long> body
    ) {
        Long memberId = body.get("memberId");
        return ResponseEntity.ok(ApiResponse.success(
            visitorService.approveVisitor(id, memberId), "Visitor approved"
        ));
    }

    /** Member denies visitor entry */
    @PatchMapping("/{id}/deny")
    @PreAuthorize("hasAnyRole('MEMBER','ADMIN','MANAGER')")
    @Operation(summary = "Deny a visitor entry")
    public ResponseEntity<ApiResponse<VisitorResponse>> deny(
        @PathVariable Long id,
        @RequestBody Map<String, Long> body
    ) {
        Long memberId = body.get("memberId");
        return ResponseEntity.ok(ApiResponse.success(
            visitorService.denyVisitor(id, memberId), "Visitor denied"
        ));
    }

    @PatchMapping("/{id}/exit")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SECURITY')")
    @Operation(summary = "Record visitor exit")
    public ResponseEntity<ApiResponse<VisitorResponse>> recordExit(
        @PathVariable Long id,
        @RequestBody(required = false) VisitorExitRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            visitorService.recordExit(id, request != null ? request : new VisitorExitRequest(null)),
            "Exit recorded"
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Delete a visitor record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        visitorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Record deleted"));
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// NOTICE CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/notices")
@RequiredArgsConstructor
@Tag(name = "Notices", description = "Notice board with polls and acknowledgements")
class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    @Operation(summary = "List all notices (admin sees all; members see active only)")
    public ResponseEntity<ApiResponse<List<NoticeResponse>>> findAll(
        @RequestParam(required = false, defaultValue = "false") boolean activeOnly
    ) {
        List<NoticeResponse> result = activeOnly
            ? noticeService.findActive()
            : noticeService.findAll();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Create a new notice")
    public ResponseEntity<ApiResponse<NoticeResponse>> create(
        @Valid @RequestBody NoticeRequest request
    ) {
        NoticeResponse created = noticeService.create(request);
        return ResponseEntity
            .created(URI.create("/api/v1/notices/" + created.id()))
            .body(ApiResponse.success(created, "Notice published"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Update a notice")
    public ResponseEntity<ApiResponse<NoticeResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody NoticeRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.update(id, request), "Notice updated"));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Toggle notice active/inactive")
    public ResponseEntity<ApiResponse<NoticeResponse>> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.toggle(id), "Status toggled"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete notice (cascade: poll, votes, acks)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        noticeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Notice deleted"));
    }

    @GetMapping("/{id}/poll")
    @Operation(summary = "Get poll with vote counts for a notice")
    public ResponseEntity<ApiResponse<PollResultResponse>> getPoll(
        @PathVariable Long id,
        @RequestParam(required = false) Long memberId
    ) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.getPollResult(id, memberId)));
    }

    @PostMapping("/{id}/poll")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Create a poll on a notice")
    public ResponseEntity<ApiResponse<PollResultResponse>> createPoll(
        @PathVariable Long id,
        @Valid @RequestBody PollRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.createPoll(id, request), "Poll created"));
    }

    @PutMapping("/{id}/poll")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Update the poll on a notice")
    public ResponseEntity<ApiResponse<PollResultResponse>> updatePoll(
        @PathVariable Long id,
        @Valid @RequestBody PollRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.updatePoll(id, request), "Poll updated"));
    }

    @PostMapping("/{id}/poll/vote")
    @Operation(summary = "Cast a vote on a notice poll")
    public ResponseEntity<ApiResponse<PollResultResponse>> vote(
        @PathVariable Long id,
        @Valid @RequestBody VoteRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.vote(id, request), "Vote recorded"));
    }

    @GetMapping("/{id}/acknowledgements")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Get who has acknowledged a notice")
    public ResponseEntity<ApiResponse<AcknowledgementListResponse>> getAcks(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.getAcknowledgements(id)));
    }

    @PostMapping("/{id}/acknowledge")
    @Operation(summary = "Member acknowledges they have read the notice")
    public ResponseEntity<ApiResponse<Void>> acknowledge(
        @PathVariable Long id,
        @Valid @RequestBody AcknowledgeRequest request
    ) {
        noticeService.acknowledge(id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Acknowledged"));
    }
}