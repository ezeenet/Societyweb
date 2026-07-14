package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.Visitor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitorJpaRepository extends JpaRepository<Visitor, Long> {

    @EntityGraph(attributePaths = { "flat", "flat.wing", "hostMember" })
    List<Visitor> findAllByOrderByEntryTimeDesc();

    @EntityGraph(attributePaths = { "flat", "flat.wing", "hostMember" })
    List<Visitor> findByExitTimeIsNullOrderByEntryTimeDesc();

    @EntityGraph(attributePaths = { "flat", "flat.wing", "hostMember" })
    List<Visitor> findByEntryTimeBetweenOrderByEntryTimeDesc(LocalDateTime from, LocalDateTime to);

    long countByExitTimeIsNull();

    @Query("SELECT COUNT(v) FROM Visitor v WHERE v.entryTime >= :startOfDay AND v.entryTime < :endOfDay")
    long countTodayVisitors(
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay")   LocalDateTime endOfDay
    );

    @EntityGraph(attributePaths = { "flat", "flat.wing", "hostMember" })
    Optional<Visitor> findById(Long id);

    /** Member च्या flat वर pending approval असलेले visitors */
    @EntityGraph(attributePaths = { "flat", "flat.wing", "hostMember" })
    @Query("""
        SELECT v FROM Visitor v
        WHERE v.approvalStatus = 'PENDING'
          AND (v.hostMember.id = :memberId
               OR v.flat.id IN (
                   SELECT m.flat.id FROM Member m WHERE m.id = :memberId AND m.isActive = true
               ))
        ORDER BY v.entryTime DESC
        """)
    List<Visitor> findPendingByMemberId(@Param("memberId") Long memberId);
}