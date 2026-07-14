package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.BankAccountRequest;
import com.adityainfotech.societyms.application.dto.request.BankTransactionRequest;
import com.adityainfotech.societyms.application.dto.response.BankAccountResponse;
import com.adityainfotech.societyms.application.dto.response.BankTransactionResponse;
import com.adityainfotech.societyms.domain.entity.BankAccount;
import com.adityainfotech.societyms.domain.entity.BankTransaction;
import com.adityainfotech.societyms.domain.entity.AccountEntry;
import com.adityainfotech.societyms.domain.enums.EntryType;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.AccountEntryJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.BankAccountJpaRepository;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.BankTransactionJpaRepository;
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
public class BankService {

    private final BankAccountJpaRepository     accountRepository;
    private final BankTransactionJpaRepository transactionRepository;
    private final AccountEntryJpaRepository    accountEntryRepository;

    // ── Bank Accounts ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BankAccountResponse> findAllAccounts() {
        return accountRepository.findAllByOrderByAccountNameAsc().stream()
            .map(a -> BankAccountResponse.from(a, transactionRepository.getBalance(a.getId())))
            .toList();
    }

    @Transactional
    public BankAccountResponse createAccount(BankAccountRequest request) {
        BankAccount account = BankAccount.builder()
            .accountName(request.accountName())
            .bankName(request.bankName())
            .accountNumber(request.accountNumber())
            .branch(request.branch())
            .openingBalance(request.openingBalance() != null ? request.openingBalance() : BigDecimal.ZERO)
            .build();
        BankAccount saved = accountRepository.save(account);
        return BankAccountResponse.from(saved, BigDecimal.ZERO);
    }

    @Transactional
    public BankAccountResponse updateAccount(Long id, BankAccountRequest request) {
        BankAccount account = accountRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("BankAccount", id));
        account.setAccountName(request.accountName());
        account.setBankName(request.bankName());
        account.setAccountNumber(request.accountNumber());
        account.setBranch(request.branch());
        if (request.openingBalance() != null) account.setOpeningBalance(request.openingBalance());
        BankAccount saved = accountRepository.save(account);
        return BankAccountResponse.from(saved, transactionRepository.getBalance(id));
    }

    @Transactional
    public void deleteAccount(Long id) {
        accountRepository.delete(accountRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("BankAccount", id)));
    }

    // ── Transactions ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BankTransactionResponse> getTransactions(Long accountId) {
        BankAccount account = accountRepository.findById(accountId)
            .orElseThrow(() -> ResourceNotFoundException.of("BankAccount", accountId));

        List<BankTransaction> txns = transactionRepository
            .findByBankAccountIdOrderByTransactionDateAscCreatedAtAsc(accountId);

        BigDecimal running = account.getOpeningBalance() != null ? account.getOpeningBalance() : BigDecimal.ZERO;
        List<BankTransactionResponse> result = new ArrayList<>();
        for (BankTransaction t : txns) {
            running = "DEPOSIT".equals(t.getTransactionType())
                ? running.add(t.getAmount())
                : running.subtract(t.getAmount());
            result.add(BankTransactionResponse.from(t, running));
        }
        return result;
    }

    @Transactional
    public BankTransactionResponse addTransaction(BankTransactionRequest request) {
        BankAccount account = accountRepository.findById(request.bankAccountId())
            .orElseThrow(() -> ResourceNotFoundException.of("BankAccount", request.bankAccountId()));

        LocalDate txnDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();

        BankTransaction txn = BankTransaction.builder()
            .bankAccount(account)
            .transactionType(request.transactionType())
            .amount(request.amount())
            .description(request.description())
            .transactionDate(txnDate)
            .reference(request.reference())
            .build();

        BankTransaction saved = transactionRepository.save(txn);
        BigDecimal balance = account.getOpeningBalance().add(transactionRepository.getBalance(account.getId()));

        // Contra Entry — Bank to Cash or Cash to Bank
        if (Boolean.TRUE.equals(request.contraEntry())) {
            createContraAccountEntry(request, account.getAccountName(), txnDate);
        }

        log.info("Bank transaction: {} {} in account {}", request.transactionType(), request.amount(), account.getAccountName());
        return BankTransactionResponse.from(saved, balance);
    }

    private void createContraAccountEntry(BankTransactionRequest request, String accountName, LocalDate txnDate) {
        try {
            boolean isBankToCash = "WITHDRAWAL".equals(request.transactionType());

            // Bank to Cash: Cash Dr (INCOME in Cash category)
            // Cash to Bank: Bank Dr (INCOME in Bank category)
            String category    = isBankToCash ? "Cash" : "Bank";
            String title       = isBankToCash
                ? "Contra — Cash received from Bank (" + accountName + ")"
                : "Contra — Cash deposited to Bank (" + accountName + ")";
            String description = isBankToCash
                ? "Bank withdrawal transferred to cash"
                : "Cash deposited to bank account";

            AccountEntry entry = AccountEntry.builder()
                .title(title)
                .amount(request.amount())
                .entryType(EntryType.INCOME)
                .category(category)
                .description(description)
                .entryDate(txnDate)
                .reference(request.reference() != null ? "CONTRA-" + request.reference() : null)
                .isVerified(true)
                .createdBy(null)
                .build();

            accountEntryRepository.save(entry);
            log.info("Contra entry created: {} -> {}", isBankToCash ? "Bank" : "Cash", category);
        } catch (Exception e) {
            log.error("Failed to create contra entry: {}", e.getMessage());
        }
    }

    @Transactional
    public void deleteTransaction(Long id) {
        transactionRepository.delete(transactionRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.of("BankTransaction", id)));
    }
}