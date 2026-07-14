package com.adityainfotech.societyms.application.dto.request;

import com.adityainfotech.societyms.domain.enums.Role;
import jakarta.validation.constraints.*;

public record UserCreateRequest(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Size(min = 6, max = 100) String password,
    @NotNull Role role,
    @Size(max = 200) String fullName,
    Long memberId
) {}
