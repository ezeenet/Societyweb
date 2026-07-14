package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.User;
import com.adityainfotech.societyms.domain.enums.Role;
import java.time.LocalDateTime;

public record UserResponse(
    Long id, String username, Role role, String fullName,
    Boolean isActive, Long memberId, String memberName,
    LocalDateTime lastLogin, LocalDateTime createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(
            u.getId(), u.getUsername(), u.getRole(), u.getFullName(),
            u.getIsActive(), u.getMemberId(), null,
            u.getLastLogin(), u.getCreatedAt()
        );
    }
    public static UserResponse from(User u, String memberName) {
        return new UserResponse(
            u.getId(), u.getUsername(), u.getRole(), u.getFullName(),
            u.getIsActive(), u.getMemberId(), memberName,
            u.getLastLogin(), u.getCreatedAt()
        );
    }
}
