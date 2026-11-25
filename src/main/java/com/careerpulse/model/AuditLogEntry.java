package com.careerpulse.model;

import java.time.Instant;

/**
 * Immutable privacy and security audit log record persisted via JDBC.
 */
public class AuditLogEntry {
    private Long id;
    private Long userId;
    private String action;
    private String resourceId;
    private String details;
    private Instant createdAt;

    public AuditLogEntry(Long userId, String action, String resourceId, String details) {
        this.userId = userId;
        this.action = action;
        this.resourceId = resourceId;
        this.details = details;
        this.createdAt = Instant.now();
    }

    public AuditLogEntry(Long id, Long userId, String action, String resourceId, String details, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.action = action;
        this.resourceId = resourceId;
        this.details = details;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public String getAction() { return action; }
    public String getResourceId() { return resourceId; }
    public String getDetails() { return details; }
    public Instant getCreatedAt() { return createdAt; }
}
