package com.careerpulse.web;

import com.careerpulse.dao.DatabaseConnectionManager;
import com.careerpulse.dao.JdbcBenchmarkDao;
import com.careerpulse.engine.BenchmarkValidator;
import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.exception.DocumentValidationException;
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import com.careerpulse.util.JsonSupport;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * Jakarta EE 10 Servlet running the 12-resume labeled ATS validation benchmark suite,
 * persisting reproducible results via JDBC, and rendering benchmark.jsp or JSON.
 */
@WebServlet(urlPatterns = {"/benchmark", "/api/java/benchmark"})
public class BenchmarkServlet extends HttpServlet {
    private BenchmarkValidator validator;
    private JdbcBenchmarkDao benchmarkDao;

    public BenchmarkServlet() {}

    public BenchmarkServlet(BenchmarkValidator validator, JdbcBenchmarkDao benchmarkDao) {
        this.validator = validator;
        this.benchmarkDao = benchmarkDao;
    }

    @Override
    public void init() throws ServletException {
        if (validator == null) {
            this.validator = new BenchmarkValidator();
        }
        if (benchmarkDao == null) {
            try {
                this.benchmarkDao = new JdbcBenchmarkDao(DatabaseConnectionManager.getDefault());
            } catch (DatabaseOperationException ex) {
                throw new ServletException("Failed to initialize JdbcBenchmarkDao", ex);
            }
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            List<BenchmarkSummary> history = benchmarkDao.findAll();
            BenchmarkSummary latest = history.isEmpty() ? runAndPersist() : history.get(0);

            if (isJsonRequest(req)) {
                resp.setContentType("application/json; charset=UTF-8");
                resp.getWriter().write(JsonSupport.gson().toJson(latest));
                return;
            }

            req.setAttribute("summary", latest);
            req.setAttribute("runHistory", history);
            req.getRequestDispatcher("/WEB-INF/views/benchmark.jsp").forward(req, resp);
        } catch (DocumentValidationException | DatabaseOperationException ex) {
            throw new ServletException("Benchmark evaluation failed", ex);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            BenchmarkSummary latest = runAndPersist();
            if (isJsonRequest(req)) {
                resp.setContentType("application/json; charset=UTF-8");
                resp.getWriter().write(JsonSupport.gson().toJson(latest));
                return;
            }
            req.setAttribute("summary", latest);
            req.setAttribute("runHistory", benchmarkDao.findAll());
            req.getRequestDispatcher("/WEB-INF/views/benchmark.jsp").forward(req, resp);
        } catch (DocumentValidationException | DatabaseOperationException ex) {
            throw new ServletException("Benchmark execution failed", ex);
        }
    }

    private BenchmarkSummary runAndPersist() throws DocumentValidationException, DatabaseOperationException {
        BenchmarkSummary summary = validator.runValidationSuite();
        return benchmarkDao.save(summary);
    }

    private boolean isJsonRequest(HttpServletRequest req) {
        String path = req.getServletPath();
        String accept = req.getHeader("Accept");
        return (path != null && path.startsWith("/api/"))
            || (accept != null && accept.contains("application/json"));
    }
}
