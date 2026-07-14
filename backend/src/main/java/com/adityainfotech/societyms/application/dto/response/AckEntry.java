package com.adityainfotech.societyms.application.dto.response;

import java.time.LocalDateTime;

public record AckEntry(String memberName, LocalDateTime readAt) {}
