package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Document;
import java.time.LocalDateTime;

public record DocumentResponse(
    Long id, String title, String documentType,
    String fileName, Long fileSize, String mimeType,
    String uploadedByName, Long memberId,
    LocalDateTime createdAt
) {
    public static DocumentResponse from(Document d) {
        return new DocumentResponse(
            d.getId(), d.getTitle(), d.getDocumentType(),
            d.getFileName(), d.getFileSize(), d.getMimeType(),
            d.getUploadedByName(), d.getMemberId(), d.getCreatedAt()
        );
    }
}
