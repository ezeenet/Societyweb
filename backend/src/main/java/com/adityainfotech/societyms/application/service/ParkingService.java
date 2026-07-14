package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.ParkingSlotRequest;
import com.adityainfotech.societyms.application.dto.response.ParkingSlotResponse;
import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.domain.entity.ParkingSlot;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.MemberJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.ParkingSlotJpaRepository;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParkingService {

    private final ParkingSlotJpaRepository parkingRepository;
    private final MemberJpaRepository      memberRepository;

    @Transactional(readOnly = true)
    public List<ParkingSlotResponse> findAll() {
        return parkingRepository.findAllByOrderBySlotNumberAsc()
            .stream().map(ParkingSlotResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getSummary() {
        long total    = parkingRepository.count();
        long occupied = parkingRepository.countByStatus("OCCUPIED");
        long vacant   = total - occupied;
        return Map.of("total", total, "occupied", occupied, "vacant", vacant);
    }

    @Transactional
    public ParkingSlotResponse create(ParkingSlotRequest request) {
        if (parkingRepository.existsBySlotNumber(request.slotNumber())) {
            throw new BusinessRuleException(
                "Slot " + request.slotNumber() + " already exists.", "SLOT_EXISTS");
        }
        ParkingSlot slot = ParkingSlot.builder()
            .slotNumber(request.slotNumber())
            .slotType(request.slotType() != null ? request.slotType() : "BOTH")
            .status("VACANT")
            .notes(request.notes())
            .build();
        return ParkingSlotResponse.from(parkingRepository.save(slot));
    }

    @Transactional
    public ParkingSlotResponse update(Long id, ParkingSlotRequest request) {
        ParkingSlot slot = getOrThrow(id);
        slot.setSlotNumber(request.slotNumber());
        if (request.slotType() != null) slot.setSlotType(request.slotType());
        slot.setNotes(request.notes());
        return ParkingSlotResponse.from(parkingRepository.save(slot));
    }

    @Transactional
    public void delete(Long id) {
        ParkingSlot slot = getOrThrow(id);
        if ("OCCUPIED".equals(slot.getStatus())) {
            throw new BusinessRuleException(
                "Cannot delete an occupied slot. Unassign member first.", "SLOT_OCCUPIED");
        }
        parkingRepository.delete(slot);
    }

    @Transactional
    public ParkingSlotResponse assign(Long slotId, Long memberId) {
        ParkingSlot slot   = getOrThrow(slotId);
        Member      member = memberRepository.findById(memberId)
            .orElseThrow(() -> ResourceNotFoundException.of("Member", memberId));

        if ("OCCUPIED".equals(slot.getStatus())) {
            throw new BusinessRuleException(
                "Slot " + slot.getSlotNumber() + " is already occupied.", "SLOT_OCCUPIED");
        }

        // Unassign previous slot if member had one
        parkingRepository.findByMemberId(memberId).ifPresent(prev -> {
            prev.setMember(null);
            prev.setStatus("VACANT");
            parkingRepository.save(prev);
        });

        slot.setMember(member);
        slot.setStatus("OCCUPIED");

        // Sync member.parkingSlot field
        member.setParkingSlot(slot.getSlotNumber());
        memberRepository.save(member);

        log.info("Parking slot {} assigned to member {}", slot.getSlotNumber(), member.getFullName());
        return ParkingSlotResponse.from(parkingRepository.save(slot));
    }

    @Transactional
    public ParkingSlotResponse unassign(Long slotId) {
        ParkingSlot slot = getOrThrow(slotId);

        // Clear member.parkingSlot field
        if (slot.getMember() != null) {
            slot.getMember().setParkingSlot(null);
            memberRepository.save(slot.getMember());
        }

        slot.setMember(null);
        slot.setStatus("VACANT");
        log.info("Parking slot {} unassigned", slot.getSlotNumber());
        return ParkingSlotResponse.from(parkingRepository.save(slot));
    }

    private ParkingSlot getOrThrow(Long id) {
        return parkingRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("ParkingSlot", id));
    }
}