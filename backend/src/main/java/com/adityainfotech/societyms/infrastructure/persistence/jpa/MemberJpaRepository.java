package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.MemberJpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberJpaRepository extends JpaRepository<Member, Long> {

    /** Full list with flat+wing eagerly loaded — for table display. */
    @EntityGraph(attributePaths = { "flat", "flat.wing" })
    @Query("SELECT m FROM Member m WHERE m.isActive = true ORDER BY m.fullName ASC")
    List<Member> findAllActiveWithFlat();

    /** All members including inactive — for admin view. */
    @EntityGraph(attributePaths = { "flat", "flat.wing" })
    @Query("SELECT m FROM Member m ORDER BY m.isActive DESC, m.fullName ASC")
    List<Member> findAllWithFlat();

    /** Paginated + search by name/mobile/email — for large datasets. */
    @EntityGraph(attributePaths = { "flat", "flat.wing" })
    @Query("""
        SELECT m FROM Member m
        WHERE m.isActive = true
          AND (:search IS NULL OR :search = ''
               OR LOWER(m.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR m.mobile         LIKE CONCAT('%', :search, '%')
               OR LOWER(m.email)   LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY m.fullName ASC
        """)
    Page<Member> searchActive(@Param("search") String search, Pageable pageable);

    @EntityGraph(attributePaths = { "flat", "flat.wing" })
    Optional<Member> findById(Long id);

    /** Find all members linked to a flat — needed for flat status sync. */
    List<Member> findByFlatIdAndIsActiveTrue(Long flatId);

    /** Count check before deleting a wing/flat. */
    boolean existsByFlatIdAndIsActiveTrue(Long flatId);

    long countByIsActiveTrue();

    /** Export: fetch all active members ordered by wing → flat → name */
    @EntityGraph(attributePaths = { "flat", "flat.wing" })
    @Query("""
        SELECT m FROM Member m
        WHERE m.isActive = true
        ORDER BY m.flat.wing.name ASC, m.flat.flatNumber ASC, m.fullName ASC
        """)
    List<Member> findAllForExport();

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Member m SET m.isActive = false, m.moveOutDate = :moveOutDate WHERE m.id = :id")
    void markMoveOut(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("moveOutDate") java.time.LocalDate moveOutDate);
}
