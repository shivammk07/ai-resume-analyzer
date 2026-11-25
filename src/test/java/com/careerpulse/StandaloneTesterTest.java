package com.careerpulse;

import com.careerpulse.cli.CareerPulseStandaloneTester;
import com.careerpulse.engine.BenchmarkValidator;
import com.careerpulse.engine.ResumeAnalyzerService;
import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import com.careerpulse.model.EngineMode;
import com.careerpulse.model.RetentionPolicy;
import com.careerpulse.util.JsonSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Automated JUnit 5 verification for the zero-API-key standalone CLI tester
 * and Java 17-safe {@link JsonSupport} {@code Instant} serialization.
 *
 * @author Shivam Kumar (Team Moshdi)
 */
class StandaloneTesterTest {

    @Test
    void standaloneSelfTestShouldPassCompletelyOffline() {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        PrintStream out = new PrintStream(buffer, true, StandardCharsets.UTF_8);

        CareerPulseStandaloneTester tester = new CareerPulseStandaloneTester();
        int exitCode = tester.run(new String[]{"--self-test"}, out);

        String output = buffer.toString(StandardCharsets.UTF_8);
        assertEquals(0, exitCode, "Standalone self-test must pass with exit code 0:\n" + output);
        assertTrue(output.contains("ALL CHECKS PASSED"));
        assertTrue(output.contains("[1/4] PII Redaction Engine      : PASS"));
        assertTrue(output.contains("[2/4] Deterministic ATS Engine  : PASS"));
        assertTrue(output.contains("[3/4] JDBC DAO + Owner + TTL    : PASS"));
        assertTrue(output.contains("[4/4] 12-Resume Benchmark Suite : PASS"));
    }

    @Test
    void standaloneFileModeShouldAuditLocalResumeFile(@TempDir Path tempDir) throws Exception {
        Path resumeFile = tempDir.resolve("candidate.txt");
        Files.writeString(resumeFile, """
            Jordan Reed
            jordan.reed@example.com | (512) 555-0190
            SUMMARY
            Java 17 developer experienced with JDBC, Servlets, and MySQL.
            EXPERIENCE
            Backend Engineer | CloudTech | 2021 - Present
            - Engineered Jakarta EE 10 Servlets handling 18,000 requests/sec with 99.95% uptime.
            - Reduced SQL query latency by 45% using indexed PreparedStatements.
            SKILLS
            Java 17, JDBC, Jakarta Servlets, MySQL, Maven, JUnit, REST API
            EDUCATION
            B.S. in Computer Science (2017 - 2021)
            """, StandardCharsets.UTF_8);

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        PrintStream out = new PrintStream(buffer, true, StandardCharsets.UTF_8);

        CareerPulseStandaloneTester tester = new CareerPulseStandaloneTester();
        int exitCode = tester.run(
            new String[]{"--file", resumeFile.toString(), "--role", "Java Backend Engineer"},
            out
        );

        String output = buffer.toString(StandardCharsets.UTF_8);
        assertEquals(0, exitCode, "Single-file audit should succeed:\n" + output);
        assertTrue(output.contains("CareerPulse ATS Audit Report"));
        assertTrue(output.contains("Overall Score"));
        assertTrue(output.contains("PII Masked    : 2 items"));
    }

    @Test
    void jsonSupportShouldSerializeAnalysisReportAndBenchmarkSummaryWithInstantsOnJava17() throws Exception {
        ResumeAnalyzerService analyzer = new ResumeAnalyzerService();
        ResumeAnalyzerService.AnalysisBundle bundle = analyzer.analyze(
            "SUMMARY\nJava 17 developer\nEXPERIENCE\n- Built JDBC APIs serving 12,000 users with 99.9% uptime.\nSKILLS\nJava, JDBC, MySQL",
            "json_test.txt", "Plain Text", "Java Engineer", "Java, JDBC, MySQL",
            "Mid", true, RetentionPolicy.HOURS_24, EngineMode.DETERMINISTIC_LOCAL
        );

        AnalysisReport report = bundle.report();
        String reportJson = JsonSupport.gson().toJson(report);
        assertTrue(reportJson.contains("overallScore"));
        assertTrue(reportJson.contains("createdAt"));
        assertTrue(reportJson.contains("expiresAt"));

        BenchmarkSummary summary = new BenchmarkValidator(analyzer).runValidationSuite();
        String summaryJson = JsonSupport.gson().toJson(summary);
        assertTrue(summaryJson.contains("meanAbsoluteError"));
        assertTrue(summaryJson.contains("runTimestamp"));
    }
}
