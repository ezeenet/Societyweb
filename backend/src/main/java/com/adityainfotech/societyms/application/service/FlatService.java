package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.FlatRequest;
import com.adityainfotech.societyms.application.dto.request.FlatStatusRequest;
import com.adityainfotech.societyms.application.dto.response.FlatResponse;
import com.adityainfotech.societyms.domain.entity.Flat;
import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.domain.entity.Wing;
import com.adityainfotech.societyms.domain.enums.FlatStatus;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.FlatJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.MemberJpaRepository;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.DuplicateResourceException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlatService {

    private final FlatJpaRepository flatRepository;
    private final MemberJpaRepository memberRepository;
    private final WingService wingService;

    @Transactional(readOnly = true)
    public List<FlatResponse> findAll(Long wingId, FlatStatus status) {
        List<Flat> flats;

        if (wingId != null) {
            flats = flatRepository.findByWingIdOrderByFlatNumberAsc(wingId);
        } else if (status != null) {
            flats = flatRepository.findByStatusOrderByWing_NameAscFlatNumberAsc(status);
        } else {
            flats = flatRepository.findAllByOrderByWing_NameAscFlatNumberAsc();
        }

        // Each flat → find active member linked to it
        return flats.stream().map(flat -> {
            Optional<Member> member = memberRepository.findByFlatIdAndIsActiveTrue(flat.getId())
    .stream().findFirst();
            return FlatResponse.from(flat, member.orElse(null));
        }).toList();
    }

    @Transactional(readOnly = true)
    public FlatResponse findById(Long id) {
        Flat flat = getOrThrow(id);
        Optional<Member> member = memberRepository.findByFlatIdAndIsActiveTrue(id)
    .stream().findFirst();
        return FlatResponse.from(flat, member.orElse(null));
    }

    @Transactional
    public FlatResponse create(FlatRequest request) {
        Wing wing = wingService.findById(request.wingId());

        if (flatRepository.existsByFlatNumberIgnoreCaseAndWingId(request.flatNumber(), request.wingId())) {
            throw new DuplicateResourceException(
                "Flat '" + request.flatNumber() + "' already exists in " + wing.getName()
            );
        }

        Flat flat = Flat.builder()
            .flatNumber(request.flatNumber().trim().toUpperCase())
            .floorNumber(request.floorNumber())
            .flatType(request.flatType())
            .areaSqft(request.areaSqft())
            .status(FlatStatus.VACANT)
            .wing(wing)
            .build();

        Flat saved = flatRepository.save(flat);
        log.info("Flat created: id={}, number={}, wing={}", saved.getId(), saved.getFlatNumber(), wing.getName());
        return FlatResponse.from(saved);
    }

    @Transactional
    public FlatResponse update(Long id, FlatRequest request) {
        Flat flat = getOrThrow(id);
        Wing newWing = wingService.findById(request.wingId());

        boolean numberConflict =
            flatRepository.existsByFlatNumberIgnoreCaseAndWingId(request.flatNumber(), request.wingId())
            && !(flat.getFlatNumber().equalsIgnoreCase(request.flatNumber())
                 && flat.getWing().getId().equals(request.wingId()));

        if (numberConflict) {
            throw new DuplicateResourceException(
                "Flat '" + request.flatNumber() + "' already exists in " + newWing.getName()
            );
        }

        flat.setWing(newWing);
        flat.setFlatNumber(request.flatNumber().trim().toUpperCase());
        flat.setFloorNumber(request.floorNumber());
        flat.setFlatType(request.flatType());
        flat.setAreaSqft(request.areaSqft());

        return FlatResponse.from(flatRepository.save(flat));
    }

    @Transactional
    public FlatResponse updateStatus(Long id, FlatStatusRequest request) {
        Flat flat = getOrThrow(id);

        if (FlatStatus.VACANT.equals(request.status()) && flat.isOccupied()) {
            boolean hasMember = memberRepository.existsByFlatIdAndIsActiveTrue(id);
            if (hasMember) {
                throw new BusinessRuleException(
                    "Cannot mark flat as vacant — it has an active member. Remove the member first.",
                    "FLAT_HAS_ACTIVE_MEMBER"
                );
            }
        }

        flat.setStatus(request.status());
        return FlatResponse.from(flatRepository.save(flat));
    }

    @Transactional
    public void delete(Long id) {
        Flat flat = getOrThrow(id);

        if (flat.isOccupied()) {
            throw new BusinessRuleException(
                "Cannot delete an occupied flat. Remove the member first.",
                "FLAT_IS_OCCUPIED"
            );
        }

        flatRepository.delete(flat);
        log.info("Flat deleted: id={}, number={}", id, flat.getFlatNumber());
    }

    public Flat getOrThrow(Long id) {
        return flatRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Flat", id));
    }

    @Transactional
    public void markOccupied(Long flatId) {
        Flat flat = getOrThrow(flatId);
        flat.setStatus(FlatStatus.OCCUPIED);
        flatRepository.save(flat);
    }

    @Transactional
    public void markVacant(Long flatId) {
        boolean stillHasMembers = memberRepository.existsByFlatIdAndIsActiveTrue(flatId);
        if (!stillHasMembers) {
            Flat flat = getOrThrow(flatId);
            flat.setStatus(FlatStatus.VACANT);
            flatRepository.save(flat);
        }
    }
}
