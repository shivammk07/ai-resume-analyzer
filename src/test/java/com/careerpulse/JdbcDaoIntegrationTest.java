package com.careerpulse;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.dao.JdbcAnalysisReportDao;
import com.careerpulse.dao.JdbcAuditLogDao;
import com.careerpulse.dao.JdbcBenchmarkDao;
import com.careerpulse.dao.JdbcUserDao;
import com.careerpulse.engine.BenchmarkValidator;
import com.careerpulse.engine.ResumeAnalyzerService;
import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.AuditLogEntry;
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import com.careerpulse.model.EngineMode;
import com.careerpulse.model.RetentionPolicy;
import com.careerpulse.model.User;
import com.careerpulse.privacy.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests verifying JDBC PreparedStatements, atomic transactions,
 * foreign-key cascades, user ownership isolation, and automated privacy TTL purge
 * against embedded H2 in MySQL compatibility mode.
 */
class JdbcDaoIntegrationTest {

    private DatabaseConnectionManager dbManager;
    private JdbcUserDao userDao;
    private JdbcAnalysisReportDao reportDao;
    private JdbcBenchmarkDao benchmarkDao;
    private JdbcAuditLogDao auditLogDao;
    private ResumeAnalyzerService analyzerService;

    @BeforeEach
    void setUp() throws Exception {
        dbManager = DatabaseConnectionManager.createInMemoryTestManager("test_" + UUID.randomUUID().toString().replace("-", ""));
        userDao = new JdbcUserDao(dbManager);
        reportDao = new JdbcAnalysisReportDao(dbManager);
        benchmarkDao = new JdbcBenchmarkDao(dbManager);
        auditLogDao = new JdbcAuditLogDao(dbManager);
        analyzerService = new ResumeAnalyzerService();
    }

    @Test
    void shouldPersistTransactionallyEnforceOwnershipAndPurgeExpiredRecords() throws Exception {
        User alice = userDao.save(new User(null, "alice@example.com", "Alice", PasswordHasher.hash("AlicePass!1"), User.Role.CANDIDATE, Instant.now()));
        User bob = userDao.save(new User(null, "bob@example.com", "Bob", PasswordHasher.hash("BobPass!1"), User.Role.CANDIDATE, Instant.now()));

        assertNotNull(alice.getId());
        assertEquals(alice.getEmail(), userDao.findByEmail("alice@example.com").orElseThrow().getEmail());

        String sampleResume = """
            Alice Dev
            alice@private.com | 415-555-0100
            SUMMARY
            Java developer with MySQL and JDBC experience.
            EXPERIENCE
            - Built JDBC DAOs serving 10,000 requests/day with 99.9% uptime.
            SKILLS
            Java, JDBC, MySQL, Maven, JUnit
            EDUCATION
            B.S. Computer Science (2018 - 2022)
            """;

        ResumeAnalyzerService.AnalysisBundle bundle = analyzerService.analyze(
            sampleResume, "alice.txt", "Plain Text", "Java Developer",
            "Java, JDBC, MySQL, Maven, JUnit", "Mid", true, RetentionPolicy.HOURS_24, EngineMode.DETERMINISTIC_LOCAL
        );
        bundle.resumeDocument().setUserId(alice.getId());

        AnalysisReport saved = reportDao.saveResumeAndReportTransaction(bundle.resumeDocument(), bundle.report());
        assertNotNull(saved.getId());
        assertNotNull(saved.getResumeId());

        // Ownership isolation: Alice can see it, Bob cannot
        assertTrue(reportDao.findByIdAndUserId(saved.getId(), alice.getId()).isPresent());
        assertTrue(reportDao.findByIdAndUserId(saved.getId(), bob.getId()).isEmpty());
        assertFalse(reportDao.deleteByReportIdAndUserId(saved.getId(), bob.getId()),
            "Bob must not be allowed to delete Alice's report");

        // Verify TTL expiration purge
        int deletedNow = reportDao.deleteExpiredResumes(Instant.now());
        assertEquals(0, deletedNow, "24h record must not be purged immediately");

        int deletedFuture = reportDao.deleteExpiredResumes(Instant.now().plus(25, ChronoUnit.HOURS));
        assertEquals(1, deletedFuture, "Expired record must be purged once TTL elapses");
        assertTrue(reportDao.findByUserId(alice.getId()).isEmpty(), "Cascade delete must remove report too");
    }

    @Test
    void shouldPersistBenchmarkRunsAndAuditLogs() throws Exception {
        BenchmarkValidator validator = new BenchmarkValidator(analyzerService);
        BenchmarkSummary summary = validator.runValidationSuite();
        BenchmarkSummary savedSummary = benchmarkDao.save(summary);

        assertNotNull(savedSummary.getId());
        List<BenchmarkSummary> runs = benchmarkDao.findAll();
        assertEquals(1, runs.size());
        assertEquals(12, runs.get(0).getDatasetSize());

        AuditLogEntry log = auditLogDao.save(new AuditLogEntry(null, "TTL_CLEANUP", "batch", "Cleaned 0 expired rows"));
        assertNotNull(log.getId());
        Optional<AuditLogEntry> loaded = auditLogDao.findById(log.getId());
        assertTrue(loaded.isPresent());
        assertEquals("TTL_CLEANUP", loaded.get().getAction());
    }
}
