package com.adityainfotech.societyms.application.dto.response;

import com.adityainfotech.societyms.domain.entity.Vendor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VendorResponse(
    Long id, String name, String vendorType, String mobile,
    String address, String notes, Boolean isActive,
    BigDecimal totalPaid, Integer voucherCount,
    LocalDateTime createdAt
) {
    public static VendorResponse from(Vendor v, BigDecimal totalPaid, int voucherCount) {
        return new VendorResponse(
            v.getId(), v.getName(), v.getVendorType(), v.getMobile(),
            v.getAddress(), v.getNotes(), v.getIsActive(),
            totalPaid, voucherCount, v.getCreatedAt()
        );
    }
}