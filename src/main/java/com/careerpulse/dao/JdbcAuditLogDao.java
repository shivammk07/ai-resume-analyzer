package com.careerpulse.dao;

import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.model.AuditLogEntry;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC DAO recording security and privacy audit events (ANALYZE, VIEW_REPORT, PURGE_RECORD, PURGE_ALL, TTL_CLEANUP).
 */
public class JdbcAuditLogDao implements GenericDao<AuditLogEntry, Long> {
    private final DatabaseConnectionManager connectionManager;

    public JdbcAuditLogDao(DatabaseConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    @Override
    public AuditLogEntry save(AuditLogEntry entry) throws DatabaseOperationException {
        final String sql = "INSERT INTO audit_access_logs (user_id, action, resource_id, details, created_at) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            if (entry.getUserId() != null) {
                ps.setLong(1, entry.getUserId());
            } else {
                ps.setNull(1, Types.BIGINT);
            }
            ps.setString(2, entry.getAction());
            ps.setString(3, entry.getResourceId());
            ps.setString(4, entry.getDetails());
            ps.setTimestamp(5, Timestamp.from(entry.getCreatedAt()));
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    entry.setId(keys.getLong(1));
                }
            }
            return entry;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to write audit log entry", ex);
        }
    }

    public List<AuditLogEntry> findByUserId(long userId) throws DatabaseOperationException {
        final String sql = "SELECT id, user_id, action, resource_id, details, created_at FROM audit_access_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";
        List<AuditLogEntry> logs = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    logs.add(mapRow(rs));
                }
            }
            return logs;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to fetch audit logs for user", ex);
        }
    }

    @Override
    public Optional<AuditLogEntry> findById(Long id) throws DatabaseOperationException {
        final String sql = "SELECT id, user_id, action, resource_id, details, created_at FROM audit_access_logs WHERE id = ?";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(mapRow(rs)) : Optional.empty();
            }
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to fetch audit log entry", ex);
        }
    }

    @Override
    public List<AuditLogEntry> findAll() throws DatabaseOperationException {
        final String sql = "SELECT id, user_id, action, resource_id, details, created_at FROM audit_access_logs ORDER BY created_at DESC LIMIT 100";
        List<AuditLogEntry> logs = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                logs.add(mapRow(rs));
            }
            return logs;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to list audit logs", ex);
        }
    }

    @Override
    public boolean deleteById(Long id) throws DatabaseOperationException {
        final String sql = "DELETE FROM audit_access_logs WHERE id = ?";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to delete audit log entry", ex);
        }
    }

    private AuditLogEntry mapRow(ResultSet rs) throws SQLException {
        long uid = rs.getLong("user_id");
        Long nullableUid = rs.wasNull() ? null : uid;
        return new AuditLogEntry(
            rs.getLong("id"),
            nullableUid,
            rs.getString("action"),
            rs.getString("resource_id"),
            rs.getString("details"),
            rs.getTimestamp("created_at").toInstant()
        );
    }
}
