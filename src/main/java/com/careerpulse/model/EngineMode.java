package com.careerpulse.model;

/**
 * Scoring execution mode for CareerPulse. Operates strictly via local offline
 * deterministic rules with zero external API key dependencies.
 */
public enum EngineMode {
    DETERMINISTIC_LOCAL("Deterministic Local Engine (Offline · Zero API Key)");

    private final String displayName;

    EngineMode(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Returns the human-readable display label for UI and report output.
     *
     * @return formatted engine display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Safely resolves an input string to {@link #DETERMINISTIC_LOCAL}.
     *
     * @param value optional mode parameter
     * @return {@link #DETERMINISTIC_LOCAL}
     */
    public static EngineMode fromString(String value) {
        return DETERMINISTIC_LOCAL;
    }
}
