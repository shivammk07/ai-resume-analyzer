package com.careerpulse.engine;

import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Evaluates strong active ownership verbs versus passive task phrasing.
 */
public class ActionVerbScorer implements ScoringCriterion {
    private static final Set<String> STRONG_VERBS = Set.of(
        "architected", "engineered", "designed", "implemented", "built", "led", "spearheaded",
        "optimized", "reduced", "increased", "accelerated", "automated", "migrated", "scaled",
        "delivered", "launched", "developed", "refactored", "established", "mentored", "orchestrated",
        "streamlined", "eliminated", "secured", "deployed", "integrated", "resolved", "created",
        "improved", "transformed", "directed", "owned", "authored", "benchmarked", "hardened"
    );

    private static final List<String> PASSIVE_PHRASES = List.of(
        "responsible for", "worked on", "helped with", "assisted in", "duties included",
        "tasked with", "involved in", "participated in", "did various"
    );

    @Override
    public String getKey() {
        return "actionVerbs";
    }

    @Override
    public String getDisplayName() {
        return "Action Verbs & Ownership";
    }

    @Override
    public double getWeight() {
        return 0.15;
    }

    @Override
    public CategoryScore evaluate(ResumeDocument resume, JobDescriptionDocument jobDescription) {
        List<String> bullets = resume.getBulletPoints();
        String lowerFull = resume.getNormalizedContent().toLowerCase(Locale.ROOT);

        int strongStarts = 0;
        for (String bullet : bullets) {
            String firstWord = bullet.toLowerCase(Locale.ROOT).split("\\s+")[0].replaceAll("[^a-z]", "");
            if (STRONG_VERBS.contains(firstWord)) {
                strongStarts++;
            }
        }

        int passiveHits = 0;
        for (String passive : PASSIVE_PHRASES) {
            if (lowerFull.contains(passive)) {
                passiveHits++;
            }
        }

        int strongAnywhere = 0;
        for (String token : resume.getTokenFrequencies().keySet()) {
            if (STRONG_VERBS.contains(token)) {
                strongAnywhere++;
            }
        }

        int score;
        if (!bullets.isEmpty()) {
            double strongRatio = (double) strongStarts / bullets.size();
            score = (int) Math.round(32 + (strongRatio * 56) + Math.min(12, strongAnywhere * 2) - (passiveHits * 11));
        } else {
            score = 28 + Math.min(35, strongAnywhere * 5) - (passiveHits * 10);
        }

        score = Math.max(15, Math.min(100, score));
        String feedback = passiveHits > 0
            ? String.format("Found %d passive phrases ('responsible for'/'worked on'). Start bullets with high-ownership verbs.", passiveHits)
            : String.format("%d/%d bullets open with strong action verbs (%d distinct ownership verbs across resume).",
                strongStarts, Math.max(1, bullets.size()), strongAnywhere);

        return new CategoryScore(getDisplayName(), score, getWeight(), feedback);
    }
}
