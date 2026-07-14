package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.dto.request.ParkingSlotRequest;
import com.adityainfotech.societyms.application.dto.response.ApiResponse;
import com.adityainfotech.societyms.application.dto.response.ParkingSlotResponse;
import com.adityainfotech.societyms.application.service.ParkingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/parking")
@RequiredArgsConstructor
@Tag(name = "Parking", description = "Parking slot management")
public class ParkingController {

    private final ParkingService parkingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParkingSlotResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(parkingService.findAll()));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(parkingService.getSummary()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> create(
        @RequestBody ParkingSlotRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(parkingService.create(request), "Parking slot created"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> update(
        @PathVariable Long id,
        @RequestBody ParkingSlotRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(parkingService.update(id, request), "Parking slot updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        parkingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Slot deleted"));
    }

    @PostMapping("/{slotId}/assign/{memberId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> assign(
        @PathVariable Long slotId,
        @PathVariable Long memberId
    ) {
        return ResponseEntity.ok(ApiResponse.success(parkingService.assign(slotId, memberId), "Slot assigned"));
    }

    @PostMapping("/{slotId}/unassign")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> unassign(@PathVariable Long slotId) {
        return ResponseEntity.ok(ApiResponse.success(parkingService.unassign(slotId), "Slot unassigned"));
    }
}