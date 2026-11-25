package com.careerpulse.model;

import com.careerpulse.exception.DocumentValidationException;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Abstract base class providing shared text normalization, line extraction, and
 * frequency-map tokenization via Java Collections for subclasses such as
 * {@link ResumeDocument} and {@link JobDescriptionDocument}.
 */
public abstract class AbstractDocument implements Analyzable {
    private static final Pattern TOKEN_PATTERN = Pattern.compile("[a-zA-Z0-9+#.-]{2,}");
    protected static final Set<String> STOP_WORDS = Set.of(
        "and", "the", "for", "with", "that", "this", "from", "have", "has", "was", "were",
        "are", "our", "your", "you", "will", "can", "into", "using", "used", "across", "within",
        "through", "over", "under", "about", "more", "than", "their", "they", "them", "been",
        "being", "also", "such", "other", "including", "strong", "experience", "years", "work",
        "role", "team", "skills", "ability", "preferred", "required", "knowledge", "working"
    );

    private Long id;
    private final String rawContent;
    private final String normalizedContent;
    private final List<String> lines;
    private final Map<String, Integer> tokenFrequencies;
    private final int wordCount;
    private Instant createdAt;

    protected AbstractDocument(String rawContent) throws DocumentValidationException {
        if (rawContent == null || rawContent.trim().isEmpty()) {
            throw new DocumentValidationException("Document content must not be null or empty.");
        }
        this.rawContent = rawContent.trim();
        this.normalizedContent = normalizeWhitespace(this.rawContent);
        this.lines = Collections.unmodifiableList(
            Arrays.stream(this.rawContent.split("\\r?\\n"))
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .collect(Collectors.toList())
        );
        this.tokenFrequencies = Collections.unmodifiableMap(computeTokenFrequencies(this.normalizedContent));
        this.wordCount = this.normalizedContent.isEmpty()
            ? 0
            : this.normalizedContent.split("\\s+").length;
        this.createdAt = Instant.now();
    }

    private static String normalizeWhitespace(String input) {
        return input.replaceAll("[ \\t\\x0B\\f]+", " ")
            .replaceAll("\\r?\\n+", "\n")
            .trim();
    }

    private static Map<String, Integer> computeTokenFrequencies(String text) {
        Map<String, Integer> freq = new LinkedHashMap<>();
        Matcher matcher = TOKEN_PATTERN.matcher(text.toLowerCase(Locale.ROOT));
        while (matcher.find()) {
            String token = matcher.group().replaceAll("^\\.+|\\.+$", "");
            if (token.length() < 2 || STOP_WORDS.contains(token)) {
                continue;
            }
            freq.merge(token, 1, Integer::sum);
        }
        return freq;
    }

    public abstract String getDocumentType();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String getRawContent() {
        return rawContent;
    }

    @Override
    public String getNormalizedContent() {
        return normalizedContent;
    }

    @Override
    public int getWordCount() {
        return wordCount;
    }

    @Override
    public List<String> getLines() {
        return lines;
    }

    @Override
    public Map<String, Integer> getTokenFrequencies() {
        return tokenFrequencies;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AbstractDocument that)) return false;
        return Objects.equals(id, that.id) && Objects.equals(normalizedContent, that.normalizedContent);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, normalizedContent);
    }
}
