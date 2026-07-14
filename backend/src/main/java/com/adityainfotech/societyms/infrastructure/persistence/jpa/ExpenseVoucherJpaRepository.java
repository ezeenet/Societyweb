package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.ExpenseVoucher;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseVoucherJpaRepository extends JpaRepository<ExpenseVoucher, Long> {
    @EntityGraph(attributePaths = { "items" })
    List<ExpenseVoucher> findAllByOrderByVoucherDateDescIdDesc();

    boolean existsByVoucherNumber(String voucherNumber);

    long count();
}