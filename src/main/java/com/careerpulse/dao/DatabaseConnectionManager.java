package com.careerpulse.dao;

import com.careerpulse.exception.DatabaseOperationException;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.stream.Collectors;

/**
 * Central JDBC connection manager supporting MySQL 8 as primary production RDBMS
 * (configured exclusively via DB_URL, DB_USER, DB_PASSWORD environment variables)
 * with automatic fallback to embedded H2 in MySQL compatibility mode for zero-setup
 * evaluation and JUnit 5 integration testing.
 */
public class DatabaseConnectionManager {
    private static final String DEFAULT_H2_URL =
        "jdbc:h2:mem:careerpulse;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
    private static final String DEFAULT_H2_USER = "sa";
    private static final String DEFAULT_H2_PASSWORD = "";

    private final String jdbcUrl;
    private final String username;
    private final String password;
    private final String activeDriver;
    private volatile boolean schemaInitialized = false;

    private static volatile DatabaseConnectionManager defaultInstance;

    public DatabaseConnectionManager(String jdbcUrl, String username, String password) {
        this.jdbcUrl = jdbcUrl;
        this.username = username;
        this.password = password;
        this.activeDriver = jdbcUrl != null && jdbcUrl.startsWith("jdbc:mysql:")
            ? "MySQL 8"
            : "H2 (MySQL Compatibility Mode)";
    }

    public static DatabaseConnectionManager getDefault() throws DatabaseOperationException {
        if (defaultInstance == null) {
            synchronized (DatabaseConnectionManager.class) {
                if (defaultInstance == null) {
                    String envUrl = System.getenv("DB_URL");
                    String envUser = System.getenv("DB_USER");
                    String envPassword = System.getenv("DB_PASSWORD");

                    DatabaseConnectionManager candidate;
                    if (envUrl != null && !envUrl.isBlank() && envUser != null && !envUser.isBlank()) {
                        candidate = new DatabaseConnectionManager(envUrl.trim(), envUser.trim(), envPassword != null ? envPassword : "");
                        try (Connection ignored = candidate.openRawConnection()) {
                            candidate.initializeSchemaIfNeeded();
                            defaultInstance = candidate;
                            return defaultInstance;
                        } catch (SQLException ex) {
                            // Graceful fallback to H2 in-memory MySQL mode when external MySQL is unreachable
                            System.err.println("[CareerPulse JDBC] MySQL unreachable (" + ex.getMessage()
                                + "); activating H2 MySQL-compatibility fallback.");
                        }
                    }

                    candidate = new DatabaseConnectionManager(DEFAULT_H2_URL, DEFAULT_H2_USER, DEFAULT_H2_PASSWORD);
                    candidate.initializeSchemaIfNeeded();
                    defaultInstance = candidate;
                }
            }
        }
        return defaultInstance;
    }

    public static DatabaseConnectionManager createInMemoryTestManager(String dbName) throws DatabaseOperationException {
        String url = "jdbc:h2:mem:" + dbName + ";MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        DatabaseConnectionManager mgr = new DatabaseConnectionManager(url, DEFAULT_H2_USER, DEFAULT_H2_PASSWORD);
        mgr.initializeSchemaIfNeeded();
        return mgr;
    }

    public Connection getConnection() throws DatabaseOperationException {
        initializeSchemaIfNeeded();
        try {
            return openRawConnection();
        } catch (SQLException ex) {
            throw new DatabaseOperationException("Failed to open JDBC connection (" + activeDriver + ")", ex);
        }
    }

    private Connection openRawConnection() throws SQLException {
        loadDriverClass();
        return DriverManager.getConnection(jdbcUrl, username, password);
    }

    private void loadDriverClass() {
        try {
            if (jdbcUrl.startsWith("jdbc:mysql:")) {
                Class.forName("com.mysql.cj.jdbc.Driver");
            } else if (jdbcUrl.startsWith("jdbc:h2:")) {
                Class.forName("org.h2.Driver");
            }
        } catch (ClassNotFoundException ignored) {
            // DriverManager ServiceLoader handles modern JDBC 4+ drivers automatically
        }
    }

    public synchronized void initializeSchemaIfNeeded() throws DatabaseOperationException {
        if (schemaInitialized) {
            return;
        }
        try (Connection conn = openRawConnection();
             Statement stmt = conn.createStatement()) {
            String ddl = loadSchemaSql();
            for (String rawStatement : ddl.split(";")) {
                String cleaned = rawStatement.replaceAll("(?m)^--.*$", "").trim();
                if (!cleaned.isEmpty()) {
                    stmt.execute(cleaned);
                }
            }
            schemaInitialized = true;
        } catch (Exception ex) {
            throw new DatabaseOperationException("Failed to initialize relational schema via JDBC", ex);
        }
    }

    private String loadSchemaSql() throws DatabaseOperationException {
        try (InputStream is = DatabaseConnectionManager.class.getResourceAsStream("/schema.sql")) {
            if (is == null) {
                throw new DatabaseOperationException("Could not locate /schema.sql on classpath");
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                return reader.lines().collect(Collectors.joining("\n"));
            }
        } catch (DatabaseOperationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new DatabaseOperationException("Unable to read /schema.sql", ex);
        }
    }

    public String getActiveDriver() {
        return activeDriver;
    }

    public String getJdbcUrlSanitized() {
        if (jdbcUrl == null) return "";
        int queryIdx = jdbcUrl.indexOf('?');
        return queryIdx > 0 ? jdbcUrl.substring(0, queryIdx) : jdbcUrl;
    }
}
