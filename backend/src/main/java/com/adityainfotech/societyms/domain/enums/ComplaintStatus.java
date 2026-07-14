package com.adityainfotech.societyms.domain.enums;

// ─────────────────────────────────────────────────────────────────────────────
// Complaints
// ─────────────────────────────────────────────────────────────────────────────

public enum ComplaintStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED;

    /** Member is only allowed to move a complaint to these statuses. */
    public static boolean isMemberAllowed(ComplaintStatus target) {
        return target == OPEN || target == IN_PROGRESS;
    }
}
