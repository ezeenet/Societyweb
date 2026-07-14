package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Visitor;
import java.time.LocalDateTime;

public record VisitorResponse(
    Long id, String visitorName, String mobile, String purpose,
    Long flatId, String flatNumber, String wingName,
    Long hostMemberId, String hostMemberName,
    LocalDateTime entryTime, LocalDateTime exitTime,
    String vehicleNo, boolean insidePremises,
    String approvalStatus,
    Long approvedByMemberId,
    LocalDateTime approvedAt,
    LocalDateTime createdAt
) {
    public static VisitorResponse from(Visitor v) {
        return new VisitorResponse(
            v.getId(), v.getVisitorName(), v.getMobile(), v.getPurpose(),
            v.getFlat() != null ? v.getFlat().getId() : null,
            v.getFlat() != null ? v.getFlat().getFlatNumber() : null,
            v.getFlat() != null && v.getFlat().getWing() != null ? v.getFlat().getWing().getName() : null,
            v.getHostMember() != null ? v.getHostMember().getId() : null,
            v.getHostMember() != null ? v.getHostMember().getFullName() : null,
            v.getEntryTime(), v.getExitTime(),
            v.getVehicleNo(), v.isInsidePremises(),
            v.getApprovalStatus(),
            v.getApprovedByMemberId(),
            v.getApprovedAt(),
            v.getCreatedAt()
        );
    }
}