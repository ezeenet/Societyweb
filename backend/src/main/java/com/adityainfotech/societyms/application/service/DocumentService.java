package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.response.DocumentResponse;
import com.adityainfotech.societyms.domain.entity.Document;
import com.adityainfotech.societyms.domain.entity.User;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.DocumentJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserJpaRepository;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentJpaRepository documentRepository;
    private final UserJpaRepository     userRepository;

    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES =
        List.of("Society", "Legal", "Financial", "Member");

    @Transactional(readOnly = true)
    public List<DocumentResponse> findAll(String documentType) {
        if (documentType != null && !documentType.isBlank()) {
            return documentRepository.findByDocumentTypeOrderByCreatedAtDesc(documentType)
                .stream().map(DocumentResponse::from).toList();
        }
        return documentRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(DocumentResponse::from).toList();
    }

    @Transactional
    public DocumentResponse upload(String title, String documentType,
                                   Long memberId, MultipartFile file) throws IOException {
        if (!ALLOWED_TYPES.contains(documentType)) {
            throw new BusinessRuleException(
                "Invalid document type: " + documentType, "INVALID_DOC_TYPE");
        }

        String username     = SecurityContextHolder.getContext().getAuthentication().getName();
        String uploaderName = userRepository.findByUsername(username)
            .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
            .orElse(username);
        Long uploaderId = userRepository.findByUsername(username)
            .map(User::getId).orElse(null);

        String ts         = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String storedName = ts + "_" + sanitize(file.getOriginalFilename());
        Path   dest       = Paths.get(uploadDir, "documents", storedName);

        Files.createDirectories(dest.getParent());
        file.transferTo(dest.toFile());

        Document doc = Document.builder()
            .title(title)
            .documentType(documentType)
            .filePath("documents/" + storedName)
            .fileName(file.getOriginalFilename())
            .fileSize(file.getSize())
            .mimeType(file.getContentType())
            .uploadedBy(uploaderId)
            .uploadedByName(uploaderName)
            .memberId(memberId)
            .build();

        return DocumentResponse.from(documentRepository.save(doc));
    }

    @Transactional
    public void delete(Long id) {
        Document doc = documentRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Document", id));

        try {
            Path file = Paths.get(uploadDir, doc.getFilePath());
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Could not delete file: {}", doc.getFilePath());
        }

        documentRepository.delete(doc);
    }

    public Path getFilePath(Long id) {
        Document doc = documentRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Document", id));
        return Paths.get(uploadDir, doc.getFilePath());
    }

    private String sanitize(String name) {
        if (name == null) return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
