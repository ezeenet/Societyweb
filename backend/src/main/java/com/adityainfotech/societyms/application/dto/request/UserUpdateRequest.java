package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.Role;
import jakarta.validation.constraints.*;

public record UserUpdateRequest(
    @Size(max = 200) String fullName,
    @NotNull Role role,
    Long memberId,
    Boolean isActive
) {}
