package com.careerpulse.web;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.dao.JdbcAnalysisReportDao;
import com.careerpulse.dao.JdbcAuditLogDao;
import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.model.AuditLogEntry;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Jakarta EE 10 Servlet exposing documented privacy safeguards, audit access logs,
 * single-record deletion, and one-click permanent purge of all user resumes.
 */
@WebServlet("/privacy")
public class PrivacyPurgeServlet extends HttpServlet {
    private JdbcAnalysisReportDao reportDao;
    private JdbcAuditLogDao auditLogDao;

    public PrivacyPurgeServlet() {}

    public PrivacyPurgeServlet(JdbcAnalysisReportDao reportDao, JdbcAuditLogDao auditLogDao) {
        this.reportDao = reportDao;
        this.auditLogDao = auditLogDao;
    }

    @Override
    public void init() throws ServletException {
        if (reportDao == null) {
            try {
                DatabaseConnectionManager mgr = DatabaseConnectionManager.getDefault();
                this.reportDao = new JdbcAnalysisReportDao(mgr);
                this.auditLogDao = new JdbcAuditLogDao(mgr);
            } catch (DatabaseOperationException ex) {
                throw new ServletException("Failed to initialize PrivacyPurgeServlet DAOs", ex);
            }
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(true);
        Long userId = (Long) session.getAttribute(SecurityAndPrivacyFilter.SESSION_USER_ID);
        try {
            List<AuditLogEntry> logs = userId != null ? auditLogDao.findByUserId(userId) : List.of();
            req.setAttribute("auditLogs", logs);
            req.getRequestDispatcher("/WEB-INF/views/privacy.jsp").forward(req, resp);
        } catch (DatabaseOperationException ex) {
            throw new ServletException("Failed to load privacy logs", ex);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(true);
        Long userId = (Long) session.getAttribute(SecurityAndPrivacyFilter.SESSION_USER_ID);
        if (userId == null) {
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required.");
            return;
        }

        String action = req.getParameter("action");
        try {
            if ("deleteOne".equalsIgnoreCase(action)) {
                long reportId = Long.parseLong(req.getParameter("reportId"));
                boolean deleted = reportDao.deleteByReportIdAndUserId(reportId, userId);
                if (!deleted) {
                    resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Record not found or not owned by current user.");
                    return;
                }
                auditLogDao.save(new AuditLogEntry(userId, "PURGE_RECORD", String.valueOf(reportId), "Deleted single resume & report"));
                resp.sendRedirect(req.getContextPath() + "/history?purged=1");
                return;
            }

            if ("purgeAll".equalsIgnoreCase(action)) {
                int removed = reportDao.purgeAllByUserId(userId);
                auditLogDao.save(new AuditLogEntry(userId, "PURGE_ALL", "user:" + userId, "Permanently purged " + removed + " records"));
                resp.sendRedirect(req.getContextPath() + "/privacy?purgedCount=" + removed);
                return;
            }

            if ("cleanupExpired".equalsIgnoreCase(action)) {
                int expired = reportDao.deleteExpiredResumes(Instant.now());
                auditLogDao.save(new AuditLogEntry(userId, "TTL_CLEANUP", "expired", "Expired records removed: " + expired));
                resp.sendRedirect(req.getContextPath() + "/privacy?expiredCount=" + expired);
                return;
            }

            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unknown privacy action.");
        } catch (NumberFormatException ex) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid report ID.");
        } catch (DatabaseOperationException ex) {
            throw new ServletException("Failed to execute privacy purge", ex);
        }
    }
}
