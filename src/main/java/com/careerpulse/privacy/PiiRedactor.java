package com.careerpulse.privacy;

import java.util.Map;

/**
 * Contract for PII (Personally Identifiable Information) detection and masking
 * before resume persistence or optional external API enrichment.
 */
public interface PiiRedactor {
    RedactionResult redact(String input);

    record RedactionResult(
        String redactedText,
        int totalMaskedCount,
        Map<String, Integer> categoryCounts
    ) {}
}
