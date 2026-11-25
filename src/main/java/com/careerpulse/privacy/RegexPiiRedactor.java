package com.careerpulse.privacy;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic regex-based PII redactor masking emails, phone numbers, SSNs,
 * street addresses, and date-of-birth markers prior to database persistence or AI calls.
 */
public class RegexPiiRedactor implements PiiRedactor {
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b"
    );
    private static final Pattern SSN_PATTERN = Pattern.compile(
        "\\b\\d{3}-\\d{2}-\\d{4}\\b"
    );
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "(?:\\+?\\d{1,3}[\\s.-]?)?(?:\\(\\d{3}\\)|\\d{3})[\\s.-]\\d{3}[\\s.-]\\d{4}\\b"
    );
    private static final Pattern STREET_ADDRESS_PATTERN = Pattern.compile(
        "\\b\\d{1,5}\\s+[A-Z][a-zA-Z0-9.\\s]{1,30}\\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way)\\b",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern DOB_PATTERN = Pattern.compile(
        "(?i)\\b(?:DOB|Date of Birth)\\s*[:\\-]?\\s*(?:\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|[A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{4})"
    );

    @Override
    public RedactionResult redact(String input) {
        if (input == null || input.isEmpty()) {
            return new RedactionResult("", 0, Collections.emptyMap());
        }

        Map<String, Integer> counts = new LinkedHashMap<>();
        String working = input;

        working = replacePattern(working, SSN_PATTERN, "[REDACTED_SSN]", "ssn", counts);
        working = replacePattern(working, EMAIL_PATTERN, "[REDACTED_EMAIL]", "email", counts);
        working = replacePattern(working, PHONE_PATTERN, "[REDACTED_PHONE]", "phone", counts);
        working = replacePattern(working, STREET_ADDRESS_PATTERN, "[REDACTED_ADDRESS]", "address", counts);
        working = replacePattern(working, DOB_PATTERN, "[REDACTED_DOB]", "dob", counts);

        int total = counts.values().stream().mapToInt(Integer::intValue).sum();
        return new RedactionResult(working, total, Collections.unmodifiableMap(counts));
    }

    private String replacePattern(
            String text,
            Pattern pattern,
            String replacement,
            String key,
            Map<String, Integer> counts) {
        Matcher matcher = pattern.matcher(text);
        int matched = 0;
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            matched++;
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        if (matched > 0) {
            counts.put(key, matched);
        }
        return sb.toString();
    }
}
