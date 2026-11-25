package com.careerpulse.engine;

import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Evaluates quantified impact (Google XYZ formula evidence: percentages, revenue/cost,
 * throughput/latency numbers, and scale multipliers inside resume bullet points).
 */
public class QuantifiableImpactScorer implements ScoringCriterion {
    private static final Pattern METRIC_PATTERN = Pattern.compile(
        "(?i)(\\$\\d+[\\d,.]*[kmb]?|\\b\\d+(?:\\.\\d+)?\\s*(%|x|ms|sec|seconds|minutes|hours|hrs|k|m|b|million|billion|users|requests|rps|tps|queries|clients|engineers|teams|projects|gb|tb)\\b)"
    );

    @Override
    public String getKey() {
        return "quantifiableImpact";
    }

    @Override
    public String getDisplayName() {
        return "Quantifiable Impact (XYZ)";
    }

    @Override
    public double getWeight() {
        return 0.25;
    }

    @Override
    public CategoryScore evaluate(ResumeDocument resume, JobDescriptionDocument jobDescription) {
        List<String> bullets = resume.getBulletPoints();
        int quantifiedBullets = 0;
        int totalMetricMentions = 0;

        for (String bullet : bullets) {
            var matcher = METRIC_PATTERN.matcher(bullet);
            int inBullet = 0;
            while (matcher.find()) {
                inBullet++;
                totalMetricMentions++;
            }
            if (inBullet > 0) {
                quantifiedBullets++;
            }
        }

        // Fallback scan across full text if user did not format with bullet markers
        if (bullets.isEmpty()) {
            var matcher = METRIC_PATTERN.matcher(resume.getNormalizedContent());
            while (matcher.find()) {
                totalMetricMentions++;
            }
        }

        int score;
        if (!bullets.isEmpty()) {
            double ratio = (double) quantifiedBullets / bullets.size();
            score = (int) Math.round(22 + Math.min(1.0, ratio / 0.75) * 58 + Math.min(20, totalMetricMentions * 2.5));
        } else {
            score = (int) Math.round(18 + Math.min(45, totalMetricMentions * 7.5));
        }

        score = Math.max(15, Math.min(100, score));
        String feedback = bullets.isEmpty()
            ? String.format("No structured bullet points detected (%d numeric metrics found). Format achievements as quantified XYZ bullets.", totalMetricMentions)
            : String.format("%d of %d bullets contain quantified outcomes (%d total metric signals).", quantifiedBullets, bullets.size(), totalMetricMentions);

        return new CategoryScore(getDisplayName(), score, getWeight(), feedback);
    }
}
