package com.careerpulse.engine;

import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;

/**
 * Polymorphic strategy interface for weighted ATS evaluation criteria.
 * Implementations are composed into a {@link java.util.List} inside {@link ResumeAnalyzerService}.
 */
public interface ScoringCriterion {
    String getKey();

    String getDisplayName();

    double getWeight();

    CategoryScore evaluate(ResumeDocument resume, JobDescriptionDocument jobDescription);
}
