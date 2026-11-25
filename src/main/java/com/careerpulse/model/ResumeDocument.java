package com.careerpulse.model;

import com.careerpulse.exception.DocumentValidationException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Concrete subclass of {@link AbstractDocument} representing a candidate resume.
 * Automatically parses sections into a {@link Map} and extracts bullet statements into a {@link List}.
 */
public class ResumeDocument extends AbstractDocument {
    private static final Pattern BULLET_PATTERN = Pattern.compile("^([-*•▪◦]|\\d+[.)])\\s+.+");
    private static final List<String> KNOWN_SECTIONS = List.of(
        "summary", "objective", "profile", "experience", "work experience",
        "employment", "projects", "skills", "technical skills", "education",
        "certifications", "awards", "publications"
    );

    private long userId;
    private String fileName;
    private String detectedFormat;
    private int piiItemsMasked;
    private RetentionPolicy retentionPolicy;
    private Instant expiresAt;
    private final Map<String, List<String>> sections;
    private final List<String> bulletPoints;

    public ResumeDocument(String rawContent, String fileName, String detectedFormat)
            throws DocumentValidationException {
        super(rawContent);
        this.fileName = (fileName == null || fileName.isBlank()) ? "resume.txt" : fileName.trim();
        this.detectedFormat = (detectedFormat == null || detectedFormat.isBlank()) ? "Plain Text" : detectedFormat.trim();
        this.retentionPolicy = RetentionPolicy.HOURS_24;
        this.sections = Collections.unmodifiableMap(parseSections(getLines()));
        this.bulletPoints = Collections.unmodifiableList(extractBullets(getLines()));
    }

    private static Map<String, List<String>> parseSections(List<String> lines) {
        Map<String, List<String>> map = new LinkedHashMap<>();
        String activeSection = "header";
        map.put(activeSection, new ArrayList<>());

        for (String line : lines) {
            String normalizedHeading = line.toLowerCase(Locale.ROOT)
                .replaceAll("[:\\-_=|]+$", "")
                .trim();
            if (line.length() <= 45 && KNOWN_SECTIONS.contains(normalizedHeading)) {
                activeSection = canonicalSection(normalizedHeading);
                map.computeIfAbsent(activeSection, k -> new ArrayList<>());
            } else {
                map.computeIfAbsent(activeSection, k -> new ArrayList<>()).add(line);
            }
        }
        return map;
    }

    private static String canonicalSection(String heading) {
        if (heading.contains("experience") || heading.contains("employment")) return "experience";
        if (heading.contains("skill")) return "skills";
        if (heading.contains("education")) return "education";
        if (heading.contains("summary") || heading.contains("objective") || heading.contains("profile")) return "summary";
        if (heading.contains("project")) return "projects";
        if (heading.contains("certif")) return "certifications";
        return heading;
    }

    private static List<String> extractBullets(List<String> lines) {
        List<String> bullets = new ArrayList<>();
        for (String line : lines) {
            if (BULLET_PATTERN.matcher(line).matches()) {
                bullets.add(line.replaceFirst("^([-*•▪◦]|\\d+[.)])\\s+", "").trim());
            }
        }
        return bullets;
    }

    @Override
    public String getDocumentType() {
        return "RESUME";
    }

    public Map<String, List<String>> getSections() {
        return sections;
    }

    public List<String> getBulletPoints() {
        return bulletPoints;
    }

    public boolean hasSection(String canonicalName) {
        List<String> content = sections.get(canonicalName.toLowerCase(Locale.ROOT));
        return content != null && !content.isEmpty();
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getDetectedFormat() {
        return detectedFormat;
    }

    public void setDetectedFormat(String detectedFormat) {
        this.detectedFormat = detectedFormat;
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
}
