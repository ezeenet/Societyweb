package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.AmcContractRequest;
import com.adityainfotech.societyms.application.dto.response.AmcContractResponse;
import com.adityainfotech.societyms.domain.entity.AmcContract;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.AmcContractJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.VendorJpaRepository;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AmcService {

    private final AmcContractJpaRepository amcRepository;
    private final VendorJpaRepository      vendorRepository;

    @Transactional(readOnly = true)
    public List<AmcContractResponse> findAll() {
        return amcRepository.findAllByOrderByEndDateAsc()
            .stream().map(AmcContractResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummary() {
        LocalDate today = LocalDate.now();
        long total     = amcRepository.count();
        long expired   = amcRepository.findExpired(today).size();
        long dueSoon   = amcRepository.findUpcomingRenewals(today, today.plusDays(30)).size();
        long active    = total - expired;
        return Map.of("total", total, "active", active, "expired", expired, "dueSoon", dueSoon);
    }

    @Transactional(readOnly = true)
    public List<AmcContractResponse> getUpcomingRenewals(int days) {
        return amcRepository.findUpcomingRenewals(LocalDate.now(), LocalDate.now().plusDays(days))
            .stream().map(AmcContractResponse::from).toList();
    }

    @Transactional
    public AmcContractResponse create(AmcContractRequest request) {
        AmcContract contract = AmcContract.builder()
            .contractName(request.contractName())
            .vendor(request.vendorId() != null ? vendorRepository.findById(request.vendorId()).orElse(null) : null)
            .vendorName(request.vendorName())
            .category(request.category())
            .startDate(request.startDate())
            .endDate(request.endDate())
            .amount(request.amount())
            .paymentMode(request.paymentMode())
            .status(request.status() != null ? request.status() : "ACTIVE")
            .notes(request.notes())
            .reminderDays(request.reminderDays() != null ? request.reminderDays() : 30)
            .build();
        return AmcContractResponse.from(amcRepository.save(contract));
    }

    @Transactional
    public AmcContractResponse update(Long id, AmcContractRequest request) {
        AmcContract contract = getOrThrow(id);
        contract.setContractName(request.contractName());
        contract.setVendor(request.vendorId() != null ? vendorRepository.findById(request.vendorId()).orElse(null) : null);
        contract.setVendorName(request.vendorName());
        contract.setCategory(request.category());
        contract.setStartDate(request.startDate());
        contract.setEndDate(request.endDate());
        contract.setAmount(request.amount());
        contract.setPaymentMode(request.paymentMode());
        if (request.status() != null) contract.setStatus(request.status());
        contract.setNotes(request.notes());
        if (request.reminderDays() != null) contract.setReminderDays(request.reminderDays());
        return AmcContractResponse.from(amcRepository.save(contract));
    }

    @Transactional
    public void delete(Long id) {
        amcRepository.delete(getOrThrow(id));
    }

    private AmcContract getOrThrow(Long id) {
        return amcRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("AmcContract", id));
    }
}