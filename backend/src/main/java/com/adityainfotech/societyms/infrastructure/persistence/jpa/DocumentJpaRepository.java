package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentJpaRepository extends JpaRepository<Document, Long> {

    List<Document> findAllByOrderByCreatedAtDesc();

    List<Document> findByDocumentTypeOrderByCreatedAtDesc(String documentType);

    List<Document> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
