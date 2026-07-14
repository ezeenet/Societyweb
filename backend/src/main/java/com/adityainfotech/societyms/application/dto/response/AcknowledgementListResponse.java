package com.adityainfotech.societyms.application.dto.response;

import java.util.List;

public record AcknowledgementListResponse(long count, List<AckEntry> members) {}
