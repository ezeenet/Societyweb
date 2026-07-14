package com.adityainfotech.societyms.domain.enums;

public enum PaymentMode {
    CASH,
    UPI,
    NEFT,
    RTGS,
    CHEQUE,
    ONLINE;

    /** Whether this mode is considered a bank transaction (for Bank Book report). */
    public boolean isBankMode() {
        return this == UPI || this == NEFT || this == RTGS || this == ONLINE;
    }

    /** Whether this mode appears in Cash Book. */
    public boolean isCashMode() {
        return this == CASH || this == CHEQUE;
    }
}
