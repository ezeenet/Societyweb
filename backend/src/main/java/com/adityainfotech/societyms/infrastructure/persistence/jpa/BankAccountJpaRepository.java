package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BankAccountJpaRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findAllByOrderByAccountNameAsc();
}