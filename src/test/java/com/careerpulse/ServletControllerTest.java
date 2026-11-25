package com.careerpulse;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.dao.JdbcAnalysisReportDao;
import com.careerpulse.dao.JdbcAuditLogDao;
import com.careerpulse.dao.JdbcBenchmarkDao;
import com.careerpulse.dao.JdbcUserDao;
import com.careerpulse.engine.BenchmarkValidator;
import com.careerpulse.engine.ResumeAnalyzerService;
import com.careerpulse.model.User;
import com.careerpulse.privacy.PasswordHasher;
import com.careerpulse.web.BenchmarkServlet;
import com.careerpulse.web.PrivacyPurgeServlet;
import com.careerpulse.web.ResumeUploadServlet;
import com.careerpulse.web.SecurityAndPrivacyFilter;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Jakarta EE 10 Servlet unit/integration tests using Mockito + H2 JDBC DAOs.
 */
class ServletControllerTest {

    private DatabaseConnectionManager dbManager;
    private JdbcUserDao userDao;
    private JdbcAnalysisReportDao reportDao;
    private JdbcBenchmarkDao benchmarkDao;
    private JdbcAuditLogDao auditLogDao;
    private User testUser;

    @BeforeEach
    void setUp() throws Exception {
        dbManager = DatabaseConnectionManager.createInMemoryTestManager("servlet_" + UUID.randomUUID().toString().replace("-", ""));
        userDao = new JdbcUserDao(dbManager);
        reportDao = new JdbcAnalysisReportDao(dbManager);
        benchmarkDao = new JdbcBenchmarkDao(dbManager);
        auditLogDao = new JdbcAuditLogDao(dbManager);
        testUser = userDao.save(new User(null, "servlet@example.com", "Tester", PasswordHasher.hash("TestPass123"), User.Role.CANDIDATE, Instant.now()));
    }

    @Test
    void resumeUploadServletShouldReturnJsonReportAndPersistViaJdbc() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        when(req.getServletPath()).thenReturn("/api/java/analyze");
        when(req.getHeader("Accept")).thenReturn("application/json");
        when(req.getSession(true)).thenReturn(session);
        when(session.getAttribute(SecurityAndPrivacyFilter.SESSION_USER_ID)).thenReturn(testUser.getId());
        when(req.getParameter("resumeText")).thenReturn(
            "SUMMARY\nJava Backend Developer\nEXPERIENCE\n- Engineered JDBC services on MySQL handling 20,000 requests/sec.\nSKILLS\nJava, JDBC, Servlets, MySQL\nEDUCATION\nB.S. CS (2018 - 2022)"
        );
        when(req.getParameter("targetRole")).thenReturn("Java Backend Engineer");
        when(req.getParameter("jobDescription")).thenReturn("Java, JDBC, Servlets, MySQL");
        when(req.getParameter("retentionPolicy")).thenReturn("HOURS_24");
        when(req.getParameter("engineMode")).thenReturn("DETERMINISTIC_LOCAL");

        StringWriter jsonOut = new StringWriter();
        when(resp.getWriter()).thenReturn(new PrintWriter(jsonOut));

        TestResumeServlet postRunner = new TestResumeServlet(new ResumeAnalyzerService(), reportDao, auditLogDao, dbManager);
        postRunner.invokePost(req, resp);

        assertTrue(jsonOut.toString().contains("overallScore"));
        assertEquals(1, reportDao.findByUserId(testUser.getId()).size());
    }

    @Test
    void benchmarkServletShouldReturnValidationJson() throws Exception {
        TestBenchmarkServlet servlet = new TestBenchmarkServlet(new BenchmarkValidator(), benchmarkDao);
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);

        when(req.getServletPath()).thenReturn("/api/java/benchmark");
        when(req.getHeader("Accept")).thenReturn("application/json");
        StringWriter jsonOut = new StringWriter();
        when(resp.getWriter()).thenReturn(new PrintWriter(jsonOut));

        servlet.invokeGet(req, resp);
        assertTrue(jsonOut.toString().contains("meanAbsoluteError"));
        assertTrue(jsonOut.toString().contains("spearmanRho"));
    }

    @Test
    void privacyPurgeServletShouldRejectUnauthenticatedPurge() throws Exception {
        TestPrivacyServlet servlet = new TestPrivacyServlet(reportDao, auditLogDao);
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        when(req.getSession(true)).thenReturn(session);
        when(session.getAttribute(SecurityAndPrivacyFilter.SESSION_USER_ID)).thenReturn(null);
        when(req.getParameter("action")).thenReturn("purgeAll");

        servlet.invokePost(req, resp);
        verify(resp).sendError(eq(HttpServletResponse.SC_UNAUTHORIZED), anyString());
    }

    @Test
    void resumeUploadServletShouldForwardDashboardOnGet() throws Exception {
        TestResumeServlet servlet = new TestResumeServlet(new ResumeAnalyzerService(), reportDao, auditLogDao, dbManager);
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        RequestDispatcher dispatcher = mock(RequestDispatcher.class);

        when(req.getRequestDispatcher("/WEB-INF/views/dashboard.jsp")).thenReturn(dispatcher);
        servlet.invokeGet(req, resp);
        verify(dispatcher).forward(req, resp);
    }

    private static class TestResumeServlet extends ResumeUploadServlet {
        TestResumeServlet(ResumeAnalyzerService svc, JdbcAnalysisReportDao rDao, JdbcAuditLogDao aDao, DatabaseConnectionManager mgr) {
            super(svc, rDao, aDao, mgr);
        }
        void invokeGet(HttpServletRequest req, HttpServletResponse resp) throws Exception { doGet(req, resp); }
        void invokePost(HttpServletRequest req, HttpServletResponse resp) throws Exception { doPost(req, resp); }
    }

    private static class TestBenchmarkServlet extends BenchmarkServlet {
        TestBenchmarkServlet(BenchmarkValidator v, JdbcBenchmarkDao dao) { super(v, dao); }
        void invokeGet(HttpServletRequest req, HttpServletResponse resp) throws Exception { doGet(req, resp); }
    }

    private static class TestPrivacyServlet extends PrivacyPurgeServlet {
        TestPrivacyServlet(JdbcAnalysisReportDao rDao, JdbcAuditLogDao aDao) { super(rDao, aDao); }
        void invokePost(HttpServletRequest req, HttpServletResponse resp) throws Exception { doPost(req, resp); }
    }
}
