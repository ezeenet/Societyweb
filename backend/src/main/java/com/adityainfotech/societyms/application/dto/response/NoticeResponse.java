package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Notice;
import com.adityainfotech.societyms.domain.enums.NoticeCategory;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record NoticeResponse(
    Long id, String title, String content,
    NoticeCategory category, Long createdBy, String createdByName,
    Boolean isActive, LocalDate expiresAt,
    boolean hasPoll, long ackCount,
    LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public static NoticeResponse from(Notice n, boolean hasPoll, long ackCount) {
        return new NoticeResponse(
            n.getId(), n.getTitle(), n.getContent(),
            n.getCategory(), n.getCreatedBy(), n.getCreatedByName(),
            n.getIsActive(), n.getExpiresAt(),
            hasPoll, ackCount, n.getCreatedAt(), n.getUpdatedAt()
        );
    }
}
