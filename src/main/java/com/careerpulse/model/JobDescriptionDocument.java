package com.careerpulse.model;

import com.careerpulse.exception.DocumentValidationException;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Concrete subclass of {@link AbstractDocument} representing a target job description.
 * Extracts deduplicated required keywords into a {@link Set} for ATS keyword alignment.
 */
public class JobDescriptionDocument extends AbstractDocument {
    private static final Set<String> DOMAIN_SKILL_LEXICON = Set.of(
        "java", "jdbc", "servlet", "servlets", "jsp", "jakarta", "spring", "springboot", "maven",
        "mysql", "postgresql", "sql", "h2", "hibernate", "jpa", "rest", "api", "microservices",
        "docker", "kubernetes", "aws", "gcp", "azure", "linux", "git", "ci/cd", "junit", "testing",
        "python", "typescript", "javascript", "react", "node", "kafka", "redis", "graphql",
        "agile", "scrum", "security", "oauth", "encryption", "architecture", "distributed",
        "analytics", "tableau", "etl", "spark", "terraform", "prometheus", "grafana", "devops"
    );

    private final String targetTitle;
    private final String seniorityLevel;
    private final Set<String> requiredKeywords;

    public JobDescriptionDocument(String targetTitle, String rawDescription, String seniorityLevel)
            throws DocumentValidationException {
        super((rawDescription == null || rawDescription.isBlank())
            ? (targetTitle == null || targetTitle.isBlank() ? "Software Engineer Java SQL REST API" : targetTitle)
            : rawDescription);
        this.targetTitle = (targetTitle == null || targetTitle.isBlank()) ? "Software Engineer" : targetTitle.trim();
        this.seniorityLevel = (seniorityLevel == null || seniorityLevel.isBlank()) ? "Mid" : seniorityLevel.trim();
        this.requiredKeywords = Collections.unmodifiableSet(extractRequiredKeywords());
    }

    private Set<String> extractRequiredKeywords() {
        Set<String> keywords = new LinkedHashSet<>();
        String combinedLower = (targetTitle + " " + getNormalizedContent()).toLowerCase(Locale.ROOT);
        for (String skill : DOMAIN_SKILL_LEXICON) {
            if (combinedLower.contains(skill)) {
                keywords.add(skill);
            }
        }
        // Supplement with top frequent domain tokens from the job description
        getTokenFrequencies().entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .map(Map.Entry::getKey)
            .filter(tok -> tok.length() >= 3)
            .limit(12)
            .collect(Collectors.toCollection(() -> keywords));
        return keywords;
    }

    @Override
    public String getDocumentType() {
        return "JOB_DESCRIPTION";
    }

    public String getTargetTitle() {
        return targetTitle;
    }

    public String getSeniorityLevel() {
        return seniorityLevel;
    }

    public Set<String> getRequiredKeywords() {
        return requiredKeywords;
    }
}
