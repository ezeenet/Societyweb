package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Wing;
import com.adityainfotech.societyms.domain.enums.FlatStatus;
import java.time.LocalDateTime;

public record WingResponse(
    Long id,
    String name,
    int totalFlats,
    long occupiedCount,
    long vacantCount,
    LocalDateTime createdAt
) {
    public static WingResponse from(Wing wing) {
        long occupied = wing.getFlats().stream()
            .filter(f -> FlatStatus.OCCUPIED.equals(f.getStatus())).count();
        return new WingResponse(
            wing.getId(), wing.getName(),
            wing.getFlats().size(), occupied,
            wing.getFlats().size() - occupied,
            wing.getCreatedAt()
        );
    }
}
