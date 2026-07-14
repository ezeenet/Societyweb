package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeJpaRepository extends JpaRepository<Notice, Long> {

    List<Notice> findAllByOrderByCreatedAtDesc();

    List<Notice> findByIsActiveTrueOrderByCreatedAtDesc();

    long countByIsActiveTrue();

    @Query("SELECT COUNT(n) FROM Notice n WHERE n.category = 'Emergency' AND n.isActive = true")
    long countActiveEmergencies();
}
