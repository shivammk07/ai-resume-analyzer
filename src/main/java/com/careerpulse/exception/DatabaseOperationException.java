package com.careerpulse.exception;

/**
 * Checked exception wrapping JDBC / relational database persistence errors.
 */
public class DatabaseOperationException extends CareerPulseException {
    public DatabaseOperationException(String message) {
        super(message);
    }

    public DatabaseOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
