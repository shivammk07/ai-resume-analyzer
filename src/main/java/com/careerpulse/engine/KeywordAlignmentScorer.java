package com.careerpulse.engine;

import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Computes set-based keyword alignment between the resume and target job description.
 */
public class KeywordAlignmentScorer implements ScoringCriterion {

    @Override
    public String getKey() {
        return "keywordMatch";
    }

    @Override
    public String getDisplayName() {
        return "Keyword & Skill Alignment";
    }

    @Override
    public double getWeight() {
        return 0.20;
    }

    @Override
    public CategoryScore evaluate(ResumeDocument resume, JobDescriptionDocument jobDescription) {
        Set<String> required = jobDescription.getRequiredKeywords();
        if (required.isEmpty()) {
            return new CategoryScore(getDisplayName(), 65, getWeight(), "No target keywords supplied; baseline neutral score assigned.");
        }

        String lowerResume = resume.getNormalizedContent().toLowerCase(Locale.ROOT);
        Set<String> resumeTokens = resume.getTokenFrequencies().keySet();

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (String kw : required) {
            if (resumeTokens.contains(kw) || lowerResume.contains(kw)) {
                matched.add(kw);
            } else {
                missing.add(kw);
            }
        }

        double recall = (double) matched.size() / required.size();
        int score = (int) Math.round(15 + (recall * 85));
        score = Math.max(15, Math.min(100, score));

        String feedback = String.format(
            "Matched %d of %d target keywords (%.0f%% coverage). Missing priorities: %s.",
            matched.size(),
            required.size(),
            recall * 100.0,
            missing.isEmpty() ? "none" : String.join(", ", missing.subList(0, Math.min(4, missing.size())))
        );

        return new CategoryScore(getDisplayName(), score, getWeight(), feedback);
    }
}
