package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.MaintenanceBill;
import com.adityainfotech.societyms.domain.enums.BillStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceBillJpaRepository extends JpaRepository<MaintenanceBill, Long> {

    /** Prevent duplicate bill generation — checked in BillingService before insert. */
    boolean existsByFlatIdAndBillMonth(Long flatId, String billMonth);

    @EntityGraph(attributePaths = { "flat", "flat.wing" })
    List<MaintenanceBill> findAllByOrderByBillMonthDescFlat_Wing_NameAscFlat_FlatNumberAsc();

    @EntityGraph(attributePaths = { "flat", "flat.wing" })
    List<MaintenanceBill> findByStatusOrderByBillMonthDescFlat_Wing_NameAsc(BillStatus status);

    /** Member sees only their flat's bills. */
    @EntityGraph(attributePaths = { "flat", "flat.wing" })
    List<MaintenanceBill> findByFlatIdOrderByBillMonthDesc(Long flatId);

    @EntityGraph(attributePaths = { "flat", "flat.wing" })
    Optional<MaintenanceBill> findById(Long id);

    long countByStatus(BillStatus status);

    @Query("SELECT COALESCE(SUM(b.totalDue), 0) FROM MaintenanceBill b WHERE b.status = 'PENDING'")
    BigDecimal sumPendingDues();

    /** Bills for a specific month — used for "already generated?" check at bulk level. */
    @Query("SELECT COUNT(b) FROM MaintenanceBill b WHERE b.billMonth = :month")
    long countByBillMonth(@Param("month") String month);
}
