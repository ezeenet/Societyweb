package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.*;
import com.adityainfotech.societyms.application.dto.response.*;
import com.adityainfotech.societyms.application.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.util.List;

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "12 KPI metrics for the main dashboard")
class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "Get all 12 dashboard KPI values in one call")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStats()));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@Tag(name = "Settings", description = "Society settings and logo management")
class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    @Operation(summary = "Get society settings")
    public ResponseEntity<ApiResponse<SettingsResponse>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getSettings()));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update society settings (4 sections)")
    public ResponseEntity<ApiResponse<SettingsResponse>> updateSettings(
        @Valid @RequestBody SettingsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateSettings(request), "Settings saved"));
    }

    @PostMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload society logo (PNG/JPG, max 2MB)")
    public ResponseEntity<ApiResponse<SettingsResponse>> uploadLogo(
        @RequestParam("file") MultipartFile file
    ) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File is empty", "EMPTY_FILE"));
        }
        return ResponseEntity.ok(ApiResponse.success(settingsService.uploadLogo(file), "Logo uploaded"));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "User Management", description = "User CRUD, role assignment, and activity log")
class UserManagementController {

    private final UserManagementService userService;

    @GetMapping
    @Operation(summary = "List all system users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(userService.findAll()));
    }

    @PostMapping
    @Operation(summary = "Create a new user")
    public ResponseEntity<ApiResponse<UserResponse>> create(
        @Valid @RequestBody UserCreateRequest request
    ) {
        UserResponse created = userService.create(request);
        return ResponseEntity
            .created(URI.create("/api/v1/users/" + created.id()))
            .body(ApiResponse.success(created, "User created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user details, role, or member link")
    public ResponseEntity<ApiResponse<UserResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody UserUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.update(id, request), "User updated"));
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Toggle user active/inactive")
    public ResponseEntity<ApiResponse<UserResponse>> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.toggleActive(id), "Status toggled"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a user (cannot delete own account)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted"));
    }

    @GetMapping("/activity-log")
    @Operation(summary = "Paginated activity log — filter by username")
    public ResponseEntity<ApiResponse<Page<ActivityLogResponse>>> getActivityLog(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0")   int page,
        @RequestParam(defaultValue = "25")  int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(userService.getActivityLog(search, pageable)));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Document upload, download, and management")
class DocumentController {

    private final DocumentService documentService;

    @GetMapping
    @Operation(summary = "List documents (optional filter by type)")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> findAll(
        @RequestParam(required = false) String type
    ) {
        return ResponseEntity.ok(ApiResponse.success(documentService.findAll(type)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Upload a document")
    public ResponseEntity<ApiResponse<DocumentResponse>> upload(
        @RequestParam("title")        String title,
        @RequestParam("documentType") String documentType,
        @RequestParam(value = "memberId", required = false) Long memberId,
        @RequestParam("file")         MultipartFile file
    ) throws IOException {
        DocumentResponse created = documentService.upload(title, documentType, memberId, file);
        return ResponseEntity
            .created(URI.create("/api/v1/documents/" + created.id()))
            .body(ApiResponse.success(created, "Document uploaded"));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download a document file")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws IOException {
        var path     = documentService.getFilePath(id);
        var resource = new PathResource(path);

        String contentType = Files.probeContentType(path);
        if (contentType == null) contentType = "application/octet-stream";

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + path.getFileName() + "\"")
            .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a document (file + DB record)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        documentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Document deleted"));
    }
}
