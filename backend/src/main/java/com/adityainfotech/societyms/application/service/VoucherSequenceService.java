package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.infrastructure.persistence.jpa.ExpenseVoucherJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class VoucherSequenceService {

    private final ExpenseVoucherJpaRepository voucherRepository;
    private final AtomicInteger counter = new AtomicInteger(0);
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyyMM");
    private volatile boolean initialized = false;

    public synchronized String nextVoucherNumber() {
        return nextVoucherNumber("EXPENSE");
    }

    public synchronized String nextVoucherNumber(String voucherType) {
        if (!initialized) {
            counter.set((int) voucherRepository.count());
            initialized = true;
        }
        String prefix = switch (voucherType) {
            case "PAYMENT" -> "PMT";
            case "RECEIPT" -> "RCP";
            default        -> "EXP";
        };
        String yearMonth = YearMonth.now().format(MONTH_FMT);
        int seq = counter.incrementAndGet();
        String candidate = String.format("%s-%s-%04d", prefix, yearMonth, seq);
        while (voucherRepository.existsByVoucherNumber(candidate)) {
            seq = counter.incrementAndGet();
            candidate = String.format("%s-%s-%04d", prefix, yearMonth, seq);
        }
        return candidate;
    }
}