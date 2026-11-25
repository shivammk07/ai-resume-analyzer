package com.careerpulse.model;

import java.time.Instant;

/**
 * Authenticated user entity for session ownership and role-based access control.
 */
public class User {
    public enum Role {
        CANDIDATE,
        REVIEWER
    }

    private Long id;
    private String email;
    private String displayName;
    private String passwordHash;
    private Role role;
    private Instant createdAt;

    public User() {
        this.role = Role.CANDIDATE;
        this.createdAt = Instant.now();
    }

    public User(Long id, String email, String displayName, String passwordHash, Role role, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.role = role != null ? role : Role.CANDIDATE;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
