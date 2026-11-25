package com.careerpulse.cli;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.dao.JdbcAnalysisReportDao;
import com.careerpulse.dao.JdbcAuditLogDao;
import com.careerpulse.dao.JdbcBenchmarkDao;
import com.careerpulse.dao.JdbcUserDao;
import com.careerpulse.engine.BenchmarkValidator;
import com.careerpulse.engine.ResumeAnalyzerService;
import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.exception.DocumentValidationException;
import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.AuditLogEntry;
import com.careerpulse.model.BenchmarkModels.BenchmarkResult;
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.EngineMode;
import com.careerpulse.model.FixRecommendation;
import com.careerpulse.model.RetentionPolicy;
import com.careerpulse.model.User;
import com.careerpulse.privacy.PasswordHasher;
import com.careerpulse.privacy.PiiRedactor;
import com.careerpulse.privacy.RegexPiiRedactor;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

/**
 * Zero-API-key standalone offline Java CLI tester for CareerPulse.
 *
 * <p>Allows evaluators and developers to verify the entire Core Java OOP scoring
 * engine, regex PII redaction, JDBC DAO persistence (with H2 MySQL-mode fallback),
 * retention TTL cleanup, and the 12-resume labeled validation benchmark directly
 * from the terminal with zero external API keys or servers.</p>
 *
 * <p>Supported invocation modes:</p>
 * <ul>
 *   <li>{@code --self-test} (default when no flags are provided): executes the full
 *       offline diagnostic suite and exits with code {@code 0} on pass.</li>
 *   <li>{@code --file <path> [--role "<title>"] [--jd <path>] [--no-redact]}:
 *       audits a custom local plain-text or Markdown resume file offline.</li>
 *   <li>{@code --interactive}: guided terminal session for ad-hoc resume input.</li>
 *   <li>{@code --help}: prints usage documentation.</li>
 * </ul>
 *
 * @author Shivam Kumar (Team Moshdi)
 */
public class CareerPulseStandaloneTester {
    private static final String SAMPLE_JOB_DESCRIPTION =
        "Required: Java 17, JDBC, Jakarta Servlets, JSP, MySQL, Maven, JUnit, REST API, Docker, SQL.";

    private static final String SAMPLE_WEAK_RESUME = """
        Sam Patel
        sam.patel@example.com | (415) 555-0199 | SSN: 123-45-6789
        I am looking for a software job. I worked on coding assignments in college and
        helped with a website for a local shop. Duties included updating pages and talking
        to clients. Responsible for basic reports and assisting managers.
        """;

    private static final String SAMPLE_STRONG_RESUME = """
        Priya Nair
        priya.nair@example.com | (415) 555-0192 | SSN: 987-65-4321 | 742 Evergreen Terrace Street

        SUMMARY
        Senior Java Backend Engineer with 8 years building JDBC persistence layers, Jakarta Servlets,
        and high-throughput REST APIs on MySQL.

        EXPERIENCE
        Senior Java Engineer | FinCore Systems | 2021 - Present
        - Architected Jakarta EE 10 Servlets and JDBC DAO layers on MySQL handling 42,000 requests/sec with 99.98% uptime.
        - Optimized parameterized SQL queries and indexing, reducing p95 latency by 48% ($1.4M annual savings).
        - Automated Maven CI/CD pipelines and 320 JUnit 5 tests, cutting regression defects by 63% across 4 teams.
        - Engineered Dockerized REST API services serving 1.8M monthly active users.

        SKILLS
        Java 17, JDBC, Jakarta Servlets, JSP, MySQL, Maven, JUnit, REST API, Docker, SQL, Git

        EDUCATION
        B.S. in Computer Science, State University (2013 - 2017)
        """;

    /**
     * Standalone CLI entry point. Exits with {@code 0} on success or {@code 1} on failure.
     *
     * @param args command-line options
     */
    public static void main(String[] args) {
        CareerPulseStandaloneTester tester = new CareerPulseStandaloneTester();
        int exitCode = tester.run(args, System.out);
        if (exitCode != 0) {
            System.exit(exitCode);
        }
    }

    /**
     * Executes the requested CLI mode against the provided output stream.
     *
     * @param args command-line flags
     * @param out destination print stream
     * @return {@code 0} if all checks succeed; {@code 1} otherwise
     */
    public int run(String[] args, PrintStream out) {
        try {
            if (args == null || args.length == 0) {
                return runSelfTest(out);
            }

            for (String arg : args) {
                if ("--help".equals(arg) || "-h".equals(arg)) {
                    printUsage(out);
                    return 0;
                }
                if ("--self-test".equals(arg)) {
                    return runSelfTest(out);
                }
                if ("--interactive".equals(arg)) {
                    return runInteractive(out);
                }
            }

            String resumePath = null;
            String targetRole = "Java Backend Engineer";
            String jdPath = null;
            boolean redactPii = true;

            for (int i = 0; i < args.length; i++) {
                switch (args[i]) {
                    case "--file" -> {
                        if (i + 1 < args.length) {
                            resumePath = args[++i];
                        }
                    }
                    case "--role" -> {
                        if (i + 1 < args.length) {
                            targetRole = args[++i];
                        }
                    }
                    case "--jd" -> {
                        if (i + 1 < args.length) {
                            jdPath = args[++i];
                        }
                    }
                    case "--no-redact" -> redactPii = false;
                    default -> {
                        out.println("Unknown option: " + args[i]);
                        printUsage(out);
                        return 1;
                    }
                }
            }

            if (resumePath == null || resumePath.isBlank()) {
                out.println("Missing required --file <path> argument.");
                printUsage(out);
                return 1;
            }

            return runSingleFileAudit(Path.of(resumePath), targetRole, jdPath != null ? Path.of(jdPath) : null, redactPii, out);
        } catch (Exception ex) {
            out.println("[FAIL] Standalone tester error: " + ex.getMessage());
            return 1;
        }
    }

    /**
     * Runs the complete offline end-to-end verification suite with zero API keys.
     *
     * @param out destination stream
     * @return {@code 0} when every verification gate passes; {@code 1} otherwise
     * @throws DocumentValidationException if sample inputs fail validation
     * @throws DatabaseOperationException if embedded H2 JDBC verification fails
     */
    public int runSelfTest(PrintStream out) throws DocumentValidationException, DatabaseOperationException {
        out.println("==========================================================================");
        out.println(" CareerPulse Standalone Offline Java 17 Tester (Zero External API Keys)");
        out.println("==========================================================================");

        boolean allPassed = true;
        ResumeAnalyzerService analyzer = new ResumeAnalyzerService();

        // 1. PII Redaction Verification
        PiiRedactor redactor = new RegexPiiRedactor();
        PiiRedactor.RedactionResult piiResult = redactor.redact(SAMPLE_STRONG_RESUME);
        boolean piiOk = piiResult.totalMaskedCount() >= 4
            && !piiResult.redactedText().contains("priya.nair@example.com")
            && !piiResult.redactedText().contains("987-65-4321");
        out.printf("[1/4] PII Redaction Engine      : %s (Masked %d sensitive tokens)%n",
            piiOk ? "PASS" : "FAIL", piiResult.totalMaskedCount());
        allPassed &= piiOk;

        // 2. Deterministic ATS Engine Comparison (Weak vs. Strong)
        ResumeAnalyzerService.AnalysisBundle weak = analyzer.analyze(
            SAMPLE_WEAK_RESUME, "sample_weak.txt", "CLI Text",
            "Senior Java Backend Engineer", SAMPLE_JOB_DESCRIPTION,
            "Senior", true, RetentionPolicy.EPHEMERAL, EngineMode.DETERMINISTIC_LOCAL
        );
        ResumeAnalyzerService.AnalysisBundle strong = analyzer.analyze(
            SAMPLE_STRONG_RESUME, "sample_strong.txt", "CLI Text",
            "Senior Java Backend Engineer", SAMPLE_JOB_DESCRIPTION,
            "Senior", true, RetentionPolicy.HOURS_24, EngineMode.DETERMINISTIC_LOCAL
        );
        int weakScore = weak.report().getOverallScore();
        int strongScore = strong.report().getOverallScore();
        boolean scoringOk = strongScore >= 82 && weakScore <= 45 && strongScore > weakScore + 35;
        out.printf("[2/4] Deterministic ATS Engine  : %s (Weak=%d/100 -> Strong=%d/100, Delta=+%d pts)%n",
            scoringOk ? "PASS" : "FAIL", weakScore, strongScore, strongScore - weakScore);
        allPassed &= scoringOk;

        // 3. JDBC DAO Transactional Persistence, Ownership & TTL Expiry Verification
        String dbName = "cli_selftest_" + UUID.randomUUID().toString().replace("-", "");
        DatabaseConnectionManager dbMgr = DatabaseConnectionManager.createInMemoryTestManager(dbName);
        JdbcUserDao userDao = new JdbcUserDao(dbMgr);
        JdbcAnalysisReportDao reportDao = new JdbcAnalysisReportDao(dbMgr);
        JdbcBenchmarkDao benchmarkDao = new JdbcBenchmarkDao(dbMgr);
        JdbcAuditLogDao auditLogDao = new JdbcAuditLogDao(dbMgr);

        User owner = userDao.save(new User(
            null, "cli.owner@local.test", "CLI Owner",
            PasswordHasher.hash("OfflinePass!17"), User.Role.CANDIDATE, Instant.now()
        ));
        User intruder = userDao.save(new User(
            null, "cli.other@local.test", "Other User",
            PasswordHasher.hash("OtherPass!17"), User.Role.CANDIDATE, Instant.now()
        ));

        strong.resumeDocument().setUserId(owner.getId());
        strong.report().setOwnerUserId(owner.getId());
        AnalysisReport saved = reportDao.saveResumeAndReportTransaction(strong.resumeDocument(), strong.report());
        boolean ownerSees = reportDao.findByIdAndUserId(saved.getId(), owner.getId()).isPresent();
        boolean intruderBlocked = reportDao.findByIdAndUserId(saved.getId(), intruder.getId()).isEmpty();
        int expiredPurged = reportDao.deleteExpiredResumes(Instant.now().plus(25, ChronoUnit.HOURS));
        auditLogDao.save(new AuditLogEntry(owner.getId(), "CLI_SELF_TEST", String.valueOf(saved.getId()), "Verified JDBC TX & TTL"));

        boolean jdbcOk = saved.getId() != null && ownerSees && intruderBlocked && expiredPurged == 1;
        out.printf("[3/4] JDBC DAO + Owner + TTL    : %s (Driver=%s, TX Saved=#%d, Expired Purged=%d)%n",
            jdbcOk ? "PASS" : "FAIL", dbMgr.getActiveDriver(), saved.getId(), expiredPurged);
        allPassed &= jdbcOk;

        // 4. 12-Resume Independently Annotated Validation Benchmark
        BenchmarkValidator validator = new BenchmarkValidator(analyzer);
        BenchmarkSummary summary = validator.runValidationSuite();
        benchmarkDao.save(summary);
        boolean benchmarkOk = summary.getDatasetSize() == 12
            && summary.getMeanAbsoluteError() <= 10.0
            && summary.getBandAccuracyPct() >= 75.0
            && summary.getSpearmanRho() >= 0.85;
        out.printf("[4/4] 12-Resume Benchmark Suite : %s (BandAcc=%.1f%%, MAE=%.2f, Spearman=%.3f, p50=%.2fms, p95=%.2fms)%n",
            benchmarkOk ? "PASS" : "FAIL",
            summary.getBandAccuracyPct(),
            summary.getMeanAbsoluteError(),
            summary.getSpearmanRho(),
            summary.getP50LatencyMs(),
            summary.getP95LatencyMs());
        allPassed &= benchmarkOk;

        out.println("--------------------------------------------------------------------------");
        out.println("Benchmark Breakdown:");
        for (BenchmarkResult row : summary.getResults()) {
            out.printf("  %-5s | %-11s | Expected=%2d [%2d-%3d] | Actual=%2d | Err=%2d | %s%n",
                row.id(), row.tier(), row.expectedScore(), row.minBand(), row.maxBand(),
                row.predictedScore(), row.absoluteError(), row.withinBand() ? "PASS" : "OUT");
        }
        out.println("==========================================================================");
        out.println("OVERALL STANDALONE RESULT: " + (allPassed ? "ALL CHECKS PASSED (0 API KEYS REQUIRED)" : "FAILED"));
        out.println("==========================================================================");

        return allPassed ? 0 : 1;
    }

    /**
     * Audits a single local resume text/Markdown file and prints the full diagnostic report.
     *
     * @param resumePath path to resume file
     * @param targetRole target job title
     * @param jdPath optional path to job description file
     * @param redactPii whether to apply PII redaction prior to scoring
     * @param out destination print stream
     * @return {@code 0} on success; {@code 1} if file cannot be read or validated
     * @throws IOException if file reading fails
     * @throws DocumentValidationException if resume text is invalid
     */
    public int runSingleFileAudit(
            Path resumePath,
            String targetRole,
            Path jdPath,
            boolean redactPii,
            PrintStream out) throws IOException, DocumentValidationException {
        if (!Files.exists(resumePath)) {
            out.println("[FAIL] Resume file not found: " + resumePath);
            return 1;
        }
        String resumeText = Files.readString(resumePath, StandardCharsets.UTF_8);
        String jdText = jdPath != null && Files.exists(jdPath)
            ? Files.readString(jdPath, StandardCharsets.UTF_8)
            : SAMPLE_JOB_DESCRIPTION;

        ResumeAnalyzerService analyzer = new ResumeAnalyzerService();
        ResumeAnalyzerService.AnalysisBundle bundle = analyzer.analyze(
            resumeText,
            resumePath.getFileName().toString(),
            "Local File",
            targetRole,
            jdText,
            "Senior",
            redactPii,
            RetentionPolicy.EPHEMERAL,
            EngineMode.DETERMINISTIC_LOCAL
        );

        printReport(bundle.report(), out);
        return 0;
    }

    private int runInteractive(PrintStream out) throws IOException, DocumentValidationException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        out.println("CareerPulse Interactive Standalone Tester (Offline · Zero API Key)");
        out.print("Target Role [Java Backend Engineer]: ");
        String role = reader.readLine();
        if (role == null || role.isBlank()) {
            role = "Java Backend Engineer";
        }

        out.print("Job Description Keywords (blank for default Java stack): ");
        String jd = reader.readLine();
        if (jd == null || jd.isBlank()) {
            jd = SAMPLE_JOB_DESCRIPTION;
        }

        out.println("Paste your resume text below. Type a single line 'END' when finished:");
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            if ("END".equalsIgnoreCase(line.trim())) {
                break;
            }
            sb.append(line).append('\n');
        }

        ResumeAnalyzerService analyzer = new ResumeAnalyzerService();
        ResumeAnalyzerService.AnalysisBundle bundle = analyzer.analyze(
            sb.toString(),
            "interactive_resume.txt",
            "CLI Interactive",
            role.trim(),
            jd.trim(),
            "Senior",
            true,
            RetentionPolicy.EPHEMERAL,
            EngineMode.DETERMINISTIC_LOCAL
        );
        printReport(bundle.report(), out);
        return 0;
    }

    private void printReport(AnalysisReport report, PrintStream out) {
        out.println("==========================================================================");
        out.printf(" CareerPulse ATS Audit Report — %s%n", report.getFileName());
        out.println("==========================================================================");
        out.printf(" Target Role   : %s%n", report.getTargetRole());
        out.printf(" Engine Mode   : %s%n", report.getEngineMode().getDisplayName());
        out.printf(" Overall Score : %d / 100 (%s)%n", report.getOverallScore(), report.getScoreLabel());
        out.printf(" PII Masked    : %d items | Latency: %d ms%n", report.getPiiItemsMasked(), report.getAnalysisTimeMs());
        out.println("--------------------------------------------------------------------------");
        out.println(" Category Breakdown:");
        for (Map.Entry<String, CategoryScore> entry : report.getCategoryScores().entrySet()) {
            CategoryScore cs = entry.getValue();
            out.printf("  - %-28s : %3d/100 (weight %.0f%%) | %s%n",
                cs.getCriterionName(), cs.getScore(), cs.getWeight() * 100, cs.getFeedback());
        }
        out.println("--------------------------------------------------------------------------");
        out.println(" Matched Keywords : " + String.join(", ", report.getMatchedKeywords()));
        out.println(" Missing Keywords : " + String.join(", ", report.getMissingKeywords()));
        out.println("--------------------------------------------------------------------------");
        out.println(" Prioritized Fixes (PriorityQueue order):");
        for (FixRecommendation fix : report.getPrioritizedFixes()) {
            out.printf("  [%s] %s -> %s%n", fix.getPriority(), fix.getTitle(), fix.getRecommendation());
        }
        out.println("--------------------------------------------------------------------------");
        out.println(" " + report.getDisclaimer());
        out.println("==========================================================================");
    }

    private void printUsage(PrintStream out) {
        out.println("CareerPulse Standalone CLI Tester (Java 17 · Offline · Zero API Keys)");
        out.println("Usage:");
        out.println("  mvn compile exec:java -Dexec.mainClass=com.careerpulse.cli.CareerPulseStandaloneTester");
        out.println("  mvn compile exec:java -Dexec.mainClass=com.careerpulse.cli.CareerPulseStandaloneTester -Dexec.args=\"--self-test\"");
        out.println("  mvn compile exec:java -Dexec.mainClass=com.careerpulse.cli.CareerPulseStandaloneTester "
            + "-Dexec.args=\"--file resume.txt --role 'Java Backend Engineer'\"");
        out.println("  mvn compile exec:java -Dexec.mainClass=com.careerpulse.cli.CareerPulseStandaloneTester -Dexec.args=\"--interactive\"");
    }
}
