package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.Wing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WingJpaRepository extends JpaRepository<Wing, Long> {

    boolean existsByNameIgnoreCase(String name);

    /** Load all wings with flat count in a single query — avoids N+1. */
    @Query("SELECT w FROM Wing w LEFT JOIN FETCH w.flats ORDER BY w.name ASC")
    List<Wing> findAllWithFlats();
}
