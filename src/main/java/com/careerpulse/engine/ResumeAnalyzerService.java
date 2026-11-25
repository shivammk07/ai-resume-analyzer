package com.careerpulse.engine;

import com.careerpulse.exception.DocumentValidationException;
import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.EngineMode;
import com.careerpulse.model.FixRecommendation;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;
import com.careerpulse.model.RetentionPolicy;
import com.careerpulse.privacy.PiiRedactor;
import com.careerpulse.privacy.RegexPiiRedactor;
import com.careerpulse.util.JsonSupport;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

/**
 * Core Java orchestration service demonstrating polymorphism ({@link ScoringCriterion}),
 * Java Collections ({@link List}, {@link Map}, {@link Set}, {@link PriorityQueue}),
 * privacy-first PII masking, and deterministic offline ATS scoring.
 */
public class ResumeAnalyzerService {
    private final List<ScoringCriterion> criteria;
    private final PiiRedactor piiRedactor;

    public ResumeAnalyzerService() {
        this(
            List.of(
                new AtsParsabilityScorer(),
                new QuantifiableImpactScorer(),
                new ActionVerbScorer(),
                new KeywordAlignmentScorer(),
                new FormattingReadabilityScorer()
            ),
            new RegexPiiRedactor()
        );
    }

    public ResumeAnalyzerService(
            List<ScoringCriterion> criteria,
            PiiRedactor piiRedactor) {
        this.criteria = Collections.unmodifiableList(new ArrayList<>(criteria));
        this.piiRedactor = piiRedactor;
    }

    public AnalysisBundle analyze(
            String rawResumeText,
            String fileName,
            String detectedFormat,
            String targetRole,
            String jobDescriptionText,
            String seniorityLevel,
            boolean redactPii,
            RetentionPolicy retentionPolicy,
            EngineMode engineMode) throws DocumentValidationException {

        long startNanos = System.nanoTime();
        if (rawResumeText == null || rawResumeText.trim().length() < 20) {
            throw new DocumentValidationException("Resume text must contain at least 20 characters.");
        }

        PiiRedactor.RedactionResult redaction = redactPii
            ? piiRedactor.redact(rawResumeText)
            : new PiiRedactor.RedactionResult(rawResumeText, 0, Collections.emptyMap());

        ResumeDocument resume = new ResumeDocument(redaction.redactedText(), fileName, detectedFormat);
        resume.setPiiItemsMasked(redaction.totalMaskedCount());
        RetentionPolicy effectivePolicy = retentionPolicy != null ? retentionPolicy : RetentionPolicy.HOURS_24;
        resume.setRetentionPolicy(effectivePolicy);
        resume.setExpiresAt(effectivePolicy.computeExpiry(Instant.now()));

        JobDescriptionDocument jd = new JobDescriptionDocument(targetRole, jobDescriptionText, seniorityLevel);

        Map<String, CategoryScore> scores = new LinkedHashMap<>();
        double weightedSum = 0.0;
        double totalWeight = 0.0;

        for (ScoringCriterion criterion : criteria) {
            CategoryScore cs = criterion.evaluate(resume, jd);
            scores.put(criterion.getKey(), cs);
            weightedSum += cs.getScore() * cs.getWeight();
            totalWeight += cs.getWeight();
        }

        int overallScore = totalWeight > 0
            ? (int) Math.round(weightedSum / totalWeight)
            : 50;
        overallScore = Math.max(0, Math.min(100, overallScore));

        // Keyword set diff
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        String lowerResume = resume.getNormalizedContent().toLowerCase(Locale.ROOT);
        Set<String> resumeTokens = resume.getTokenFrequencies().keySet();
        for (String kw : jd.getRequiredKeywords()) {
            if (resumeTokens.contains(kw) || lowerResume.contains(kw)) {
                matched.add(kw);
            } else {
                missing.add(kw);
            }
        }

        // Prioritize fixes using Java PriorityQueue
        PriorityQueue<FixRecommendation> fixQueue = buildFixQueue(scores, missing, resume);
        List<FixRecommendation> orderedFixes = new ArrayList<>();
        while (!fixQueue.isEmpty()) {
            orderedFixes.add(fixQueue.poll());
        }

        AnalysisReport report = new AnalysisReport();
        report.setFileName(resume.getFileName());
        report.setTargetRole(jd.getTargetTitle());
        report.setEngineMode(engineMode != null ? engineMode : EngineMode.DETERMINISTIC_LOCAL);
        report.setOverallScore(overallScore);
        report.setScoreLabel(labelForScore(overallScore));
        report.setCategoryScores(scores);
        report.setMatchedKeywords(matched);
        report.setMissingKeywords(missing);
        report.setPrioritizedFixes(orderedFixes);
        report.setPiiItemsMasked(redaction.totalMaskedCount());
        report.setRetentionPolicy(effectivePolicy);
        report.setExpiresAt(resume.getExpiresAt());

        long elapsedMs = Math.max(1L, (System.nanoTime() - startNanos) / 1_000_000L);
        report.setAnalysisTimeMs(elapsedMs);
        report.setSummaryJson(buildSummaryJson(report));

        return new AnalysisBundle(resume, jd, report, redaction.categoryCounts());
    }

    private PriorityQueue<FixRecommendation> buildFixQueue(
            Map<String, CategoryScore> scores,
            List<String> missingKeywords,
            ResumeDocument resume) {
        PriorityQueue<FixRecommendation> queue = new PriorityQueue<>();

        CategoryScore impact = scores.get("quantifiableImpact");
        if (impact != null && impact.getScore() < 75) {
            queue.add(new FixRecommendation(
                "Quantify experience outcomes with Google XYZ metrics",
                "Experience",
                impact.getFeedback(),
                "Add measurable percentages, throughput, latency, or cost impact to at least 70% of bullets.",
                FixRecommendation.Priority.HIGH
            ));
        }

        CategoryScore keywords = scores.get("keywordMatch");
        if (keywords != null && keywords.getScore() < 75 && !missingKeywords.isEmpty()) {
            String topMissing = String.join(", ", missingKeywords.subList(0, Math.min(5, missingKeywords.size())));
            queue.add(new FixRecommendation(
                "Close critical job-description keyword gaps",
                "Skills & Experience",
                "Missing target role terminology: " + topMissing,
                "Integrate authentic project usage of these technologies into your Skills and Experience bullets.",
                FixRecommendation.Priority.HIGH
            ));
        }

        CategoryScore parsability = scores.get("atsParsability");
        if (parsability != null && parsability.getScore() < 75) {
            queue.add(new FixRecommendation(
                "Standardize ATS section headings and date formats",
                "Structure",
                parsability.getFeedback(),
                "Use standard headings (Summary, Experience, Skills, Education) and consistent YYYY–YYYY date ranges.",
                FixRecommendation.Priority.HIGH
            ));
        }

        CategoryScore verbs = scores.get("actionVerbs");
        if (verbs != null && verbs.getScore() < 75) {
            queue.add(new FixRecommendation(
                "Replace passive responsibility phrasing with action verbs",
                "Experience",
                verbs.getFeedback(),
                "Lead bullets with verbs like Architected, Engineered, Optimized, Automated, or Reduced.",
                FixRecommendation.Priority.MEDIUM
            ));
        }

        CategoryScore formatting = scores.get("formattingReadability");
        if (formatting != null && formatting.getScore() < 75) {
            queue.add(new FixRecommendation(
                "Improve bullet scannability and break up dense paragraphs",
                "Formatting",
                formatting.getFeedback(),
                "Keep bullets between 10 and 30 words and avoid single-line paragraphs exceeding 55 words.",
                FixRecommendation.Priority.MEDIUM
            ));
        }

        if (queue.isEmpty() && resume.getWordCount() > 0) {
            queue.add(new FixRecommendation(
                "Maintain tailored keyword alignment per role",
                "Summary",
                "Resume satisfies all core deterministic rubric baselines.",
                "Tailor the top 2 summary bullets for each specific company domain before applying.",
                FixRecommendation.Priority.LOW
            ));
        }

        return queue;
    }

    public static String labelForScore(int score) {
        if (score >= 85) return "Strong Alignment";
        if (score >= 70) return "Competitive";
        if (score >= 55) return "Developing";
        return "Needs Major Revision";
    }

    private static String buildSummaryJson(AnalysisReport report) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("overallScore", report.getOverallScore());
        summary.put("scoreLabel", report.getScoreLabel());
        summary.put("matchedKeywords", report.getMatchedKeywords());
        summary.put("missingKeywords", report.getMissingKeywords());
        summary.put("fixesCount", report.getPrioritizedFixes().size());
        summary.put("piiItemsMasked", report.getPiiItemsMasked());
        summary.put("disclaimer", report.getDisclaimer());
        return JsonSupport.gson().toJson(summary);
    }

    public List<ScoringCriterion> getCriteria() {
        return criteria;
    }

    public record AnalysisBundle(
        ResumeDocument resumeDocument,
        JobDescriptionDocument jobDescriptionDocument,
        AnalysisReport report,
        Map<String, Integer> piiBreakdown
    ) {}
}
