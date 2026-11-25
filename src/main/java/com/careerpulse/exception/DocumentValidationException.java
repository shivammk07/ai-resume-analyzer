package com.careerpulse.exception;

/**
 * Checked exception raised when an uploaded resume or job description fails input validation.
 */
public class DocumentValidationException extends CareerPulseException {
    public DocumentValidationException(String message) {
        super(message);
    }
}
