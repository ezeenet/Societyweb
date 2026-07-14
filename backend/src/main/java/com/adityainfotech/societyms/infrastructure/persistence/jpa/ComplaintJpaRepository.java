package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.Complaint;
import com.adityainfotech.societyms.domain.enums.ComplaintCategory;
import com.adityainfotech.societyms.domain.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintJpaRepository extends JpaRepository<Complaint, Long> {

    @EntityGraph(attributePaths = { "member", "member.flat", "member.flat.wing" })
    List<Complaint> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = { "member", "member.flat", "member.flat.wing" })
    List<Complaint> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    @EntityGraph(attributePaths = { "member", "member.flat", "member.flat.wing" })
    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    @EntityGraph(attributePaths = { "member", "member.flat", "member.flat.wing" })
    List<Complaint> findByCategoryOrderByCreatedAtDesc(ComplaintCategory category);

    long countByStatus(ComplaintStatus status);

    @EntityGraph(attributePaths = { "member", "member.flat", "member.flat.wing" })
    Optional<Complaint> findById(Long id);
}
