package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.BankTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface BankTransactionJpaRepository extends JpaRepository<BankTransaction, Long> {
    List<BankTransaction> findByBankAccountIdOrderByTransactionDateAscCreatedAtAsc(Long accountId);

    @Query("""
        SELECT COALESCE(SUM(CASE WHEN t.transactionType = 'DEPOSIT' THEN t.amount ELSE -t.amount END), 0)
        FROM BankTransaction t WHERE t.bankAccount.id = :accountId
        """)
    BigDecimal getBalance(@Param("accountId") Long accountId);
}