package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VendorJpaRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findAllByOrderByNameAsc();
    List<Vendor> findByIsActiveTrueOrderByNameAsc();
}