package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.Flat;
import com.adityainfotech.societyms.domain.enums.FlatStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlatJpaRepository extends JpaRepository<Flat, Long> {

    /** Eager-loads the wing to avoid N+1 when serialising FlatResponse. */
    @EntityGraph(attributePaths = "wing")
    List<Flat> findAllByOrderByWing_NameAscFlatNumberAsc();

    @EntityGraph(attributePaths = "wing")
    List<Flat> findByWingIdOrderByFlatNumberAsc(Long wingId);

    @EntityGraph(attributePaths = "wing")
    List<Flat> findByStatusOrderByWing_NameAscFlatNumberAsc(FlatStatus status);

    @EntityGraph(attributePaths = "wing")
    Optional<Flat> findById(Long id);

    boolean existsByFlatNumberIgnoreCaseAndWingId(String flatNumber, Long wingId);

    long countByStatus(FlatStatus status);

    /** All VACANT flats for bill-generation dropdown. */
    @Query("SELECT f FROM Flat f JOIN FETCH f.wing WHERE f.status = 'OCCUPIED' ORDER BY f.wing.name, f.flatNumber")
    List<Flat> findAllOccupied();
}
