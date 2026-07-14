package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Flat;
import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.domain.enums.FlatStatus;
import com.adityainfotech.societyms.domain.enums.FlatType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FlatResponse(
    Long id,
    String flatNumber,
    Integer floorNumber,
    FlatType flatType,
    String flatTypeLabel,
    BigDecimal areaSqft,
    FlatStatus status,
    Long wingId,
    String wingName,
    Long memberId,
    String memberName,
    String memberPhone,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    // Without member (backward compat)
    public static FlatResponse from(Flat flat) {
        return from(flat, null);
    }

    // With member
    public static FlatResponse from(Flat flat, Member member) {
        return new FlatResponse(
            flat.getId(),
            flat.getFlatNumber(),
            flat.getFloorNumber(),
            flat.getFlatType(),
            flat.getFlatType() != null ? flat.getFlatType().getLabel() : null,
            flat.getAreaSqft(),
            flat.getStatus(),
            flat.getWing() != null ? flat.getWing().getId() : null,
            flat.getWing() != null ? flat.getWing().getName() : null,
            member != null ? member.getId() : null,
            member != null ? member.getFullName() : null,
            member != null ? member.getMobile() : null,
            flat.getCreatedAt(),
            flat.getUpdatedAt()
        );
    }
}
