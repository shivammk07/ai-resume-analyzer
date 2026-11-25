package com.careerpulse.web;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.dao.JdbcAuditLogDao;
import com.careerpulse.dao.JdbcUserDao;
import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.model.AuditLogEntry;
import com.careerpulse.model.User;
import com.careerpulse.privacy.PasswordHasher;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

/**
 * Jakarta EE 10 Servlet handling candidate account registration, PBKDF2 password sign-in, and sign-out.
 */
@WebServlet("/auth")
public class AuthServlet extends HttpServlet {
    private JdbcUserDao userDao;
    private JdbcAuditLogDao auditLogDao;

    public AuthServlet() {}

    public AuthServlet(JdbcUserDao userDao, JdbcAuditLogDao auditLogDao) {
        this.userDao = userDao;
        this.auditLogDao = auditLogDao;
    }

    @Override
    public void init() throws ServletException {
        if (userDao == null) {
            try {
                DatabaseConnectionManager mgr = DatabaseConnectionManager.getDefault();
                this.userDao = new JdbcUserDao(mgr);
                this.auditLogDao = new JdbcAuditLogDao(mgr);
            } catch (DatabaseOperationException ex) {
                throw new ServletException("Failed to initialize AuthServlet DAOs", ex);
            }
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.getRequestDispatcher("/WEB-INF/views/auth.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        String email = req.getParameter("email");
        String password = req.getParameter("password");
        String displayName = req.getParameter("displayName");

        if ("logout".equalsIgnoreCase(action)) {
            HttpSession old = req.getSession(false);
            if (old != null) {
                old.invalidate();
            }
            resp.sendRedirect(req.getContextPath() + "/analyze");
            return;
        }

        if (email == null || email.isBlank() || password == null || password.length() < 6) {
            req.setAttribute("error", "Valid email and password (minimum 6 characters) are required.");
            req.getRequestDispatcher("/WEB-INF/views/auth.jsp").forward(req, resp);
            return;
        }

        try {
            if ("register".equalsIgnoreCase(action)) {
                if (userDao.findByEmail(email).isPresent()) {
                    req.setAttribute("error", "An account with this email already exists.");
                    req.getRequestDispatcher("/WEB-INF/views/auth.jsp").forward(req, resp);
                    return;
                }
                User newUser = new User(
                    null,
                    email.trim().toLowerCase(),
                    (displayName == null || displayName.isBlank()) ? email.split("@")[0] : displayName.trim(),
                    PasswordHasher.hash(password),
                    User.Role.CANDIDATE,
                    Instant.now()
                );
                userDao.save(newUser);
                bindSession(req, newUser);
                auditLogDao.save(new AuditLogEntry(newUser.getId(), "REGISTER", String.valueOf(newUser.getId()), "Account registered"));
                resp.sendRedirect(req.getContextPath() + "/analyze");
                return;
            }

            // Default: sign-in
            Optional<User> found = userDao.findByEmail(email);
            if (found.isEmpty() || !PasswordHasher.verify(password, found.get().getPasswordHash())) {
                req.setAttribute("error", "Invalid email or password.");
                req.getRequestDispatcher("/WEB-INF/views/auth.jsp").forward(req, resp);
                return;
            }
            bindSession(req, found.get());
            auditLogDao.save(new AuditLogEntry(found.get().getId(), "LOGIN", String.valueOf(found.get().getId()), "User signed in"));
            resp.sendRedirect(req.getContextPath() + "/analyze");
        } catch (DatabaseOperationException ex) {
            req.setAttribute("error", "Database error during authentication: " + ex.getMessage());
            req.getRequestDispatcher("/WEB-INF/views/auth.jsp").forward(req, resp);
        }
    }

    private void bindSession(HttpServletRequest req, User user) {
        HttpSession session = req.getSession(true);
        session.setAttribute(SecurityAndPrivacyFilter.SESSION_USER_ID, user.getId());
        session.setAttribute(SecurityAndPrivacyFilter.SESSION_USER_EMAIL, user.getEmail());
        session.setAttribute(SecurityAndPrivacyFilter.SESSION_USER_NAME, user.getDisplayName());
    }
}
