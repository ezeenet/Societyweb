package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.StaffSalary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffSalaryJpaRepository extends JpaRepository<StaffSalary, Long> {
    List<StaffSalary> findByStaffIdOrderBySalaryMonthDesc(Long staffId);
    List<StaffSalary> findBySalaryMonthOrderByStaff_FullNameAsc(String salaryMonth);
    Optional<StaffSalary> findByStaffIdAndSalaryMonth(Long staffId, String salaryMonth);
    boolean existsByStaffIdAndSalaryMonth(Long staffId, String salaryMonth);

    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM StaffSalary s WHERE s.status = 'PAID' AND s.salaryMonth = :month")
    BigDecimal sumPaidByMonth(@Param("month") String month);

    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM StaffSalary s WHERE s.status = 'PENDING'")
    BigDecimal sumPending();
}