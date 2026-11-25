package com.careerpulse.engine;

import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;

import java.util.List;

/**
 * Evaluates readability, concise bullet length, scannability, and absence of dense walls of text.
 */
public class FormattingReadabilityScorer implements ScoringCriterion {

    @Override
    public String getKey() {
        return "formattingReadability";
    }

    @Override
    public String getDisplayName() {
        return "Formatting & Readability";
    }

    @Override
    public double getWeight() {
        return 0.15;
    }

    @Override
    public CategoryScore evaluate(ResumeDocument resume, JobDescriptionDocument jobDescription) {
        List<String> bullets = resume.getBulletPoints();
        List<String> lines = resume.getLines();

        int score = 30;

        // Structured bullet density (up to +30)
        if (bullets.size() >= 6) {
            score += 30;
        } else if (bullets.size() >= 3) {
            score += 20;
        } else if (!bullets.isEmpty()) {
            score += 10;
        }

        // Ideal bullet conciseness (10–32 words per bullet) (+20)
        if (!bullets.isEmpty()) {
            long wellSized = bullets.stream()
                .filter(b -> {
                    int wc = b.split("\\s+").length;
                    return wc >= 8 && wc <= 34;
                })
                .count();
            score += (int) Math.round(((double) wellSized / bullets.size()) * 20);
        }

        // Penalize long wall-of-text paragraphs (> 55 words on a single line) (+20 baseline minus penalties)
        long wallLines = lines.stream()
            .filter(line -> line.split("\\s+").length > 55)
            .count();
        score += Math.max(0, 20 - (int) (wallLines * 10));

        score = Math.max(15, Math.min(100, score));
        String feedback = wallLines > 0
            ? String.format("Detected %d dense paragraph blocks (>55 words/line). Break dense prose into scannable 1–2 line bullets.", wallLines)
            : String.format("Clean scannable layout with %d structured bullets across %d non-empty lines.", bullets.size(), lines.size());

        return new CategoryScore(getDisplayName(), score, getWeight(), feedback);
    }
}
