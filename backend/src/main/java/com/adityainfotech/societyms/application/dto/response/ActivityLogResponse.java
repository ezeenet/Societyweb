package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.UserActivityLog;
import java.time.LocalDateTime;

public record ActivityLogResponse(
    Long id, String username, String action,
    String module, String details, String ipAddress,
    LocalDateTime createdAt
) {
    public static ActivityLogResponse from(UserActivityLog l) {
        return new ActivityLogResponse(
            l.getId(), l.getUsername(), l.getAction(),
            l.getModule(), l.getDetails(), l.getIpAddress(), l.getCreatedAt()
        );
    }
}
