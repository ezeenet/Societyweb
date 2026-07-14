package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.infrastructure.persistence.jpa.PaymentJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Generates globally unique, human-readable receipt numbers.
 *
 * Format: RCPT-YYYYMM-XXXX
 *   e.g.  RCPT-202504-0042
 *
 * Strategy:
 *   1. Base counter seeded from DB count of existing payments on startup.
 *   2. AtomicInteger ensures thread-safety without DB locking overhead.
 *   3. If a collision is somehow detected, we increment and retry.
 *
 * Note: This counter resets if the server restarts and the DB is empty.
 * For multi-node deployments (Phase 8+), replace with a DB sequence.
 */
@Service
@RequiredArgsConstructor
public class ReceiptSequenceService {

    private final PaymentJpaRepository paymentRepository;
    private final AtomicInteger counter = new AtomicInteger(0);

    private static final DateTimeFormatter MONTH_FMT =
        DateTimeFormatter.ofPattern("yyyyMM");

    /** Called once on first use — lazy init from DB count. */
    private volatile boolean initialized = false;

    public synchronized String nextReceiptNumber() {
        if (!initialized) {
            long existing = paymentRepository.count();
            counter.set((int) existing);
            initialized = true;
        }

        String yearMonth = YearMonth.now().format(MONTH_FMT);
        int seq = counter.incrementAndGet();
        String candidate = String.format("RCPT-%s-%04d", yearMonth, seq);

        // Collision guard (extremely rare — only if DB was manually edited)
        while (paymentRepository.existsByReceiptNumber(candidate)) {
            seq = counter.incrementAndGet();
            candidate = String.format("RCPT-%s-%04d", yearMonth, seq);
        }

        return candidate;
    }
}
