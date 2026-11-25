package com.careerpulse.model;

import java.time.Duration;
import java.time.Instant;

/**
 * User-selectable data retention window governing automatic purge of stored resumes.
 */
public enum RetentionPolicy {
    EPHEMERAL("Do Not Store (Session Only)", Duration.ZERO),
    HOURS_24("Auto-Purge After 24 Hours", Duration.ofHours(24)),
    DAYS_7("Auto-Purge After 7 Days", Duration.ofDays(7));

    private final String label;
    private final Duration duration;

    RetentionPolicy(String label, Duration duration) {
        this.label = label;
        this.duration = duration;
    }

    public String getLabel() {
        return label;
    }

    public Duration getDuration() {
        return duration;
    }

    public boolean isPersistent() {
        return this != EPHEMERAL;
    }

    public Instant computeExpiry(Instant from) {
        if (!isPersistent()) {
            return from;
        }
        return from.plus(duration);
    }

    public static RetentionPolicy fromString(String value) {
        if (value == null || value.isBlank()) {
            return HOURS_24;
        }
        try {
            return RetentionPolicy.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return HOURS_24;
        }
    }
}
