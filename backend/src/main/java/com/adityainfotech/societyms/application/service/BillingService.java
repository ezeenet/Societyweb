package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.BillGenerateRequest;
import com.adityainfotech.societyms.application.dto.request.PaymentRequest;
import com.adityainfotech.societyms.application.dto.request.RejectPaymentRequest;
import com.adityainfotech.societyms.application.dto.response.BillResponse;
import com.adityainfotech.societyms.application.dto.response.BulkGenerateResult;
import com.adityainfotech.societyms.application.dto.response.PaymentResponse;
import com.adityainfotech.societyms.domain.entity.AccountEntry;
import com.adityainfotech.societyms.domain.entity.Flat;
import com.adityainfotech.societyms.domain.entity.MaintenanceBill;
import com.adityainfotech.societyms.domain.entity.Member;
import com.adityainfotech.societyms.domain.entity.Payment;
import com.adityainfotech.societyms.domain.enums.ApprovalStatus;
import com.adityainfotech.societyms.domain.enums.BillStatus;
import com.adityainfotech.societyms.domain.enums.EntryType;
import com.adityainfotech.societyms.domain.enums.FlatStatus;
import com.adityainfotech.societyms.domain.enums.PaymentMode;
import com.adityainfotech.societyms.domain.enums.Role;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.AccountEntryJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.FlatJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.MaintenanceBillJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.PaymentJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.MemberJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserJpaRepository;
import com.adityainfotech.societyms.presentation.exception.BusinessRuleException;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    private final MaintenanceBillJpaRepository billRepository;
    private final PaymentJpaRepository         paymentRepository;
    private final FlatJpaRepository            flatRepository;
    private final UserJpaRepository            userRepository;
    private final AccountEntryJpaRepository    accountEntryRepository;
    private final MemberJpaRepository          memberRepository;
    private final MemberService                memberService;
    private final ReceiptSequenceService       receiptSequence;

    @Transactional
    public BulkGenerateResult generateBillsForAllFlats(BillGenerateRequest request) {
        List<Flat> occupiedFlats = flatRepository.findAllOccupied();

        if (occupiedFlats.isEmpty()) {
            throw new BusinessRuleException(
                "No occupied flats found. Assign members to flats before generating bills.",
                "NO_OCCUPIED_FLATS"
            );
        }

        Long currentUserId = resolveCurrentUserId();
        List<String> skippedFlats = new ArrayList<>();
        int generated = 0;

        for (Flat flat : occupiedFlats) {
            if (billRepository.existsByFlatIdAndBillMonth(flat.getId(), request.billMonth())) {
                skippedFlats.add(flat.getFlatNumber() + " (" +
                    (flat.getWing() != null ? flat.getWing().getName() : "") + ")");
                continue;
            }

            MaintenanceBill bill = MaintenanceBill.builder()
                .flat(flat)
                .billMonth(request.billMonth())
                .amount(request.amount())
                .lateFine(BigDecimal.ZERO)
                .dueDate(request.dueDate())
                .status(BillStatus.PENDING)
                .generatedBy(currentUserId)
                .build();

            billRepository.save(bill);
            generated++;
        }

        log.info("Bills generated: {} new, {} skipped for month {}",
            generated, skippedFlats.size(), request.billMonth());

        return new BulkGenerateResult(generated, skippedFlats.size(), request.billMonth(), skippedFlats);
    }

    @Transactional(readOnly = true)
    public List<BillResponse> findAllBills() {
        return billRepository.findAllByOrderByBillMonthDescFlat_Wing_NameAscFlat_FlatNumberAsc()
            .stream().map(this::toBillResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BillResponse> findPendingBills() {
        return billRepository.findByStatusOrderByBillMonthDescFlat_Wing_NameAsc(BillStatus.PENDING)
            .stream().map(this::toBillResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BillResponse> findMyBills(Long memberId) {
        Member member = memberService.getOrThrow(memberId);
        if (member.getFlat() == null) return List.of();
        return billRepository.findByFlatIdOrderByBillMonthDesc(member.getFlat().getId())
            .stream().map(this::toBillResponse).toList();
    }

    private BillResponse toBillResponse(MaintenanceBill b) {
        String memberName = memberRepository
            .findByFlatIdAndIsActiveTrue(b.getFlat().getId())
            .stream()
            .findFirst()
            .map(m -> m.getFullName())
            .orElse(null);

        String paidDate      = null;
        String receiptNumber = null;

        List<Payment> payments = paymentRepository
            .findByBillIdAndApprovalStatus(b.getId(), ApprovalStatus.APPROVED);

        if (!payments.isEmpty()) {
            Payment p = payments.get(0);
            paidDate  = p.getPaymentDate() != null
                ? p.getPaymentDate()
                    .format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"))
                : null;
            receiptNumber = p.getReceiptNumber();
        }

        return BillResponse.from(b, memberName, paidDate, receiptNumber);
    }

    @Transactional
    public PaymentResponse recordPayment(PaymentRequest request) {
        MaintenanceBill bill = billRepository.findById(request.billId())
            .orElseThrow(() -> ResourceNotFoundException.of("Bill", request.billId()));

        if (BillStatus.PAID.equals(bill.getStatus())) {
            throw new BusinessRuleException(
                "This bill has already been paid.", "BILL_ALREADY_PAID"
            );
        }

        if (paymentRepository.existsByBillIdAndApprovalStatusNot(request.billId(), ApprovalStatus.REJECTED)) {
            throw new BusinessRuleException(
                "A payment is already pending approval for this bill.",
                "PAYMENT_ALREADY_PENDING"
            );
        }

        Member member = memberService.getOrThrow(request.memberId());

        Role currentRole = resolveCurrentRole();
        boolean isAdminLike = currentRole == Role.ADMIN
            || currentRole == Role.ACCOUNTANT
            || currentRole == Role.MANAGER;

        ApprovalStatus initialStatus = isAdminLike
            ? ApprovalStatus.APPROVED
            : ApprovalStatus.PENDING;

        Payment payment = Payment.builder()
            .bill(bill)
            .member(member)
            .amountPaid(request.amountPaid())
            .paymentMode(request.paymentMode())
            .paymentDate(request.paymentDate() != null ? request.paymentDate() : LocalDate.now())
            .approvalStatus(initialStatus)
            .build();

        if (isAdminLike) {
            payment.setReceiptNumber(receiptSequence.nextReceiptNumber());
            payment.setApprovedBy(resolveCurrentUserId());
            payment.setApprovedAt(LocalDateTime.now());
        }

        Payment saved = paymentRepository.save(payment);

        if (isAdminLike) {
            bill.setStatus(BillStatus.PAID);
            billRepository.save(bill);
            createMaintenanceAccountEntry(saved, bill, resolveCurrentUserId());
        }

        log.info("Payment recorded: billId={}, memberId={}, status={}",
            request.billId(), request.memberId(), initialStatus);

        return PaymentResponse.from(saved);
    }

    @Transactional
    public PaymentResponse approvePayment(Long paymentId) {
        Payment payment = getPaymentOrThrow(paymentId);

        if (!ApprovalStatus.PENDING.equals(payment.getApprovalStatus())) {
            throw new BusinessRuleException(
                "Only PENDING payments can be approved.", "PAYMENT_NOT_PENDING"
            );
        }

        payment.setApprovalStatus(ApprovalStatus.APPROVED);
        payment.setReceiptNumber(receiptSequence.nextReceiptNumber());
        payment.setApprovedBy(resolveCurrentUserId());
        payment.setApprovedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);

        MaintenanceBill bill = saved.getBill();
        bill.setStatus(BillStatus.PAID);
        billRepository.save(bill);

        createMaintenanceAccountEntry(saved, bill, resolveCurrentUserId());

        log.info("Payment approved: id={}", paymentId);

        return PaymentResponse.from(saved);
    }

    @Transactional
    public PaymentResponse rejectPayment(Long paymentId, RejectPaymentRequest request) {
        Payment payment = getPaymentOrThrow(paymentId);

        if (!ApprovalStatus.PENDING.equals(payment.getApprovalStatus())) {
            throw new BusinessRuleException(
                "Only PENDING payments can be rejected.", "PAYMENT_NOT_PENDING"
            );
        }

        payment.setApprovalStatus(ApprovalStatus.REJECTED);
        payment.setRejectionReason(request.reason());
        payment.setApprovedBy(resolveCurrentUserId());
        payment.setApprovedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);
        log.info("Payment rejected: id={}, reason={}", paymentId, request.reason());

        return PaymentResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> findAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(p -> toPaymentResponse(p)).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> findPendingPayments() {
        return paymentRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.PENDING)
            .stream().map(p -> toPaymentResponse(p)).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> findMyPayments(Long memberId) {
        return paymentRepository.findByMemberIdOrderByCreatedAtDesc(memberId)
            .stream().map(p -> toPaymentResponse(p)).toList();
    }

    private PaymentResponse toPaymentResponse(Payment p) {
        String flatOwnerName = memberRepository
            .findByFlatIdAndIsActiveTrue(p.getBill().getFlat().getId())
            .stream()
            .findFirst()
            .map(m -> m.getFullName())
            .orElse(null);
        return PaymentResponse.from(p, flatOwnerName);
    }

    @Transactional
    public java.util.Map<String, Object> yearClose(String newYearMonth) {
        List<MaintenanceBill> pendingBills = billRepository
            .findByStatusOrderByBillMonthDescFlat_Wing_NameAsc(BillStatus.PENDING);

        if (pendingBills.isEmpty()) {
            return java.util.Map.of(
                "message", "No pending bills found. Nothing to carry forward.",
                "carriedForward", 0,
                "newBillsCreated", 0
            );
        }

        Long currentUserId = resolveCurrentUserId();

        java.util.Map<Long, java.math.BigDecimal> flatPendingMap = new java.util.LinkedHashMap<>();
        java.util.Map<Long, Flat> flatMap = new java.util.LinkedHashMap<>();

        for (MaintenanceBill bill : pendingBills) {
            Long flatId = bill.getFlat().getId();
            flatPendingMap.merge(flatId, bill.getTotalDue(), java.math.BigDecimal::add);
            flatMap.put(flatId, bill.getFlat());
            bill.setStatus(BillStatus.CARRIED_FORWARD);
            billRepository.save(bill);
        }

        int newBillsCreated = 0;
        for (java.util.Map.Entry<Long, java.math.BigDecimal> entry : flatPendingMap.entrySet()) {
            Long flatId   = entry.getKey();
            java.math.BigDecimal arrears = entry.getValue();
            Flat flat = flatMap.get(flatId);

            if (billRepository.existsByFlatIdAndBillMonth(flatId, newYearMonth)) {
                log.warn("Arrears bill already exists for flat {} month {}", flat.getFlatNumber(), newYearMonth);
                continue;
            }

            MaintenanceBill arrearsBill = MaintenanceBill.builder()
                .flat(flat)
                .billMonth(newYearMonth)
                .amount(arrears)
                .lateFine(java.math.BigDecimal.ZERO)
                .dueDate(null)
                .status(BillStatus.PENDING)
                .generatedBy(currentUserId)
                .build();

            billRepository.save(arrearsBill);
            newBillsCreated++;

            log.info("Arrears bill created: flat={} amount={} month={}",
                flat.getFlatNumber(), arrears, newYearMonth);
        }

        log.info("Year close done: {} bills carried forward, {} arrears bills created",
            pendingBills.size(), newBillsCreated);

        return java.util.Map.of(
            "message", "Year close successful",
            "carriedForward", pendingBills.size(),
            "newBillsCreated", newBillsCreated,
            "newYearMonth", newYearMonth
        );
    }

    @Transactional
    public void createOpeningBalanceBill(Member member, BigDecimal openingBalance) {
        if (openingBalance == null || openingBalance.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        if (member.getFlat() == null) {
            log.warn("Opening balance skipped — member id={} ला flat assign नाही", member.getId());
            return;
        }

        Flat flat = member.getFlat();
        String openingBillMonth = "OPENING-BAL";

        if (billRepository.existsByFlatIdAndBillMonth(flat.getId(), openingBillMonth)) {
            log.warn("Opening balance bill आधीच आहे flat={}, skip करत आहे", flat.getFlatNumber());
            return;
        }

        // Opening balance हे मागच्या वर्षीचं उधार आहे — चालू financial year चा 1 April due date म्हणून वापरतो
        java.time.LocalDate today = java.time.LocalDate.now();
        int fyStartYear = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
        java.time.LocalDate openingDueDate = java.time.LocalDate.of(fyStartYear, 4, 1);

        MaintenanceBill bill = MaintenanceBill.builder()
            .flat(flat)
            .billMonth(openingBillMonth)
            .amount(openingBalance)
            .lateFine(BigDecimal.ZERO)
            .dueDate(openingDueDate)
            .status(BillStatus.PENDING)
            .generatedBy(resolveCurrentUserId())
            .build();

        billRepository.save(bill);
        log.info("Opening balance bill created: flat={}, amount={}, member={}",
            flat.getFlatNumber(), openingBalance, member.getFullName());
    }

    @Transactional
    public BillResponse markAsUnpaid(Long billId) {
        MaintenanceBill bill = billRepository.findById(billId)
            .orElseThrow(() -> ResourceNotFoundException.of("Bill", billId));

        if (!BillStatus.PAID.equals(bill.getStatus())) {
            throw new BusinessRuleException("Only PAID bills can be marked as unpaid.", "BILL_NOT_PAID");
        }

        // Approved payments delete करा
        List<Payment> payments = paymentRepository.findByBillId(billId);
        for (Payment p : payments) {
            if (p.getReceiptNumber() != null) {
                accountEntryRepository.deleteByReference(p.getReceiptNumber());
            }
            paymentRepository.delete(p);
        }

        // Bill status PENDING वर परत
        bill.setStatus(BillStatus.PENDING);
        MaintenanceBill saved = billRepository.save(bill);
        log.info("Bill marked as unpaid: id={}", billId);
        return toBillResponse(saved);
    }

    @Transactional
    public void deleteBill(Long billId) {
        MaintenanceBill bill = billRepository.findById(billId)
            .orElseThrow(() -> ResourceNotFoundException.of("Bill", billId));

        // Associated payments delete करा
        List<Payment> payments = paymentRepository.findByBillId(billId);
        for (Payment p : payments) {
            // Account entries delete करा
            if (p.getReceiptNumber() != null) {
                accountEntryRepository.deleteByReference(p.getReceiptNumber());
            }
            paymentRepository.delete(p);
        }
        billRepository.delete(bill);
        log.info("Bill deleted: id={}", billId);
    }

    @Transactional
    public BillResponse updateBill(Long billId, com.adityainfotech.societyms.application.dto.request.UpdateBillRequest request) {
        MaintenanceBill bill = billRepository.findById(billId)
            .orElseThrow(() -> ResourceNotFoundException.of("Bill", billId));

        if (request.amount() != null) {
            bill.setAmount(request.amount());
            BigDecimal fine = request.lateFine() != null ? request.lateFine() : bill.getLateFine();
            bill.setLateFine(fine);
            bill.setTotalDue(request.amount().add(fine));
        }
        if (request.dueDate() != null) bill.setDueDate(request.dueDate());

        MaintenanceBill saved = billRepository.save(bill);
        log.info("Bill updated: id={}", billId);
        return toBillResponse(saved);
    }

    private void createMaintenanceAccountEntry(Payment payment, MaintenanceBill bill, Long userId) {
        try {
            PaymentMode mode = payment.getPaymentMode();
            boolean isCash = mode == PaymentMode.CASH || mode == PaymentMode.CHEQUE;
            String category = isCash ? "Cash" : "Bank";

            String title = String.format("Maintenance - %s | %s %s | Receipt: %s",
                bill.getBillMonth(),
                bill.getFlat().getWing() != null ? bill.getFlat().getWing().getName() : "",
                bill.getFlat().getFlatNumber(),
                payment.getReceiptNumber()
            );

            AccountEntry entry = AccountEntry.builder()
                .title(title)
                .amount(payment.getAmountPaid())
                .entryType(EntryType.INCOME)
                .category(category)
                .subCategory("Maintenance")
                .description("Maintenance payment received from " +
                    payment.getMember().getFullName() +
                    " for " + bill.getBillMonth())
                .entryDate(payment.getPaymentDate())
                .reference(payment.getReceiptNumber())
                .isVerified(true)
                .createdBy(userId)
                .build();

            accountEntryRepository.save(entry);
            log.info("AccountEntry created for payment receipt={}", payment.getReceiptNumber());

        } catch (Exception e) {
            log.error("Failed to create AccountEntry for payment {}: {}", payment.getId(), e.getMessage());
        }
    }

    private Payment getPaymentOrThrow(Long id) {
        return paymentRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("Payment", id));
    }

    private Long resolveCurrentUserId() {
        String username = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        return userRepository.findByUsername(username)
            .map(u -> u.getId())
            .orElse(null);
    }

    private Role resolveCurrentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
            .findFirst()
            .map(a -> Role.valueOf(a.getAuthority().replace("ROLE_", "")))
            .orElse(Role.MEMBER);
    }
}