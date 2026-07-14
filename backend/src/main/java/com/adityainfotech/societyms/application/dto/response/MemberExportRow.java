package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Member;

public record MemberExportRow(
    Long id, String fullName, String mobile, String email,
    String aadharNumber, String memberType, String flatNumber,
    String wingName, String moveInDate, String vehicleNumber,
    String parkingSlot, String status
) {
    public static MemberExportRow from(Member m) {
        return new MemberExportRow(
            m.getId(), m.getFullName(), m.getMobile(), m.getEmail(),
            m.getAadharNumber(),
            m.getMemberType() != null ? m.getMemberType().name() : "",
            m.getFlat() != null ? m.getFlat().getFlatNumber() : "",
            m.getFlat() != null && m.getFlat().getWing() != null ? m.getFlat().getWing().getName() : "",
            m.getMoveInDate() != null ? m.getMoveInDate().toString() : "",
            m.getVehicleNumber(), m.getParkingSlot(),
            Boolean.TRUE.equals(m.getIsActive()) ? "Active" : "Inactive"
        );
    }
}
