package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.AccountEntry;
import com.adityainfotech.societyms.domain.enums.EntryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AccountEntryJpaRepository extends JpaRepository<AccountEntry, Long> {

    List<AccountEntry> findAllByOrderByEntryDateDescCreatedAtDesc();

    List<AccountEntry> findByEntryTypeOrderByEntryDateDesc(EntryType type);

    List<AccountEntry> findByEntryDateBetweenOrderByEntryDateDesc(LocalDate from, LocalDate to);

    List<AccountEntry> findByCategoryOrderByEntryDateDesc(String category);

    /** Fund entries: specific categories for Fund Management tab. */
    @Query("""
        SELECT a FROM AccountEntry a
        WHERE a.category IN ('Sinking Fund','Repair Fund','Corpus Fund','Reserve Fund')
        ORDER BY a.entryDate DESC
        """)
    List<AccountEntry> findFundEntries();

    /** Financial year range query — backbone of all reports. */
    @Query("""
        SELECT a FROM AccountEntry a
        WHERE a.entryDate >= :from AND a.entryDate <= :to
        ORDER BY a.entryDate ASC
        """)
    List<AccountEntry> findByDateRange(
        @Param("from") LocalDate from,
        @Param("to")   LocalDate to
    );

    /** Sum by type in a date range — used in summary card. */
    @Query("""
        SELECT COALESCE(SUM(a.amount), 0) FROM AccountEntry a
        WHERE a.entryType = :type
          AND a.entryDate >= :from AND a.entryDate <= :to
        """)
    BigDecimal sumByTypeAndDateRange(
        @Param("type") EntryType type,
        @Param("from") LocalDate from,
        @Param("to")   LocalDate to
    );

    /** Opening balance — most recent one wins. */
    @Query("""
        SELECT COALESCE(SUM(a.amount), 0) FROM AccountEntry a
        WHERE a.entryType = 'OPENING_BALANCE'
        """)
    BigDecimal totalOpeningBalance();

    /** Cash Book: Cash + Cheque payments from payments table + Cash category entries. */
    @Query("""
        SELECT a FROM AccountEntry a
        WHERE a.category = 'Cash'
          AND a.entryDate >= :from AND a.entryDate <= :to
        ORDER BY a.entryDate ASC
        """)
    List<AccountEntry> findCashEntries(
        @Param("from") LocalDate from,
        @Param("to")   LocalDate to
    );

    @Query("""
        SELECT a FROM AccountEntry a
        WHERE a.category = 'Bank'
          AND a.entryDate >= :from AND a.entryDate <= :to
        ORDER BY a.entryDate ASC
        """)
    List<AccountEntry> findBankEntries(
        @Param("from") LocalDate from,
        @Param("to")   LocalDate to
    );

    /** Delete account entry by receipt reference number */
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM AccountEntry a WHERE a.reference = :reference")
    void deleteByReference(@Param("reference") String reference);

    /** Find by reference */
    List<AccountEntry> findByReference(String reference);

    /** Fund balance per fund type. */
    @Query("""
        SELECT COALESCE(
          SUM(CASE WHEN a.entryType = 'INCOME'  THEN a.amount ELSE 0 END) -
          SUM(CASE WHEN a.entryType = 'EXPENSE' THEN a.amount ELSE 0 END), 0
        )
        FROM AccountEntry a
        WHERE a.category = :fundName
        """)
    BigDecimal getFundBalance(@Param("fundName") String fundName);
}
