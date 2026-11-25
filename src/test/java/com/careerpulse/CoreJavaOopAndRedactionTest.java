package com.careerpulse;

import com.careerpulse.exception.DocumentValidationException;
import com.careerpulse.model.AbstractDocument;
import com.careerpulse.model.Analyzable;
import com.careerpulse.model.FixRecommendation;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;
import com.careerpulse.privacy.PasswordHasher;
import com.careerpulse.privacy.PiiRedactor;
import com.careerpulse.privacy.RegexPiiRedactor;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.PriorityQueue;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies Core Java OOP hierarchy (interfaces, abstract class, inheritance, polymorphism),
 * Java Collections (Map, Set, List, PriorityQueue), custom exceptions, PII redaction, and PBKDF2 hashing.
 */
class CoreJavaOopAndRedactionTest {

    @Test
    void shouldDemonstratePolymorphismAcrossDocumentHierarchy() throws DocumentValidationException {
        AbstractDocument resume = new ResumeDocument(
            "SUMMARY\nSenior Java Developer\nEXPERIENCE\n- Built JDBC DAOs serving 10,000 users.",
            "resume.txt",
            "Plain Text"
        );
        AbstractDocument jd = new JobDescriptionDocument(
            "Java Engineer",
            "Required: Java, JDBC, Servlets, MySQL, Maven, JUnit",
            "Senior"
        );

        List<Analyzable> documents = List.of(resume, jd);
        assertEquals(2, documents.size());
        assertEquals("RESUME", resume.getDocumentType());
        assertEquals("JOB_DESCRIPTION", jd.getDocumentType());
        assertTrue(resume.getTokenFrequencies().containsKey("java"));
        assertTrue(((JobDescriptionDocument) jd).getRequiredKeywords().contains("jdbc"));
        assertEquals(1, ((ResumeDocument) resume).getBulletPoints().size());
    }

    @Test
    void shouldThrowCheckedExceptionForEmptyDocuments() {
        assertThrows(DocumentValidationException.class,
            () -> new ResumeDocument("   ", "empty.txt", "Plain Text"));
    }

    @Test
    void shouldOrderFixesByPriorityUsingPriorityQueue() {
        PriorityQueue<FixRecommendation> pq = new PriorityQueue<>();
        pq.add(new FixRecommendation("Polish summary", "Summary", "Minor", "Adjust", FixRecommendation.Priority.LOW));
        pq.add(new FixRecommendation("Add metrics", "Experience", "Missing XYZ", "Quantify", FixRecommendation.Priority.HIGH));
        pq.add(new FixRecommendation("Use active verbs", "Experience", "Passive", "Rewrite", FixRecommendation.Priority.MEDIUM));

        assertEquals(FixRecommendation.Priority.HIGH, pq.poll().getPriority());
        assertEquals(FixRecommendation.Priority.MEDIUM, pq.poll().getPriority());
        assertEquals(FixRecommendation.Priority.LOW, pq.poll().getPriority());
    }

    @Test
    void shouldRedactAllPersonalIdentifiableInformationPatterns() {
        PiiRedactor redactor = new RegexPiiRedactor();
        String input = """
            Jane Doe
            Email: jane.doe@example.org | Phone: (415) 555-0199
            Address: 742 Evergreen Terrace Street
            SSN: 123-45-6789 | DOB: 04/12/1996
            EXPERIENCE
            - Built Java 17 JDBC services reducing latency by 35%.
            """;

        PiiRedactor.RedactionResult result = redactor.redact(input);
        assertFalse(result.redactedText().contains("jane.doe@example.org"));
        assertFalse(result.redactedText().contains("415) 555-0199"));
        assertFalse(result.redactedText().contains("123-45-6789"));
        assertFalse(result.redactedText().contains("742 Evergreen Terrace Street"));
        assertTrue(result.redactedText().contains("[REDACTED_EMAIL]"));
        assertTrue(result.redactedText().contains("[REDACTED_PHONE]"));
        assertTrue(result.redactedText().contains("[REDACTED_SSN]"));
        assertTrue(result.redactedText().contains("[REDACTED_ADDRESS]"));
        assertTrue(result.redactedText().contains("[REDACTED_DOB]"));
        assertEquals(5, result.totalMaskedCount());
        // Preserve technical metrics intact
        assertTrue(result.redactedText().contains("35%"));
    }

    @Test
    void shouldHashAndVerifyPasswordsWithSaltedPbkdf2() {
        String h1 = PasswordHasher.hash("StrongPass!2026");
        String h2 = PasswordHasher.hash("StrongPass!2026");
        assertNotEquals(h1, h2, "Salted hashes must be unique");
        assertTrue(PasswordHasher.verify("StrongPass!2026", h1));
        assertFalse(PasswordHasher.verify("WrongPassword", h1));
    }
}
