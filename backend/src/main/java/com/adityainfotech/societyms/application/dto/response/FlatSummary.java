package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Flat;

public record FlatSummary(Long id, String flatNumber, String wingName) {
    public static FlatSummary from(Flat flat) {
        return new FlatSummary(
            flat.getId(),
            flat.getFlatNumber(),
            flat.getWing() != null ? flat.getWing().getName() : null
        );
    }
}
