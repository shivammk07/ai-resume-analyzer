package com.careerpulse.dao;

import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.EngineMode;
import com.careerpulse.model.ResumeDocument;
import com.careerpulse.model.RetentionPolicy;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * JDBC DAO managing atomic transactional persistence of {@link ResumeDocument} and
 * {@link AnalysisReport} rows, owner-scoped lookups, retention TTL purge, and deletion.
 */
public class JdbcAnalysisReportDao implements GenericDao<AnalysisReport, Long> {
    private final DatabaseConnectionManager connectionManager;

    public JdbcAnalysisReportDao(DatabaseConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    /**
     * Atomically inserts both the PII-redacted resume and its scored analysis report inside
     * a single JDBC transaction with automatic rollback on failure.
     */
    public AnalysisReport saveResumeAndReportTransaction(ResumeDocument resume, AnalysisReport report)
            throws DatabaseOperationException {
        final String insertResumeSql = """
            INSERT INTO resumes (
                user_id, filename, detected_format, redacted_content,
                pii_items_masked, retention_policy, expires_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

        final String insertReportSql = """
            INSERT INTO analysis_reports (
                resume_id, target_role, engine_mode, overall_score, score_label,
                parsability_score, impact_score, action_verb_score, keyword_score,
                formatting_score, analysis_time_ms, summary_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        try (Connection conn = connectionManager.getConnection()) {
            boolean originalAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);
            try {
                long resumeId;
                try (PreparedStatement psResume = conn.prepareStatement(insertResumeSql, Statement.RETURN_GENERATED_KEYS)) {
                    psResume.setLong(1, resume.getUserId());
                    psResume.setString(2, resume.getFileName());
                    psResume.setString(3, resume.getDetectedFormat());
                    psResume.setString(4, resume.getNormalizedContent());
                    psResume.setInt(5, resume.getPiiItemsMasked());
                    psResume.setString(6, resume.getRetentionPolicy().name());
                    if (resume.getExpiresAt() != null) {
                        psResume.setTimestamp(7, Timestamp.from(resume.getExpiresAt()));
                    } else {
                        psResume.setTimestamp(7, null);
                    }
                    psResume.setTimestamp(8, Timestamp.from(resume.getCreatedAt()));
                    psResume.executeUpdate();

                    try (ResultSet keys = psResume.getGeneratedKeys()) {
                        if (!keys.next()) {
                            throw new SQLException("No generated key returned for resumes insert.");
                        }
                        resumeId = keys.getLong(1);
                    }
                }

                resume.setId(resumeId);
                report.setResumeId(resumeId);

                try (PreparedStatement psReport = conn.prepareStatement(insertReportSql, Statement.RETURN_GENERATED_KEYS)) {
                    psReport.setLong(1, resumeId);
                    psReport.setString(2, report.getTargetRole());
                    psReport.setString(3, report.getEngineMode().name());
                    psReport.setInt(4, report.getOverallScore());
                    psReport.setString(5, report.getScoreLabel());
                    psReport.setInt(6, scoreOf(report, "atsParsability"));
                    psReport.setInt(7, scoreOf(report, "quantifiableImpact"));
                    psReport.setInt(8, scoreOf(report, "actionVerbs"));
                    psReport.setInt(9, scoreOf(report, "keywordMatch"));
                    psReport.setInt(10, scoreOf(report, "formattingReadability"));
                    psReport.setLong(11, report.getAnalysisTimeMs());
                    psReport.setString(12, report.getSummaryJson() != null ? report.getSummaryJson() : "{}");
                    psReport.setTimestamp(13, Timestamp.from(report.getCreatedAt()));
                    psReport.executeUpdate();

                    try (ResultSet keys = psReport.getGeneratedKeys()) {
                        if (keys.next()) {
                            report.setId(keys.getLong(1));
                        }
                    }
                }

                conn.commit();
                return report;
            } catch (SQLException ex) {
                conn.rollback();
                throw new DatabaseOperationException("Transactional resume/report save rolled back", ex);
            } finally {
                conn.setAutoCommit(originalAutoCommit);
            }
        } catch (SQLException ex) {
            throw new DatabaseOperationException("JDBC transaction setup failed", ex);
        }
    }

    @Override
    public AnalysisReport save(AnalysisReport report) throws DatabaseOperationException {
        if (report.getResumeId() == null) {
            throw new DatabaseOperationException("Use saveResumeAndReportTransaction when resumeId is not yet assigned.");
        }
        final String sql = """
            INSERT INTO analysis_reports (
                resume_id, target_role, engine_mode, overall_score, score_label,
                parsability_score, impact_score, action_verb_score, keyword_score,
                formatting_score, analysis_time_ms, summary_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, report.getResumeId());
            ps.setString(2, report.getTargetRole());
            ps.setString(3, report.getEngineMode().name());
            ps.setInt(4, report.getOverallScore());
            ps.setString(5, report.getScoreLabel());
            ps.setInt(6, scoreOf(report, "atsParsability"));
            ps.setInt(7, scoreOf(report, "quantifiableImpact"));
            ps.setInt(8, scoreOf(report, "actionVerbs"));
            ps.setInt(9, scoreOf(report, "keywordMatch"));
            ps.setInt(10, scoreOf(report, "formattingReadability"));
            ps.setLong(11, report.getAnalysisTimeMs());
            ps.setString(12, report.getSummaryJson() != null ? report.getSummaryJson() : "{}");
            ps.setTimestamp(13, Timestamp.from(report.getCreatedAt()));
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    report.setId(keys.getLong(1));
                }
            }
            return report;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to insert analysis report", ex);
        }
    }

    public List<AnalysisReport> findByUserId(long userId) throws DatabaseOperationException {
        final String sql = """
            SELECT r.id AS report_id, r.resume_id, res.user_id, res.filename, res.pii_items_masked,
                   res.retention_policy, res.expires_at, r.target_role, r.engine_mode,
                   r.overall_score, r.score_label, r.parsability_score, r.impact_score,
                   r.action_verb_score, r.keyword_score, r.formatting_score,
                   r.analysis_time_ms, r.summary_json, r.created_at
            FROM analysis_reports r
            INNER JOIN resumes res ON r.resume_id = res.id
            WHERE res.user_id = ?
            ORDER BY r.created_at DESC
            """;
        List<AnalysisReport> reports = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    reports.add(mapJoinedRow(rs));
                }
            }
            return reports;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to query analysis history by user", ex);
        }
    }

    public Optional<AnalysisReport> findByIdAndUserId(long reportId, long userId) throws DatabaseOperationException {
        final String sql = """
            SELECT r.id AS report_id, r.resume_id, res.user_id, res.filename, res.pii_items_masked,
                   res.retention_policy, res.expires_at, r.target_role, r.engine_mode,
                   r.overall_score, r.score_label, r.parsability_score, r.impact_score,
                   r.action_verb_score, r.keyword_score, r.formatting_score,
                   r.analysis_time_ms, r.summary_json, r.created_at
            FROM analysis_reports r
            INNER JOIN resumes res ON r.resume_id = res.id
            WHERE r.id = ? AND res.user_id = ?
            """;
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, reportId);
            ps.setLong(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapJoinedRow(rs));
                }
                return Optional.empty();
            }
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to find owned analysis report", ex);
        }
    }

    @Override
    public Optional<AnalysisReport> findById(Long id) throws DatabaseOperationException {
        final String sql = """
            SELECT r.id AS report_id, r.resume_id, res.user_id, res.filename, res.pii_items_masked,
                   res.retention_policy, res.expires_at, r.target_role, r.engine_mode,
                   r.overall_score, r.score_label, r.parsability_score, r.impact_score,
                   r.action_verb_score, r.keyword_score, r.formatting_score,
                   r.analysis_time_ms, r.summary_json, r.created_at
            FROM analysis_reports r
            INNER JOIN resumes res ON r.resume_id = res.id
            WHERE r.id = ?
            """;
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapJoinedRow(rs));
                }
                return Optional.empty();
            }
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to find analysis report by id", ex);
        }
    }

    @Override
    public List<AnalysisReport> findAll() throws DatabaseOperationException {
        final String sql = """
            SELECT r.id AS report_id, r.resume_id, res.user_id, res.filename, res.pii_items_masked,
                   res.retention_policy, res.expires_at, r.target_role, r.engine_mode,
                   r.overall_score, r.score_label, r.parsability_score, r.impact_score,
                   r.action_verb_score, r.keyword_score, r.formatting_score,
                   r.analysis_time_ms, r.summary_json, r.created_at
            FROM analysis_reports r
            INNER JOIN resumes res ON r.resume_id = res.id
            ORDER BY r.created_at DESC
            """;
        List<AnalysisReport> reports = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                reports.add(mapJoinedRow(rs));
            }
            return reports;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to list all reports", ex);
        }
    }

    /**
     * Enforces ownership before deleting a resume and its cascaded analysis report.
     */
    public boolean deleteByReportIdAndUserId(long reportId, long userId) throws DatabaseOperationException {
        final String sql = """
            DELETE FROM resumes
            WHERE user_id = ? AND id IN (SELECT resume_id FROM analysis_reports WHERE id = ?)
            """;
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.setLong(2, reportId);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to delete owned resume/report", ex);
        }
    }

    /**
     * Permanently purges all resumes and cascaded reports owned by the given user.
     */
    public int purgeAllByUserId(long userId) throws DatabaseOperationException {
        final String sql = "DELETE FROM resumes WHERE user_id = ?";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            return ps.executeUpdate();
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to purge user resumes", ex);
        }
    }

    /**
     * Automated privacy TTL cleanup removing all resumes whose expires_at timestamp has passed.
     */
    public int deleteExpiredResumes(Instant now) throws DatabaseOperationException {
        final String sql = "DELETE FROM resumes WHERE expires_at IS NOT NULL AND expires_at <= ?";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setTimestamp(1, Timestamp.from(now));
            return ps.executeUpdate();
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to purge expired resumes", ex);
        }
    }

    @Override
    public boolean deleteById(Long id) throws DatabaseOperationException {
        final String sql = "DELETE FROM analysis_reports WHERE id = ?";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to delete report by id", ex);
        }
    }

    private int scoreOf(AnalysisReport report, String key) {
        CategoryScore cs = report.getCategoryScores().get(key);
        return cs != null ? cs.getScore() : 0;
    }

    private AnalysisReport mapJoinedRow(ResultSet rs) throws SQLException {
        AnalysisReport report = new AnalysisReport();
        report.setId(rs.getLong("report_id"));
        report.setResumeId(rs.getLong("resume_id"));
        report.setOwnerUserId(rs.getLong("user_id"));
        report.setFileName(rs.getString("filename"));
        report.setPiiItemsMasked(rs.getInt("pii_items_masked"));
        report.setRetentionPolicy(RetentionPolicy.fromString(rs.getString("retention_policy")));
        Timestamp exp = rs.getTimestamp("expires_at");
        if (exp != null) {
            report.setExpiresAt(exp.toInstant());
        }
        report.setTargetRole(rs.getString("target_role"));
        report.setEngineMode(EngineMode.fromString(rs.getString("engine_mode")));
        report.setOverallScore(rs.getInt("overall_score"));
        report.setScoreLabel(rs.getString("score_label"));

        Map<String, CategoryScore> scores = new LinkedHashMap<>();
        scores.put("atsParsability", new CategoryScore("ATS Parsability & Structure", rs.getInt("parsability_score"), 0.25, ""));
        scores.put("quantifiableImpact", new CategoryScore("Quantifiable Impact (XYZ)", rs.getInt("impact_score"), 0.25, ""));
        scores.put("actionVerbs", new CategoryScore("Action Verbs & Ownership", rs.getInt("action_verb_score"), 0.15, ""));
        scores.put("keywordMatch", new CategoryScore("Keyword & Skill Alignment", rs.getInt("keyword_score"), 0.20, ""));
        scores.put("formattingReadability", new CategoryScore("Formatting & Readability", rs.getInt("formatting_score"), 0.15, ""));
        report.setCategoryScores(scores);

        report.setAnalysisTimeMs(rs.getLong("analysis_time_ms"));
        report.setSummaryJson(rs.getString("summary_json"));
        report.setCreatedAt(rs.getTimestamp("created_at").toInstant());
        return report;
    }
}
