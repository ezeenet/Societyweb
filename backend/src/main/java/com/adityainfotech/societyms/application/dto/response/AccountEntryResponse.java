package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.AccountEntry;
import com.adityainfotech.societyms.domain.enums.EntryType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AccountEntryResponse(
    Long          id,
    String        title,
    BigDecimal    amount,
    EntryType     entryType,
    String        category,
    String        subCategory,
    String        description,
    LocalDate     entryDate,
    String        reference,
    Boolean       isVerified,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static AccountEntryResponse from(AccountEntry e) {
        return new AccountEntryResponse(
            e.getId(), e.getTitle(), e.getAmount(), e.getEntryType(),
            e.getCategory(), e.getSubCategory(), e.getDescription(),
            e.getEntryDate(), e.getReference(), e.getIsVerified(),
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}
