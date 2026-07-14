package com.adityainfotech.societyms.domain.enums;

public enum FlatType {
    BHK_1,
    BHK_2,
    BHK_3,
    STUDIO,
    PENTHOUSE;

    /** Human-readable label used in receipts and reports. */
    public String getLabel() {
        return switch (this) {
            case BHK_1     -> "1 BHK";
            case BHK_2     -> "2 BHK";
            case BHK_3     -> "3 BHK";
            case STUDIO    -> "Studio";
            case PENTHOUSE -> "Penthouse";
        };
    }
}
