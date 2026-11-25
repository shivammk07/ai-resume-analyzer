package com.careerpulse;

import com.careerpulse.engine.ResumeAnalyzerService;
import com.careerpulse.exception.DocumentValidationException;
import com.careerpulse.model.EngineMode;
import com.careerpulse.model.RetentionPolicy;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies deterministic offline scoring without any external Gemini API key.
 */
class DeterministicScoringEngineTest {

    private final ResumeAnalyzerService service = new ResumeAnalyzerService();

    @Test
    void shouldProduceReproducibleScoresAndRankStrongAboveWeakOffline() throws DocumentValidationException {
        String jd = "Required: Java, JDBC, Servlets, JSP, MySQL, Maven, JUnit, REST API, Docker, SQL.";

        String strongResume = """
            Priya Nair
            priya@example.com | 415-555-0192 | linkedin.com/in/priya

            SUMMARY
            Senior Java Backend Engineer specializing in Jakarta Servlets, JDBC, MySQL, and REST APIs.

            EXPERIENCE
            Senior Java Engineer | FinCore | 2021 - Present
            - Architected Jakarta EE Servlet and JDBC DAO services on MySQL handling 40,000 requests per second.
            - Optimized SQL queries and Maven CI pipelines with JUnit 5, reducing latency by 45% ($500k saved).
            - Engineered Dockerized REST API microservices serving 1.2M users with 99.98% uptime.

            SKILLS
            Java, JDBC, Servlets, JSP, MySQL, Maven, JUnit, REST API, Docker, SQL

            EDUCATION
            B.S. in Computer Science (2015 - 2019)
            """;

        String weakResume = """
            John Smith
            Responsible for helping with office computer work and worked on some tasks in school.
            Duties included answering emails and assisted in basic reports.
            """;

        ResumeAnalyzerService.AnalysisBundle strongRun1 = service.analyze(
            strongResume, "strong.txt", "Plain Text", "Senior Java Engineer", jd,
            "Senior", true, RetentionPolicy.EPHEMERAL, EngineMode.DETERMINISTIC_LOCAL
        );
        ResumeAnalyzerService.AnalysisBundle strongRun2 = service.analyze(
            strongResume, "strong.txt", "Plain Text", "Senior Java Engineer", jd,
            "Senior", true, RetentionPolicy.EPHEMERAL, EngineMode.DETERMINISTIC_LOCAL
        );
        ResumeAnalyzerService.AnalysisBundle weakRun = service.analyze(
            weakResume, "weak.txt", "Plain Text", "Senior Java Engineer", jd,
            "Senior", true, RetentionPolicy.EPHEMERAL, EngineMode.DETERMINISTIC_LOCAL
        );

        assertEquals(strongRun1.report().getOverallScore(), strongRun2.report().getOverallScore(),
            "Deterministic scoring must produce identical scores across runs");
        assertTrue(strongRun1.report().getOverallScore() >= 84,
            "Strong resume should score >= 84, got " + strongRun1.report().getOverallScore());
        assertTrue(weakRun.report().getOverallScore() <= 45,
            "Weak resume should score <= 45, got " + weakRun.report().getOverallScore());
        assertEquals(2, strongRun1.report().getPiiItemsMasked(), "Email and phone should be masked");
        assertTrue(strongRun1.report().getDisclaimer().contains("do not guarantee hiring"));
    }
}
