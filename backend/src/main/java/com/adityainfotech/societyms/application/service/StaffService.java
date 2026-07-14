package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.StaffRequest;
import com.adityainfotech.societyms.application.dto.request.StaffSalaryRequest;
import com.adityainfotech.societyms.application.dto.response.StaffResponse;
import com.adityainfotech.societyms.application.dto.response.StaffSalaryResponse;
import com.adityainfotech.societyms.domain.entity.Staff;
import com.adityainfotech.societyms.domain.entity.StaffSalary;
import com.adityainfotech.societyms.domain.entity.AccountEntry;
import com.adityainfotech.societyms.domain.enums.EntryType;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.StaffJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.StaffSalaryJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.AccountEntryJpaRepository;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffService {

    private final StaffJpaRepository       staffRepository;
    private final StaffSalaryJpaRepository salaryRepository;
    private final AccountEntryJpaRepository accountEntryRepository;

    // ── Staff CRUD ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<StaffResponse> findAll() {
        return staffRepository.findAllByOrderByFullNameAsc()
            .stream().map(StaffResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getSummary() {
        long total    = staffRepository.count();
        long active   = staffRepository.countByStatus("ACTIVE");
        long inactive = total - active;
        return Map.of("total", total, "active", active, "inactive", inactive);
    }

    @Transactional
    public StaffResponse create(StaffRequest request) {
        Staff staff = Staff.builder()
            .fullName(request.fullName().trim())
            .mobile(request.mobile())
            .address(request.address())
            .designation(request.designation())
            .salary(request.salary() != null ? request.salary() : BigDecimal.ZERO)
            .joinDate(request.joinDate())
            .status(request.status() != null ? request.status() : "ACTIVE")
            .notes(request.notes())
            .build();
        return StaffResponse.from(staffRepository.save(staff));
    }

    @Transactional
    public StaffResponse update(Long id, StaffRequest request) {
        Staff staff = getOrThrow(id);
        staff.setFullName(request.fullName().trim());
        staff.setMobile(request.mobile());
        staff.setAddress(request.address());
        staff.setDesignation(request.designation());
        if (request.salary() != null) staff.setSalary(request.salary());
        staff.setJoinDate(request.joinDate());
        if (request.status() != null) staff.setStatus(request.status());
        staff.setNotes(request.notes());
        return StaffResponse.from(staffRepository.save(staff));
    }

    @Transactional
    public void delete(Long id) {
        staffRepository.delete(getOrThrow(id));
    }

    // ── Salary ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<StaffSalaryResponse> getSalaryHistory(Long staffId) {
        return salaryRepository.findByStaffIdOrderBySalaryMonthDesc(staffId)
            .stream().map(StaffSalaryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<StaffSalaryResponse> getSalaryByMonth(String month) {
        return salaryRepository.findBySalaryMonthOrderByStaff_FullNameAsc(month)
            .stream().map(StaffSalaryResponse::from).toList();
    }

    @Transactional
    public StaffSalaryResponse generateSalary(Long staffId, StaffSalaryRequest request) {
        Staff staff = getOrThrow(staffId);

        if (salaryRepository.existsByStaffIdAndSalaryMonth(staffId, request.salaryMonth())) {
            throw new BusinessRuleException(
                "Salary already generated for " + staff.getFullName() + " for " + request.salaryMonth(),
                "SALARY_ALREADY_EXISTS");
        }

        StaffSalary salary = StaffSalary.builder()
            .staff(staff)
            .salaryMonth(request.salaryMonth())
            .amount(request.amount() != null ? request.amount() : staff.getSalary())
            .paidDate(request.paidDate())
            .status(request.status() != null ? request.status() : "PENDING")
            .notes(request.notes())
            .build();

        StaffSalary saved = salaryRepository.save(salary);

        // If paid — create account entry
        if ("PAID".equals(saved.getStatus())) {
            createSalaryAccountEntry(staff, saved);
        }

        return StaffSalaryResponse.from(saved);
    }

    @Transactional
    public StaffSalaryResponse markSalaryPaid(Long salaryId) {
        StaffSalary salary = salaryRepository.findById(salaryId)
            .orElseThrow(() -> ResourceNotFoundException.of("StaffSalary", salaryId));

        if ("PAID".equals(salary.getStatus())) {
            throw new BusinessRuleException("Salary already paid.", "ALREADY_PAID");
        }

        salary.setStatus("PAID");
        salary.setPaidDate(LocalDate.now());
        StaffSalary saved = salaryRepository.save(salary);

        createSalaryAccountEntry(salary.getStaff(), saved);
        return StaffSalaryResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlySummary(String month) {
        List<StaffSalaryResponse> records = getSalaryByMonth(month);
        BigDecimal totalPaid    = records.stream().filter(r -> "PAID".equals(r.status()))
            .map(StaffSalaryResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPending = records.stream().filter(r -> "PENDING".equals(r.status()))
            .map(StaffSalaryResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("month", month, "records", records,
            "totalPaid", totalPaid, "totalPending", totalPending,
            "totalStaff", records.size());
    }

    // ── Bulk generate salary for all active staff ─────────────────────────────

    @Transactional
    public List<StaffSalaryResponse> generateBulkSalary(String salaryMonth) {
        List<Staff> activeStaff = staffRepository.findByStatusOrderByFullNameAsc("ACTIVE");
        return activeStaff.stream()
            .filter(s -> !salaryRepository.existsByStaffIdAndSalaryMonth(s.getId(), salaryMonth))
            .map(s -> {
                StaffSalary sal = StaffSalary.builder()
                    .staff(s).salaryMonth(salaryMonth)
                    .amount(s.getSalary()).status("PENDING").build();
                return StaffSalaryResponse.from(salaryRepository.save(sal));
            }).toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void createSalaryAccountEntry(Staff staff, StaffSalary salary) {
        try {
            AccountEntry entry = AccountEntry.builder()
                .title("Salary — " + staff.getFullName() + " (" + staff.getDesignation() + ")")
                .amount(salary.getAmount())
                .entryType(EntryType.EXPENSE)
                .category("Salary")
                .description("Monthly salary for " + salary.getSalaryMonth())
                .entryDate(salary.getPaidDate() != null ? salary.getPaidDate() : LocalDate.now())
                .reference("SAL-" + salary.getId())
                .isVerified(true)
                .createdBy(null)
                .build();
            accountEntryRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to create salary account entry: {}", e.getMessage());
        }
    }

    public Staff getOrThrow(Long id) {
        return staffRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Staff", id));
    }
}