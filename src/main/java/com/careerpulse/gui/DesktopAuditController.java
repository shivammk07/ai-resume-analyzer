package com.careerpulse.gui;

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
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import com.careerpulse.model.EngineMode;
import com.careerpulse.model.RetentionPolicy;
import com.careerpulse.model.User;
import com.careerpulse.privacy.PasswordHasher;
import com.careerpulse.privacy.PiiRedactor;
import com.careerpulse.privacy.RegexPiiRedactor;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

/**
 * Headless-safe MVC controller connecting the Java Swing desktop UI
 * ({@link CareerPulseDesktopApp}) to the shared Core Java scoring engine,
 * PII redaction pipeline, benchmark validator, and JDBC DAO layer.
 *
 * <p>Reusing the exact same service and DAO classes as the Jakarta EE 10
 * Servlets guarantees identical scoring, privacy enforcement, and database
 * persistence across both web and desktop clients.</p>
 *
 * @author Shivam Kumar (Team Moshdi)
 */
public class DesktopAuditController {
    private static final String DESKTOP_USER_EMAIL = "desktop.workspace@careerpulse.local";
    private static final String DESKTOP_USER_NAME = "Desktop Evaluator (Team Moshdi)";

    private final DatabaseConnectionManager connectionManager;
    private final ResumeAnalyzerService analyzerService;
    private final BenchmarkValidator benchmarkValidator;
    private final PiiRedactor piiRedactor;
    private final JdbcUserDao userDao;
    private final JdbcAnalysisReportDao reportDao;
    private final JdbcBenchmarkDao benchmarkDao;
    private final JdbcAuditLogDao auditLogDao;
    private final long desktopUserId;

    /**
     * Initializes the controller using the default {@link DatabaseConnectionManager}
     * (MySQL 8 via environment variables with automatic H2 fallback).
     *
     * @throws DatabaseOperationException if JDBC initialization fails
     */
    public DesktopAuditController() throws DatabaseOperationException {
        this(DatabaseConnectionManager.getDefault());
    }

    /**
     * Initializes the controller with an explicit {@link DatabaseConnectionManager},
     * enabling isolated in-memory H2 integration tests.
     *
     * @param connectionManager configured JDBC connection manager
     * @throws DatabaseOperationException if schema or workspace user setup fails
     */
    public DesktopAuditController(DatabaseConnectionManager connectionManager)
            throws DatabaseOperationException {
        this.connectionManager = connectionManager;
        this.analyzerService = new ResumeAnalyzerService();
        this.benchmarkValidator = new BenchmarkValidator(this.analyzerService);
        this.piiRedactor = new RegexPiiRedactor();
        this.userDao = new JdbcUserDao(connectionManager);
        this.reportDao = new JdbcAnalysisReportDao(connectionManager);
        this.benchmarkDao = new JdbcBenchmarkDao(connectionManager);
        this.auditLogDao = new JdbcAuditLogDao(connectionManager);
        this.desktopUserId = ensureDesktopUser();
    }

    /**
     * Ensures a dedicated local desktop owner account exists in JDBC so all
     * desktop audits remain strictly owner-scoped.
     *
     * @return persistent database ID of the desktop user
     * @throws DatabaseOperationException if user query or creation fails
     */
    private long ensureDesktopUser() throws DatabaseOperationException {
        return userDao.findByEmail(DESKTOP_USER_EMAIL)
            .map(User::getId)
            .orElseGet(() -> {
                try {
                    byte[] randomBytes = new byte[24];
                    new SecureRandom().nextBytes(randomBytes);
                    String generatedSecret = Base64.getEncoder().encodeToString(randomBytes);

                    User user = new User();
                    user.setEmail(DESKTOP_USER_EMAIL);
                    user.setDisplayName(DESKTOP_USER_NAME);
                    user.setPasswordHash(PasswordHasher.hash(generatedSecret));
                    user.setRole(User.Role.REVIEWER);
                    User saved = userDao.save(user);
                    return saved.getId();
                } catch (DatabaseOperationException ex) {
                    throw new IllegalStateException("Unable to provision desktop workspace user", ex);
                }
            });
    }

    /**
     * Executes deterministic offline ATS analysis with optional PII redaction,
     * persists the redacted resume and report atomically via JDBC when the
     * retention policy is non-ephemeral, and logs the privacy audit event.
     *
     * @param resumeText raw resume text input
     * @param fileName display file name
     * @param targetRole target job title
     * @param jobDescription optional job description text
     * @param redactPii whether PII masking is applied prior to scoring/storage
     * @param retentionPolicy retention TTL policy
     * @return full analysis bundle containing the redacted document and report
     * @throws DocumentValidationException if resume text is invalid or too short
     * @throws DatabaseOperationException if JDBC transaction fails
     */
    public ResumeAnalyzerService.AnalysisBundle analyzeAndSave(
            String resumeText,
            String fileName,
            String targetRole,
            String jobDescription,
            boolean redactPii,
            RetentionPolicy retentionPolicy)
            throws DocumentValidationException, DatabaseOperationException {

        RetentionPolicy effectivePolicy = retentionPolicy != null
            ? retentionPolicy
            : RetentionPolicy.HOURS_24;

        ResumeAnalyzerService.AnalysisBundle bundle = analyzerService.analyze(
            resumeText,
            fileName != null && !fileName.isBlank() ? fileName.trim() : "desktop_resume.txt",
            "Desktop Text",
            targetRole != null && !targetRole.isBlank() ? targetRole.trim() : "Software Engineer",
            jobDescription,
            "Senior",
            redactPii,
            effectivePolicy,
            EngineMode.DETERMINISTIC_LOCAL
        );

        bundle.resumeDocument().setUserId(desktopUserId);
        bundle.report().setOwnerUserId(desktopUserId);

        if (effectivePolicy != RetentionPolicy.EPHEMERAL) {
            reportDao.saveResumeAndReportTransaction(bundle.resumeDocument(), bundle.report());
            auditLogDao.save(new AuditLogEntry(
                desktopUserId,
                "DESKTOP_ANALYZE",
                String.valueOf(bundle.report().getId()),
                "Score=" + bundle.report().getOverallScore()
                    + ", PII_Masked=" + bundle.report().getPiiItemsMasked()
                    + ", TTL=" + effectivePolicy.name()
            ));
        } else {
            auditLogDao.save(new AuditLogEntry(
                desktopUserId,
                "DESKTOP_ANALYZE_EPHEMERAL",
                "ephemeral",
                "Score=" + bundle.report().getOverallScore() + ", Not persisted"
            ));
        }

        return bundle;
    }

    /**
     * Retrieves all non-deleted analysis reports owned by the desktop user.
     *
     * @return ordered list of persisted {@link AnalysisReport} records
     * @throws DatabaseOperationException if JDBC query fails
     */
    public List<AnalysisReport> loadHistory() throws DatabaseOperationException {
        return reportDao.findByUserId(desktopUserId);
    }

    /**
     * Deletes a single owned report and its associated resume row.
     *
     * @param reportId primary key of the report to delete
     * @return {@code true} if a record was removed
     * @throws DatabaseOperationException if JDBC deletion fails
     */
    public boolean deleteReport(long reportId) throws DatabaseOperationException {
        boolean deleted = reportDao.deleteByReportIdAndUserId(reportId, desktopUserId);
        if (deleted) {
            auditLogDao.save(new AuditLogEntry(
                desktopUserId,
                "DESKTOP_DELETE_REPORT",
                String.valueOf(reportId),
                "Deleted owned report via Swing GUI"
            ));
        }
        return deleted;
    }

    /**
     * Runs the 12-resume labeled validation benchmark suite and persists the
     * reproducible summary metrics via {@link JdbcBenchmarkDao}.
     *
     * @return persisted {@link BenchmarkSummary} with MAE, Band %, Spearman rho, and latency
     * @throws DocumentValidationException if any benchmark input fails validation
     * @throws DatabaseOperationException if persisting the benchmark run fails
     */
    public BenchmarkSummary runAndPersistBenchmark()
            throws DocumentValidationException, DatabaseOperationException {
        BenchmarkSummary summary = benchmarkValidator.runValidationSuite();
        return benchmarkDao.save(summary);
    }

    /**
     * Applies regex-based PII redaction for live verification in the Privacy tab.
     *
     * @param rawInput text containing sample PII
     * @return redaction result with sanitized text and per-category counts
     */
    public PiiRedactor.RedactionResult testPiiRedaction(String rawInput) {
        return piiRedactor.redact(rawInput != null ? rawInput : "");
    }

    /**
     * Purges all resumes whose retention TTL timestamp has expired.
     *
     * @return number of expired records deleted
     * @throws DatabaseOperationException if JDBC purge fails
     */
    public int purgeExpiredRecords() throws DatabaseOperationException {
        int removed = reportDao.deleteExpiredResumes(Instant.now());
        auditLogDao.save(new AuditLogEntry(
            desktopUserId,
            "DESKTOP_TTL_CLEANUP",
            "ttl-batch",
            "Purged " + removed + " expired resume records"
        ));
        return removed;
    }

    /**
     * Permanently deletes all resumes and reports belonging to the desktop user.
     *
     * @return number of deleted resume records
     * @throws DatabaseOperationException if JDBC purge fails
     */
    public int purgeAllDesktopData() throws DatabaseOperationException {
        int removed = reportDao.purgeAllByUserId(desktopUserId);
        auditLogDao.save(new AuditLogEntry(
            desktopUserId,
            "DESKTOP_PURGE_ALL",
            "user-" + desktopUserId,
            "Purged all " + removed + " owned records via Swing GUI"
        ));
        return removed;
    }

    /**
     * Lists recent privacy and security audit log entries for the desktop user.
     *
     * @return ordered list of audit log entries
     * @throws DatabaseOperationException if JDBC query fails
     */
    public List<AuditLogEntry> loadAuditLogs() throws DatabaseOperationException {
        return auditLogDao.findByUserId(desktopUserId);
    }

    /**
     * Returns a human-readable description of the active JDBC engine (MySQL 8 or H2 fallback).
     *
     * @return active JDBC driver label
     */
    public String getActiveDatabaseDriver() {
        return connectionManager.getActiveDriver();
    }

    /**
     * Returns the persistent owner ID used by the desktop workspace.
     *
     * @return desktop owner user ID
     */
    public long getDesktopUserId() {
        return desktopUserId;
    }
}
