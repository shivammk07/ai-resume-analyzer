package com.careerpulse.dao;

import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.model.BenchmarkModels.BenchmarkResult;
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import com.careerpulse.util.JsonSupport;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * JDBC DAO persisting reproducible ATS benchmark validation runs.
 */
public class JdbcBenchmarkDao implements GenericDao<BenchmarkSummary, Long> {
    private static final Type RESULT_LIST_TYPE = new TypeToken<List<BenchmarkResult>>() {}.getType();

    private final DatabaseConnectionManager connectionManager;

    public JdbcBenchmarkDao(DatabaseConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    @Override
    public BenchmarkSummary save(BenchmarkSummary summary) throws DatabaseOperationException {
        final String sql = """
            INSERT INTO benchmark_runs (
                dataset_size, mae, band_accuracy_pct, spearman_rho,
                p50_latency_ms, p95_latency_ms, details_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, summary.getDatasetSize());
            ps.setDouble(2, summary.getMeanAbsoluteError());
            ps.setDouble(3, summary.getBandAccuracyPct());
            ps.setDouble(4, summary.getSpearmanRho());
            ps.setDouble(5, summary.getP50LatencyMs());
            ps.setDouble(6, summary.getP95LatencyMs());
            ps.setString(7, JsonSupport.gson().toJson(summary.getResults()));
            ps.setTimestamp(8, Timestamp.from(summary.getRunTimestamp()));
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    summary.setId(keys.getLong(1));
                }
            }
            return summary;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to save benchmark run", ex);
        }
    }

    @Override
    public Optional<BenchmarkSummary> findById(Long id) throws DatabaseOperationException {
        final String sql = "SELECT * FROM benchmark_runs WHERE id = ?";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
                return Optional.empty();
            }
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to fetch benchmark run by id", ex);
        }
    }

    @Override
    public List<BenchmarkSummary> findAll() throws DatabaseOperationException {
        final String sql = "SELECT * FROM benchmark_runs ORDER BY created_at DESC LIMIT 20";
        List<BenchmarkSummary> runs = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                runs.add(mapRow(rs));
            }
            return runs;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to list benchmark runs", ex);
        }
    }

    @Override
    public boolean deleteById(Long id) throws DatabaseOperationException {
        final String sql = "DELETE FROM benchmark_runs WHERE id = ?";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to delete benchmark run", ex);
        }
    }

    private BenchmarkSummary mapRow(ResultSet rs) throws SQLException {
        List<BenchmarkResult> results = JsonSupport.gson().fromJson(rs.getString("details_json"), RESULT_LIST_TYPE);
        BenchmarkSummary summary = new BenchmarkSummary(
            rs.getInt("dataset_size"),
            rs.getDouble("mae"),
            rs.getDouble("band_accuracy_pct"),
            rs.getDouble("spearman_rho"),
            rs.getDouble("p50_latency_ms"),
            rs.getDouble("p95_latency_ms"),
            results != null ? results : Collections.emptyList()
        );
        summary.setId(rs.getLong("id"));
        summary.setRunTimestamp(rs.getTimestamp("created_at").toInstant());
        return summary;
    }
}
