package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.AmcContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AmcContractJpaRepository extends JpaRepository<AmcContract, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "vendor" })
    List<AmcContract> findAllByOrderByEndDateAsc();

    @Query("""
        SELECT a FROM AmcContract a
        WHERE a.endDate BETWEEN :today AND :future
        AND a.status = 'ACTIVE'
        ORDER BY a.endDate ASC
        """)
    List<AmcContract> findUpcomingRenewals(
        @Param("today") LocalDate today,
        @Param("future") LocalDate future
    );

    @Query("""
        SELECT a FROM AmcContract a
        WHERE a.endDate < :today
        AND a.status = 'ACTIVE'
        ORDER BY a.endDate DESC
        """)
    List<AmcContract> findExpired(@Param("today") LocalDate today);
}