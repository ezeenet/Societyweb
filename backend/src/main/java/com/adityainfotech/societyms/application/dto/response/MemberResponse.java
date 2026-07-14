package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.domain.enums.MemberType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MemberResponse(
    Long id,
    String fullName,
    String mobile,
    String email,
    String aadharNumber,
    MemberType memberType,
    FlatSummary flat,
    LocalDate moveInDate,
    LocalDate moveOutDate,
    String vehicleNumber,
    String parkingSlot,
    java.math.BigDecimal openingBalance,
    java.math.BigDecimal shareCapital,
    Boolean isActive,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static MemberResponse from(Member member) {
        FlatSummary flatSummary = member.getFlat() != null
            ? FlatSummary.from(member.getFlat()) : null;
        return new MemberResponse(
            member.getId(), member.getFullName(), member.getMobile(),
            member.getEmail(), member.getAadharNumber(), member.getMemberType(),
            flatSummary, member.getMoveInDate(), member.getMoveOutDate(),
            member.getVehicleNumber(), member.getParkingSlot(),
            member.getOpeningBalance(),
            member.getShareCapital(),
            member.getIsActive(), member.getCreatedAt(), member.getUpdatedAt()
        );
    }
}
