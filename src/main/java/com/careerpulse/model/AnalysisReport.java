package com.careerpulse.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Full ATS analysis report produced by the deterministic scoring engine (and optional AI enricher)
 * and persisted through JDBC DAO.
 */
public class AnalysisReport {
    public static final String VALIDATION_DISCLAIMER =
        "Heuristic Notice: Scores reflect deterministic rubric alignment (parsability, metrics, "
        + "action verbs, keyword overlap, and formatting) validated against an internal labeled corpus. "
        + "They are decision-support indicators and do not guarantee hiring or recruiter outcomes.";

    private Long id;
    private Long resumeId;
    private long ownerUserId;
    private String fileName;
    private String targetRole;
    private EngineMode engineMode;
    private int overallScore;
    private String scoreLabel;
    private Map<String, CategoryScore> categoryScores = new LinkedHashMap<>();
    private List<String> matchedKeywords = new ArrayList<>();
    private List<String> missingKeywords = new ArrayList<>();
    private List<FixRecommendation> prioritizedFixes = new ArrayList<>();
    private int piiItemsMasked;
    private RetentionPolicy retentionPolicy = RetentionPolicy.HOURS_24;
    private Instant expiresAt;
    private long analysisTimeMs;
    private String aiEnrichmentSummary;
    private String summaryJson;
    private Instant createdAt = Instant.now();

    public String getDisclaimer() {
        return VALIDATION_DISCLAIMER;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getResumeId() {
        return resumeId;
    }

    public void setResumeId(Long resumeId) {
        this.resumeId = resumeId;
    }

    public long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(long ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public EngineMode getEngineMode() {
        return engineMode;
    }

    public void setEngineMode(EngineMode engineMode) {
        this.engineMode = engineMode;
    }

    public int getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(int overallScore) {
        this.overallScore = overallScore;
    }

    public String getScoreLabel() {
        return scoreLabel;
    }

    public void setScoreLabel(String scoreLabel) {
        this.scoreLabel = scoreLabel;
    }

    public Map<String, CategoryScore> getCategoryScores() {
        return categoryScores;
    }

    public void setCategoryScores(Map<String, CategoryScore> categoryScores) {
        this.categoryScores = categoryScores;
    }

    public List<String> getMatchedKeywords() {
        return matchedKeywords;
    }

    public void setMatchedKeywords(List<String> matchedKeywords) {
        this.matchedKeywords = matchedKeywords;
    }

    public List<String> getMissingKeywords() {
        return missingKeywords;
    }

    public void setMissingKeywords(List<String> missingKeywords) {
        this.missingKeywords = missingKeywords;
    }

    public List<FixRecommendation> getPrioritizedFixes() {
        return prioritizedFixes;
    }

    public void setPrioritizedFixes(List<FixRecommendation> prioritizedFixes) {
        this.prioritizedFixes = prioritizedFixes;
    }

    public int getPiiItemsMasked() {
        return piiItemsMasked;
    }

    public void setPiiItemsMasked(int piiItemsMasked) {
        this.piiItemsMasked = piiItemsMasked;
    }

    public RetentionPolicy getRetentionPolicy() {
        return retentionPolicy;
    }

    public void setRetentionPolicy(RetentionPolicy retentionPolicy) {
        this.retentionPolicy = retentionPolicy;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public long getAnalysisTimeMs() {
        return analysisTimeMs;
    }

    public void setAnalysisTimeMs(long analysisTimeMs) {
        this.analysisTimeMs = analysisTimeMs;
    }

    public String getAiEnrichmentSummary() {
        return aiEnrichmentSummary;
    }

    public void setAiEnrichmentSummary(String aiEnrichmentSummary) {
        this.aiEnrichmentSummary = aiEnrichmentSummary;
    }

    public String getSummaryJson() {
        return summaryJson;
    }

    public void setSummaryJson(String summaryJson) {
        this.summaryJson = summaryJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
