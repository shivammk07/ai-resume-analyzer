package com.careerpulse.dao;

import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.model.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC DAO implementation for {@link User} persistence using parameterized PreparedStatements.
 */
public class JdbcUserDao implements GenericDao<User, Long> {
    private final DatabaseConnectionManager connectionManager;

    public JdbcUserDao(DatabaseConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    @Override
    public User save(User user) throws DatabaseOperationException {
        final String sql = "INSERT INTO users (email, display_name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, user.getEmail().trim().toLowerCase());
            ps.setString(2, user.getDisplayName().trim());
            ps.setString(3, user.getPasswordHash());
            ps.setString(4, user.getRole().name());
            ps.setTimestamp(5, Timestamp.from(user.getCreatedAt()));

            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    user.setId(keys.getLong(1));
                }
            }
            return user;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to persist user account", ex);
        }
    }

    public Optional<User> findByEmail(String email) throws DatabaseOperationException {
        final String sql = "SELECT id, email, display_name, password_hash, role, created_at FROM users WHERE email = ?";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
                return Optional.empty();
            }
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to query user by email", ex);
        }
    }

    @Override
    public Optional<User> findById(Long id) throws DatabaseOperationException {
        final String sql = "SELECT id, email, display_name, password_hash, role, created_at FROM users WHERE id = ?";
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
            throw new DatabaseOperationException("Failed to find user by id", ex);
        }
    }

    @Override
    public List<User> findAll() throws DatabaseOperationException {
        final String sql = "SELECT id, email, display_name, password_hash, role, created_at FROM users ORDER BY created_at DESC";
        List<User> list = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
            return list;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to list users", ex);
        }
    }

    @Override
    public boolean deleteById(Long id) throws DatabaseOperationException {
        final String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to delete user", ex);
        }
    }

    private User mapRow(ResultSet rs) throws SQLException {
        return new User(
            rs.getLong("id"),
            rs.getString("email"),
            rs.getString("display_name"),
            rs.getString("password_hash"),
            User.Role.valueOf(rs.getString("role")),
            rs.getTimestamp("created_at").toInstant()
        );
    }
}
