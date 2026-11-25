package com.careerpulse.exception;

/**
 * Unchecked security exception thrown when a caller attempts to access or delete
 * a resume or report owned by another user.
 */
public class UnauthorizedAccessException extends RuntimeException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
