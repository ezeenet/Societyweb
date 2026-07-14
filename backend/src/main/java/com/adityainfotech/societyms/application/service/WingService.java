package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.WingRequest;
import com.adityainfotech.societyms.application.dto.response.WingResponse;
import com.adityainfotech.societyms.domain.entity.Wing;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.WingJpaRepository;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.DuplicateResourceException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WingService {

    private final WingJpaRepository wingRepository;

    @Transactional(readOnly = true)
    public List<WingResponse> findAll() {
        return wingRepository.findAllWithFlats()
            .stream()
            .map(WingResponse::from)
            .toList();
    }

    @Transactional
    public WingResponse create(WingRequest request) {
        if (wingRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Wing '" + request.name() + "' already exists");
        }

        Wing wing = Wing.builder()
            .name(request.name().trim())
            .build();

        Wing saved = wingRepository.save(wing);
        log.info("Wing created: id={}, name={}", saved.getId(), saved.getName());
        return WingResponse.from(saved);
    }

    @Transactional
    public WingResponse update(Long id, WingRequest request) {
        Wing wing = findById(id);

        boolean nameConflict = wingRepository.existsByNameIgnoreCase(request.name())
            && !wing.getName().equalsIgnoreCase(request.name());

        if (nameConflict) {
            throw new DuplicateResourceException("Wing '" + request.name() + "' already exists");
        }

        wing.setName(request.name().trim());
        return WingResponse.from(wingRepository.save(wing));
    }

    @Transactional
    public void delete(Long id) {
        Wing wing = findById(id);

        if (!wing.getFlats().isEmpty()) {
            throw new BusinessRuleException(
                "Cannot delete '" + wing.getName() + "' — it still has " + wing.getFlats().size() + " flat(s). Remove all flats first.",
                "WING_HAS_FLATS"
            );
        }

        wingRepository.delete(wing);
        log.info("Wing deleted: id={}, name={}", id, wing.getName());
    }

    // ── Internal helper ───────────────────────────────────────────────────────

    public Wing findById(Long id) {
        return wingRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Wing", id));
    }
}
