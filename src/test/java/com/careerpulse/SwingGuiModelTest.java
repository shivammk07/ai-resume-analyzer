package com.careerpulse;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.engine.ResumeAnalyzerService;
import com.careerpulse.gui.DesktopAuditController;
import com.careerpulse.gui.SwingTableModels.AuditHistoryTableModel;
import com.careerpulse.gui.SwingTableModels.BenchmarkResultTableModel;
import com.careerpulse.gui.SwingTableModels.FixRecommendationTableModel;
import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import com.careerpulse.model.RetentionPolicy;
import com.careerpulse.privacy.PiiRedactor;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Headless-safe JUnit 5 tests validating the Java Swing Desktop MVC controller
 * ({@link DesktopAuditController}) and Swing table models against an isolated
 * in-memory H2 JDBC database so CI passes cleanly without an X11 display.
 *
 * @author Shivam Kumar (Team Moshdi)
 */
class SwingGuiModelTest {
    private static DesktopAuditController controller;

    @BeforeAll
    static void setUpController() throws Exception {
        DatabaseConnectionManager testManager =
            DatabaseConnectionManager.createInMemoryTestManager("swing_gui_controller_test");
        controller = new DesktopAuditController(testManager);
    }

    @Test
    void desktopControllerPersistsRedactedAuditAndPopulatesTableModels() throws Exception {
        String sampleResume = """
            Alex Rivera
            Email: alex.rivera@example.com | Phone: (512) 555-0144
            SUMMARY
            Java Engineer experienced with JDBC, Servlets, and MySQL.
            EXPERIENCE
            Backend Developer | Acme Corp | 2021 - Present
            - Engineered Jakarta Servlet endpoints handling 18,000 req/sec with 99.9% uptime.
            - Reduced database latency by 42% using parameterized PreparedStatements.
            SKILLS
            Java 17, JDBC, MySQL, Jakarta Servlets, JUnit 5, Maven
            EDUCATION
            B.S. Computer Science (2017 - 2021)
            """;

        ResumeAnalyzerService.AnalysisBundle bundle = controller.analyzeAndSave(
            sampleResume,
            "alex_rivera.txt",
            "Java Backend Engineer",
            "Java 17, JDBC, MySQL, Jakarta Servlets, JUnit 5, Maven",
            true,
            RetentionPolicy.HOURS_24
        );

        assertNotNull(bundle.report().getId());
        assertTrue(bundle.report().getOverallScore() >= 70);
        assertEquals(2, bundle.report().getPiiItemsMasked());
        assertFalse(bundle.resumeDocument().getNormalizedContent().contains("alex.rivera@example.com"));

        FixRecommendationTableModel fixModel = new FixRecommendationTableModel();
        fixModel.setItems(bundle.report().getPrioritizedFixes());
        assertEquals(4, fixModel.getColumnCount());
        assertTrue(fixModel.getRowCount() >= 1);

        List<AnalysisReport> history = controller.loadHistory();
        AuditHistoryTableModel historyModel = new AuditHistoryTableModel();
        historyModel.setReports(history);
        assertTrue(historyModel.getRowCount() >= 1);
        assertEquals("alex_rivera.txt", historyModel.getValueAt(0, 1));

        boolean deleted = controller.deleteReport(bundle.report().getId());
        assertTrue(deleted);
    }

    @Test
    void desktopControllerRunsBenchmarkSuiteAndTestsPiiRedaction() throws Exception {
        BenchmarkSummary summary = controller.runAndPersistBenchmark();
        assertNotNull(summary.getId());
        assertEquals(12, summary.getDatasetSize());
        assertTrue(summary.getBandAccuracyPct() >= 75.0);

        BenchmarkResultTableModel bmModel = new BenchmarkResultTableModel();
        bmModel.setResults(summary.getResults());
        assertEquals(12, bmModel.getRowCount());
        assertEquals(9, bmModel.getColumnCount());

        PiiRedactor.RedactionResult redaction = controller.testPiiRedaction(
            "SSN: 123-45-6789 | Email: demo@example.org"
        );
        assertEquals(2, redaction.totalMaskedCount());
        assertFalse(redaction.redactedText().contains("123-45-6789"));

        assertTrue(controller.purgeAllDesktopData() >= 0);
        assertFalse(controller.loadAuditLogs().isEmpty());
    }
}
