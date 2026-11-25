package com.careerpulse.engine;

import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Evaluates ATS machine parsability: standard section headings, contact metadata presence
 * (original or redacted placeholders), and healthy document length.
 */
public class AtsParsabilityScorer implements ScoringCriterion {
    private static final Pattern CONTACT_SIGNAL = Pattern.compile(
        "(?i)(@|\\[REDACTED_EMAIL]|\\[REDACTED_PHONE]|linkedin\\.com|github\\.com|\\b\\d{3}[\\s.-]\\d{3}[\\s.-]\\d{4}\\b)"
    );
    private static final Pattern DATE_RANGE_PATTERN = Pattern.compile(
        "(?i)(20\\d{2}|19\\d{2})\\s*[-–—to]+\\s*(20\\d{2}|present|current)"
    );

    @Override
    public String getKey() {
        return "atsParsability";
    }

    @Override
    public String getDisplayName() {
        return "ATS Parsability & Structure";
    }

    @Override
    public double getWeight() {
        return 0.25;
    }

    @Override
    public CategoryScore evaluate(ResumeDocument resume, JobDescriptionDocument jobDescription) {
        int score = 20;
        String text = resume.getNormalizedContent();

        // Standard ATS section headings (up to +44 points)
        List<String> coreSections = List.of("experience", "skills", "education", "summary");
        int foundSections = 0;
        for (String section : coreSections) {
            if (resume.hasSection(section)) {
                foundSections++;
            }
        }
        score += foundSections * 11;

        // Contact metadata present (original or PII-redacted placeholder) (+16 points)
        if (CONTACT_SIGNAL.matcher(text).find()) {
            score += 16;
        }

        // Chronological employment date range formatting (+10 points)
        if (DATE_RANGE_PATTERN.matcher(text).find()) {
            score += 10;
        }

        // Optimal word count window (180–950 words) (+10 points)
        int words = resume.getWordCount();
        if (words >= 180 && words <= 950) {
            score += 10;
        } else if (words >= 100 && words <= 1250) {
            score += 5;
        }

        score = Math.min(100, score);
        String feedback = foundSections >= 3
            ? String.format("Detected %d/4 standard ATS sections and %d words with machine-readable structure.", foundSections, words)
            : String.format("Only %d/4 standard ATS headings detected (Experience, Skills, Education, Summary); add explicit headings.", foundSections);

        return new CategoryScore(getDisplayName(), score, getWeight(), feedback);
    }
}
