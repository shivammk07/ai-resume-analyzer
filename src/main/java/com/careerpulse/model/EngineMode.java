package com.careerpulse.model;

/**
 * Scoring execution mode: local offline deterministic rules (default) or optional AI-assisted enrichment.
 */
public enum EngineMode {
    DETERMINISTIC_LOCAL("Deterministic Local Engine (Offline)"),
    AI_ASSISTED("Deterministic + Optional AI Enrichment");

    private final String displayName;

    EngineMode(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static EngineMode fromString(String value) {
        if (value == null || value.isBlank()) {
            return DETERMINISTIC_LOCAL;
        }
        String normalized = value.trim().toUpperCase();
        if ("AI".equals(normalized) || "AI_ASSISTED".equals(normalized)) {
            return AI_ASSISTED;
        }
        return DETERMINISTIC_LOCAL;
    }
}
