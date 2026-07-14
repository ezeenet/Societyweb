package com.adityainfotech.societyms.application.dto.request;

public record VendorRequest(
    String name,
    String vendorType,
    String mobile,
    String address,
    String notes,
    Boolean isActive
) {}