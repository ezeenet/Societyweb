package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StaffJpaRepository extends JpaRepository<Staff, Long> {
    List<Staff> findAllByOrderByFullNameAsc();
    List<Staff> findByStatusOrderByFullNameAsc(String status);
    long countByStatus(String status);
}