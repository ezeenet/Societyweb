package com.adityainfotech.societyms.application.dto.request;

public record ParkingSlotRequest(
    String slotNumber,
    String slotType,
    String notes
) {}