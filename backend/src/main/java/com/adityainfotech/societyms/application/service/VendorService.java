package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.VendorRequest;
import com.adityainfotech.societyms.application.dto.response.VendorResponse;
import com.adityainfotech.societyms.domain.entity.Vendor;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.ExpenseVoucherJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.VendorJpaRepository;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorJpaRepository         vendorRepository;
    private final ExpenseVoucherJpaRepository  voucherRepository;

    @Transactional(readOnly = true)
    public List<VendorResponse> findAll() {
        return vendorRepository.findAllByOrderByNameAsc().stream()
            .map(this::toResponseWithStats)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<VendorResponse> findActive() {
        return vendorRepository.findByIsActiveTrueOrderByNameAsc().stream()
            .map(this::toResponseWithStats)
            .toList();
    }

    private VendorResponse toResponseWithStats(Vendor v) {
        var vouchers = voucherRepository.findAllByOrderByVoucherDateDescIdDesc().stream()
            .filter(vo -> vo.getVendor() != null && vo.getVendor().getId().equals(v.getId()))
            .toList();
        BigDecimal totalPaid = vouchers.stream()
            .map(vo -> vo.getPaidAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return VendorResponse.from(v, totalPaid, vouchers.size());
    }

    @Transactional
    public VendorResponse create(VendorRequest request) {
        Vendor vendor = Vendor.builder()
            .name(request.name().trim())
            .vendorType(request.vendorType())
            .mobile(request.mobile())
            .address(request.address())
            .notes(request.notes())
            .isActive(request.isActive() != null ? request.isActive() : true)
            .build();
        return toResponseWithStats(vendorRepository.save(vendor));
    }

    @Transactional
    public VendorResponse update(Long id, VendorRequest request) {
        Vendor vendor = getOrThrow(id);
        vendor.setName(request.name().trim());
        vendor.setVendorType(request.vendorType());
        vendor.setMobile(request.mobile());
        vendor.setAddress(request.address());
        vendor.setNotes(request.notes());
        if (request.isActive() != null) vendor.setIsActive(request.isActive());
        return toResponseWithStats(vendorRepository.save(vendor));
    }

    @Transactional
    public void delete(Long id) {
        vendorRepository.delete(getOrThrow(id));
    }

    public Vendor getOrThrow(Long id) {
        return vendorRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Vendor", id));
    }
}