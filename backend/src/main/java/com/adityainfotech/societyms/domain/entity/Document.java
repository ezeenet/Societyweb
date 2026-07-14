package com.adityainfotech.societyms.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Uploaded society document.
 *
 * Files are stored on the server filesystem under /uploads/documents/.
 * filePath = relative path from upload root (e.g. "documents/2025/04/agm-minutes.pdf")
 * fileName = original name as uploaded by the user
 *
 * DocumentType determines which tab in the Documents module shows this file:
 *   Society  → MOA, rules, bye-laws
 *   Legal    → Court orders, NOCs, agreements
 *   Financial → Audit reports, bank statements
 *   Member   → Individual member agreements, ID proofs
 */
@Entity
@Table(name = "documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType;   // Society | Legal | Financial | Member

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_name", nullable = false, length = 200)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;          // bytes

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "uploaded_by")
    private Long uploadedBy;        // FK → users.id

    @Column(name = "uploaded_by_name", length = 200)
    private String uploadedByName;

    @Column(name = "member_id")
    private Long memberId;          // FK → members.id (for Member type docs)

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
