package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.ExpenseVoucherRequest;
import com.adityainfotech.societyms.application.dto.response.ExpenseVoucherResponse;
import com.adityainfotech.societyms.domain.entity.AccountEntry;
import com.adityainfotech.societyms.domain.entity.ExpenseVoucher;
import com.adityainfotech.societyms.domain.entity.ExpenseVoucherItem;
import com.adityainfotech.societyms.domain.enums.EntryType;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.AccountEntryJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.ExpenseVoucherJpaRepository;
import com.adityainfotech.societyms.presentation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseVoucherService {

    private final ExpenseVoucherJpaRepository voucherRepository;
    private final AccountEntryJpaRepository   accountEntryRepository;
    private final VoucherSequenceService      voucherSequence;
    private final com.adityainfotech.societyms.infrastructure.persistence.jpa.VendorJpaRepository vendorRepository;

    @Transactional(readOnly = true)
    public List<ExpenseVoucherResponse> findAll() {
        return voucherRepository.findAllByOrderByVoucherDateDescIdDesc()
            .stream().map(ExpenseVoucherResponse::from).toList();
    }

    @Transactional
    public ExpenseVoucherResponse create(ExpenseVoucherRequest request) {
        BigDecimal subTotal = BigDecimal.ZERO;
        List<ExpenseVoucherItem> items = new ArrayList<>();

        for (ExpenseVoucherRequest.VoucherItemRequest itemReq : request.items()) {
            BigDecimal qty    = itemReq.quantity() != null ? itemReq.quantity() : BigDecimal.ONE;
            BigDecimal price  = itemReq.pricePerUnit() != null ? itemReq.pricePerUnit() : BigDecimal.ZERO;
            BigDecimal amount = qty.multiply(price);
            subTotal = subTotal.add(amount);

            items.add(ExpenseVoucherItem.builder()
                .itemName(itemReq.itemName())
                .quantity(qty)
                .pricePerUnit(price)
                .amount(amount)
                .build());
        }

        BigDecimal paid    = request.paidAmount() != null ? request.paidAmount() : subTotal;
        BigDecimal balance = subTotal.subtract(paid);

        com.adityainfotech.societyms.domain.entity.Vendor vendor = null;
        if (request.vendorId() != null) {
            vendor = vendorRepository.findById(request.vendorId()).orElse(null);
        } else if (request.vendorName() != null && !request.vendorName().isBlank()) {
            // Auto-create vendor if name provided but not in DB
            String vendorName = request.vendorName().trim();
            vendor = vendorRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .filter(v -> v.getName().equalsIgnoreCase(vendorName))
                .findFirst()
                .orElseGet(() -> {
                    com.adityainfotech.societyms.domain.entity.Vendor newVendor =
                        com.adityainfotech.societyms.domain.entity.Vendor.builder()
                            .name(vendorName)
                            .isActive(true)
                            .build();
                    return vendorRepository.save(newVendor);
                });
        }

        String vType = request.voucherType() != null ? request.voucherType() : "EXPENSE";

        ExpenseVoucher voucher = ExpenseVoucher.builder()
            .voucherNumber(voucherSequence.nextVoucherNumber(vType))
            .voucherType(vType)
            .expenseFor(request.expenseFor())
            .vendorName(vendor != null ? vendor.getName() : request.vendorName())
            .vendor(vendor)
            .voucherDate(request.voucherDate() != null ? request.voucherDate() : LocalDate.now())
            .subTotal(subTotal)
            .totalAmount(subTotal)
            .paidAmount(paid)
            .balanceAmount(balance)
            .paymentMode(request.paymentMode() != null ? request.paymentMode() : "CASH")
            .description(request.description())
            .build();

        items.forEach(i -> i.setVoucher(voucher));
        voucher.setItems(items);

        ExpenseVoucher saved = voucherRepository.save(voucher);

        // Create matching AccountEntry (EXPENSE)
        try {
            String category = "CASH".equals(saved.getPaymentMode()) || "CHEQUE".equals(saved.getPaymentMode()) ? "Cash" : "Bank";
            EntryType entryType = "RECEIPT".equals(saved.getVoucherType()) ? EntryType.INCOME : EntryType.EXPENSE;
            AccountEntry entry = AccountEntry.builder()
                .title(saved.getVoucherType() + " Voucher — " + saved.getExpenseFor() + (saved.getVendorName() != null ? " (" + saved.getVendorName() + ")" : ""))
                .amount(saved.getPaidAmount())
                .entryType(entryType)
                .category(category)
                .description(saved.getDescription())
                .entryDate(saved.getVoucherDate())
                .reference(saved.getVoucherNumber())
                .isVerified(true)
                .build();
            AccountEntry savedEntry = accountEntryRepository.save(entry);
            saved.setAccountEntryId(savedEntry.getId());
            voucherRepository.save(saved);
        } catch (Exception e) {
            log.error("Failed to create account entry for voucher {}: {}", saved.getVoucherNumber(), e.getMessage());
        }

        log.info("Expense voucher created: {} for {}", saved.getVoucherNumber(), saved.getExpenseFor());
        return ExpenseVoucherResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        ExpenseVoucher voucher = voucherRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("ExpenseVoucher", id));

        if (voucher.getAccountEntryId() != null) {
            accountEntryRepository.deleteById(voucher.getAccountEntryId());
        }
        voucherRepository.delete(voucher);
        log.info("Expense voucher deleted: {}", voucher.getVoucherNumber());
    }
}