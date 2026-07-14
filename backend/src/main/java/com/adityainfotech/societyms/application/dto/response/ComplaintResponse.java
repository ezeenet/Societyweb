package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Complaint;
import com.adityainfotech.societyms.domain.enums.ComplaintCategory;
import com.adityainfotech.societyms.domain.enums.ComplaintStatus;
import java.time.LocalDateTime;

public record ComplaintResponse(
    Long id, String title, String description,
    ComplaintCategory category, ComplaintStatus status,
    Long memberId, String memberName,
    String flatNumber, String wingName,
    String remarks, LocalDateTime resolvedAt,
    LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public static ComplaintResponse from(Complaint c) {
        var flat = c.getMember().getFlat();
        return new ComplaintResponse(
            c.getId(), c.getTitle(), c.getDescription(),
            c.getCategory(), c.getStatus(),
            c.getMember().getId(), c.getMember().getFullName(),
            flat != null ? flat.getFlatNumber() : null,
            flat != null && flat.getWing() != null ? flat.getWing().getName() : null,
            c.getRemarks(), c.getResolvedAt(),
            c.getCreatedAt(), c.getUpdatedAt()
        );
    }
}
