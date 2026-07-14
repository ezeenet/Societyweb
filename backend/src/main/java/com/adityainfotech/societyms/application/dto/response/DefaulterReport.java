package com.adityainfotech.societyms.application.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record DefaulterReport(List<DefaulterRow> defaulters, BigDecimal totalOutstanding) {}
