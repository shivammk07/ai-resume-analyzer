package com.careerpulse.web;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.dao.JdbcAnalysisReportDao;
import com.careerpulse.dao.JdbcAuditLogDao;
import com.careerpulse.engine.ResumeAnalyzerService;
import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.exception.DocumentValidationException;
import com.careerpulse.model.AuditLogEntry;
import com.careerpulse.model.EngineMode;
import com.careerpulse.model.RetentionPolicy;
import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Primary Jakarta EE 10 MVC Servlet handling resume submission (multipart file or text),
 * PII masking, deterministic Core Java scoring, optional transactional JDBC storage,
 * and rendering to JSP or JSON.
 */
@WebServlet(urlPatterns = {"/analyze", "/api/java/analyze"})
@MultipartConfig(maxFileSize = 5 * 1024 * 1024, maxRequestSize = 6 * 1024 * 1024)
public class ResumeUploadServlet extends HttpServlet {
    private static final Gson GSON = new Gson();

    private ResumeAnalyzerService analyzerService;
    private JdbcAnalysisReportDao reportDao;
    private JdbcAuditLogDao auditLogDao;
    private DatabaseConnectionManager connectionManager;

    public ResumeUploadServlet() {}

    public ResumeUploadServlet(
            ResumeAnalyzerService analyzerService,
            JdbcAnalysisReportDao reportDao,
            JdbcAuditLogDao auditLogDao,
            DatabaseConnectionManager connectionManager) {
        this.analyzerService = analyzerService;
        this.reportDao = reportDao;
        this.auditLogDao = auditLogDao;
        this.connectionManager = connectionManager;
    }

    @Override
    public void init() throws ServletException {
        if (analyzerService == null) {
            this.analyzerService = new ResumeAnalyzerService();
        }
        if (reportDao == null) {
            try {
                this.connectionManager = DatabaseConnectionManager.getDefault();
                this.reportDao = new JdbcAnalysisReportDao(connectionManager);
                this.auditLogDao = new JdbcAuditLogDao(connectionManager);
            } catch (DatabaseOperationException ex) {
                throw new ServletException("Failed to initialize JDBC DAOs", ex);
            }
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setAttribute("activeDb", connectionManager != null ? connectionManager.getActiveDriver() : "JDBC");
        req.getRequestDispatcher("/WEB-INF/views/dashboard.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        boolean wantsJson = isJsonResponseRequested(req);
        try {
            String resumeText = req.getParameter("resumeText");
            String fileName = "pasted-resume.txt";
            String detectedFormat = "Plain Text";

            // Support multipart text/markdown/csv file upload when present
            if (req.getContentType() != null && req.getContentType().toLowerCase().startsWith("multipart/")) {
                Part filePart = req.getPart("resumeFile");
                if (filePart != null && filePart.getSize() > 0) {
                    String submitted = filePart.getSubmittedFileName();
                    if (submitted != null && !submitted.isBlank()) {
                        fileName = submitted.replaceAll("[^a-zA-Z0-9._-]", "_");
                    }
                    try (InputStream is = filePart.getInputStream()) {
                        resumeText = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    }
                    detectedFormat = "Uploaded File (" + fileName + ")";
                }
            }

            String targetRole = req.getParameter("targetRole");
            String jobDescription = req.getParameter("jobDescription");
            String seniority = req.getParameter("seniorityLevel");
            boolean redactPii = !"false".equalsIgnoreCase(req.getParameter("redactPii"));
            RetentionPolicy retention = RetentionPolicy.fromString(req.getParameter("retentionPolicy"));
            EngineMode engineMode = EngineMode.fromString(req.getParameter("engineMode"));

            ResumeAnalyzerService.AnalysisBundle bundle = analyzerService.analyze(
                resumeText,
                fileName,
                detectedFormat,
                targetRole,
                jobDescription,
                seniority,
                redactPii,
                retention,
                engineMode
            );

            HttpSession session = req.getSession(true);
            Long userId = (Long) session.getAttribute(SecurityAndPrivacyFilter.SESSION_USER_ID);
            if (userId != null) {
                bundle.resumeDocument().setUserId(userId);
                bundle.report().setOwnerUserId(userId);
                if (retention.isPersistent() && reportDao != null) {
                    reportDao.saveResumeAndReportTransaction(bundle.resumeDocument(), bundle.report());
                }
                if (auditLogDao != null) {
                    auditLogDao.save(new AuditLogEntry(
                        userId,
                        "ANALYZE",
                        bundle.report().getId() != null ? String.valueOf(bundle.report().getId()) : "ephemeral",
                        "Mode=" + engineMode.name() + ", Retention=" + retention.name() + ", MaskedPII=" + bundle.report().getPiiItemsMasked()
                    ));
                }
            }

            if (wantsJson) {
                resp.setContentType("application/json; charset=UTF-8");
                resp.getWriter().write(GSON.toJson(bundle.report()));
                return;
            }

            req.setAttribute("report", bundle.report());
            req.setAttribute("redactedPreview", bundle.resumeDocument().getNormalizedContent());
            req.setAttribute("piiBreakdown", bundle.piiBreakdown());
            req.getRequestDispatcher("/WEB-INF/views/report.jsp").forward(req, resp);
        } catch (DocumentValidationException ex) {
            if (wantsJson) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.setContentType("application/json; charset=UTF-8");
                resp.getWriter().write(GSON.toJson(Map.of("error", ex.getMessage())));
                return;
            }
            req.setAttribute("error", ex.getMessage());
            req.getRequestDispatcher("/WEB-INF/views/dashboard.jsp").forward(req, resp);
        } catch (DatabaseOperationException ex) {
            if (wantsJson) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                resp.setContentType("application/json; charset=UTF-8");
                resp.getWriter().write(GSON.toJson(Map.of("error", "Database persistence failed.")));
                return;
            }
            req.setAttribute("error", "Database persistence error: " + ex.getMessage());
            req.getRequestDispatcher("/WEB-INF/views/dashboard.jsp").forward(req, resp);
        }
    }

    private boolean isJsonResponseRequested(HttpServletRequest req) {
        String accept = req.getHeader("Accept");
        String path = req.getServletPath();
        return (path != null && path.startsWith("/api/"))
            || (accept != null && accept.contains("application/json"));
    }
}
