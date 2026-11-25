package com.careerpulse.web;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.dao.JdbcAnalysisReportDao;
import com.careerpulse.dao.JdbcAuditLogDao;
import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.model.AnalysisReport;
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
import java.util.Optional;

/**
 * Jakarta EE 10 Servlet serving persisted JDBC analysis history with strict user-ownership checks.
 */
@WebServlet("/history")
public class AnalysisHistoryServlet extends HttpServlet {
    private JdbcAnalysisReportDao reportDao;
    private JdbcAuditLogDao auditLogDao;

    public AnalysisHistoryServlet() {}

    public AnalysisHistoryServlet(JdbcAnalysisReportDao reportDao, JdbcAuditLogDao auditLogDao) {
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
                throw new ServletException("Failed to initialize AnalysisHistoryServlet DAOs", ex);
            }
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(true);
        Long userId = (Long) session.getAttribute(SecurityAndPrivacyFilter.SESSION_USER_ID);
        if (userId == null) {
            resp.sendRedirect(req.getContextPath() + "/auth");
            return;
        }

        try {
            // Enforce privacy TTL expiration before listing history
            reportDao.deleteExpiredResumes(Instant.now());

            String idParam = req.getParameter("id");
            if (idParam != null && !idParam.isBlank()) {
                long reportId = Long.parseLong(idParam);
                Optional<AnalysisReport> owned = reportDao.findByIdAndUserId(reportId, userId);
                if (owned.isEmpty()) {
                    resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Report not found or access denied.");
                    return;
                }
                if (auditLogDao != null) {
                    auditLogDao.save(new AuditLogEntry(userId, "VIEW_REPORT", String.valueOf(reportId), "Viewed stored report"));
                }
                req.setAttribute("report", owned.get());
                req.getRequestDispatcher("/WEB-INF/views/report.jsp").forward(req, resp);
                return;
            }

            List<AnalysisReport> reports = reportDao.findByUserId(userId);
            req.setAttribute("reports", reports);
            req.getRequestDispatcher("/WEB-INF/views/history.jsp").forward(req, resp);
        } catch (NumberFormatException ex) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid report ID.");
        } catch (DatabaseOperationException ex) {
            throw new ServletException("Unable to load analysis history", ex);
        }
    }
}
