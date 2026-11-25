package com.careerpulse.engine;

import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;

import java.util.Optional;

/**
 * Optional AI enrichment contract. Core scoring never depends on an external API key;
 * implementations return {@link Optional#empty()} when unconfigured or offline.
 */
public interface OptionalAiEnricher {
    boolean isConfigured();

    Optional<String> generateOptionalAdvice(
        ResumeDocument redactedResume,
        JobDescriptionDocument jobDescription,
        AnalysisReport baselineReport
    );
}
