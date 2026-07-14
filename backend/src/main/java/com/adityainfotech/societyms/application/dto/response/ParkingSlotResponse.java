package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.ParkingSlot;

public record ParkingSlotResponse(
    Long id,
    String slotNumber,
    String slotType,
    String status,
    Long memberId,
    String memberName,
    String flatNumber,
    String wingName,
    String notes
) {
    public static ParkingSlotResponse from(ParkingSlot s) {
        return new ParkingSlotResponse(
            s.getId(), s.getSlotNumber(), s.getSlotType(), s.getStatus(),
            s.getMember() != null ? s.getMember().getId()       : null,
            s.getMember() != null ? s.getMember().getFullName() : null,
            s.getMember() != null && s.getMember().getFlat() != null
                ? s.getMember().getFlat().getFlatNumber() : null,
            s.getMember() != null && s.getMember().getFlat() != null
                && s.getMember().getFlat().getWing() != null
                ? s.getMember().getFlat().getWing().getName() : null,
            s.getNotes()
        );
    }
}