package com.careerpulse.web;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.dao.JdbcAnalysisReportDao;
import com.careerpulse.dao.JdbcUserDao;
import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.model.User;
import com.careerpulse.privacy.PasswordHasher;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Jakarta EE 10 Servlet Filter enforcing security headers, session CSRF tokens,
 * periodic privacy TTL purge of expired resumes, and authenticated/guest session ownership.
 */
@WebFilter("/*")
public class SecurityAndPrivacyFilter implements Filter {
    public static final String SESSION_USER_ID = "careerpulse_user_id";
    public static final String SESSION_USER_EMAIL = "careerpulse_user_email";
    public static final String SESSION_USER_NAME = "careerpulse_user_name";
    public static final String SESSION_CSRF_TOKEN = "careerpulse_csrf_token";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final AtomicLong LAST_TTL_PURGE_MS = new AtomicLong(0);
    private static final long TTL_PURGE_INTERVAL_MS = 60_000L;

    private JdbcUserDao userDao;
    private JdbcAnalysisReportDao reportDao;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        try {
            DatabaseConnectionManager mgr = DatabaseConnectionManager.getDefault();
            this.userDao = new JdbcUserDao(mgr);
            this.reportDao = new JdbcAnalysisReportDao(mgr);
        } catch (DatabaseOperationException ex) {
            throw new ServletException("Unable to initialize JDBC connection manager", ex);
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Defense-in-depth security headers
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader("Cache-Control", "no-store, max-age=0");

        String path = req.getServletPath();
        if (path != null && path.startsWith("/assets/")) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = req.getSession(true);
        ensureCsrfToken(session);
        ensureSessionOwner(session);
        runPeriodicTtlPurge();

        // Validate CSRF token on form POST requests (exempting stateless JSON API calls with X-Requested-With)
        if ("POST".equalsIgnoreCase(req.getMethod()) && !isApiJsonRequest(req)) {
            String expected = (String) session.getAttribute(SESSION_CSRF_TOKEN);
            String provided = req.getParameter("csrfToken");
            if (expected == null || provided == null || !expected.equals(provided)) {
                res.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid or missing CSRF token.");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isApiJsonRequest(HttpServletRequest req) {
        String contentType = req.getContentType();
        String xhr = req.getHeader("X-Requested-With");
        return (contentType != null && contentType.contains("application/json"))
            || "XMLHttpRequest".equalsIgnoreCase(xhr);
    }

    private void ensureCsrfToken(HttpSession session) {
        if (session.getAttribute(SESSION_CSRF_TOKEN) == null) {
            byte[] bytes = new byte[24];
            SECURE_RANDOM.nextBytes(bytes);
            session.setAttribute(SESSION_CSRF_TOKEN, Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
        }
    }

    private void ensureSessionOwner(HttpSession session) {
        if (session.getAttribute(SESSION_USER_ID) != null || userDao == null) {
            return;
        }
        // Create an isolated per-session guest account so every resume has a strict relational owner
        String guestEmail = "session-" + session.getId().substring(0, Math.min(12, session.getId().length()))
            + "@local.careerpulse";
        try {
            Optional<User> existing = userDao.findByEmail(guestEmail);
            User owner;
            if (existing.isPresent()) {
                owner = existing.get();
            } else {
                byte[] rand = new byte[18];
                SECURE_RANDOM.nextBytes(rand);
                User created = new User(
                    null,
                    guestEmail,
                    "Session Workspace",
                    PasswordHasher.hash(Base64.getEncoder().encodeToString(rand)),
                    User.Role.CANDIDATE,
                    Instant.now()
                );
                owner = userDao.save(created);
            }
            session.setAttribute(SESSION_USER_ID, owner.getId());
            session.setAttribute(SESSION_USER_EMAIL, owner.getEmail());
            session.setAttribute(SESSION_USER_NAME, owner.getDisplayName());
        } catch (DatabaseOperationException ignored) {
            // Non-fatal; servlets also guard against missing session owner
        }
    }

    private void runPeriodicTtlPurge() {
        if (reportDao == null) return;
        long now = System.currentTimeMillis();
        long prev = LAST_TTL_PURGE_MS.get();
        if (now - prev >= TTL_PURGE_INTERVAL_MS && LAST_TTL_PURGE_MS.compareAndSet(prev, now)) {
            try {
                reportDao.deleteExpiredResumes(Instant.now());
            } catch (DatabaseOperationException ignored) {
                // Logged during explicit purge endpoints
            }
        }
    }
}
