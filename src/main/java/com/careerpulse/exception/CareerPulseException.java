package com.careerpulse.exception;

/**
 * Base checked exception for all CareerPulse domain and processing errors.
 */
public class CareerPulseException extends Exception {
    public CareerPulseException(String message) {
        super(message);
    }

    public CareerPulseException(String message, Throwable cause) {
        super(message, cause);
    }
}
