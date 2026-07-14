package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.ParkingSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSlotJpaRepository extends JpaRepository<ParkingSlot, Long> {

    @EntityGraph(attributePaths = { "member", "member.flat", "member.flat.wing" })
    List<ParkingSlot> findAllByOrderBySlotNumberAsc();

    @EntityGraph(attributePaths = { "member" })
    List<ParkingSlot> findByStatusOrderBySlotNumberAsc(String status);

    @EntityGraph(attributePaths = { "member" })
    List<ParkingSlot> findBySlotTypeOrderBySlotNumberAsc(String slotType);

    Optional<ParkingSlot> findByMemberId(Long memberId);

    boolean existsBySlotNumber(String slotNumber);

    long countByStatus(String status);
}