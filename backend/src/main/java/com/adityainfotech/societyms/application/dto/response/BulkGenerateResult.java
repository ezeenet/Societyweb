package com.adityainfotech.societyms.application.dto.response;

import java.util.List;

public record BulkGenerateResult(
    int generated,
    int skipped,
    String billMonth,
    List<String> skippedFlats
) {}
