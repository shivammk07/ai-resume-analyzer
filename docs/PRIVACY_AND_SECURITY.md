# Privacy, Retention & Access-Control Safeguards

Uploaded resumes frequently contain sensitive Personally Identifiable Information (PII), including full names, email addresses, telephone numbers, residential street addresses, government identifiers (SSNs), and dates of birth. CareerPulse documents and enforces the following testable safeguards across its Standalone CLI Tester, Java Swing Desktop GUI, and Jakarta EE 10 / JDBC web application—with **zero external API calls**.

## 1. Automated PII Redaction (Pre-Analysis & Pre-Persistence)
- **Implementation**: `RegexPiiRedactor` intercepts uploaded or pasted resume content prior to scoring and prior to any relational database write. Because CareerPulse operates 100% offline with zero external LLM APIs, candidate resume data never leaves the local JVM or configured MySQL/H2 database.
- **Masked Categories**:
  - Social Security / Tax IDs (`\b\d{3}-\d{2}-\d{4}\b` -> `[REDACTED_SSN]`)
  - Email Addresses (`[REDACTED_EMAIL]`)
  - Phone Numbers (`[REDACTED_PHONE]`)
  - Residential Street Addresses (`[REDACTED_ADDRESS]`)
  - Date of Birth labels (`[REDACTED_DOB]`)
- **Non-Destructive ATS Scoring**: `AtsParsabilityScorer` explicitly recognizes `[REDACTED_EMAIL]` and `[REDACTED_PHONE]` placeholders so privacy redaction never penalizes a candidate's contact-completeness score.

## 2. Explicit Retention Consent & Automatic TTL Expiration
- Candidates select their retention preference before analysis:
  1. **`EPHEMERAL` (Do Not Store)**: Analyzed in memory only; zero rows written to `resumes` or `analysis_reports`.
  2. **`HOURS_24` (Default)**: Stored in redacted form with `expires_at = created_at + 24 hours`.
  3. **`DAYS_7`**: Stored in redacted form with `expires_at = created_at + 7 days`.
- **Automatic Purge**: Expired rows are deleted via parameterized SQL (`DELETE FROM resumes WHERE expires_at IS NOT NULL AND expires_at <= ?`) on filter cadence, history loads, and explicit cleanup actions, with foreign-key `ON DELETE CASCADE` removing associated `analysis_reports`.
- **One-Click Purge All**: Users can permanently delete individual reports or all personal records immediately via `/privacy` (`PrivacyPurgeServlet` / `POST /api/privacy/purge-all`).

## 3. Access Control, Parameterized SQL & Secure Handling
- **Owner-Scoped Queries**: Every history view (`findByIdAndUserId`) and delete operation (`deleteByReportIdAndUserId`) binds the authenticated session's `user_id` via JDBC `PreparedStatement`, preventing cross-user access.
- **Credential Hygiene**: Passwords are salted and hashed with `PBKDF2WithHmacSHA256` (120,000 iterations) with constant-time verification. Optional database credentials (`DB_URL`, `DB_USER`, `DB_PASSWORD`) are read solely from environment variables, and zero external API keys are required or stored.
- **XSS & CSRF Safeguards**: All JSP views escape dynamic content with JSTL `<c:out>`, POST forms validate per-session CSRF tokens, and responses include `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Cache-Control: no-store`.
- **Audit Logging**: All analysis, report viewing, deletion, purge-all, and TTL cleanup actions are logged in `audit_access_logs`.

## 4. Automated Security & Privacy Verification
- `CoreJavaOopAndRedactionTest`: Verifies redaction of all 5 PII classes while preserving numeric metrics.
- `JdbcDaoIntegrationTest`: Verifies cross-user access denial (`findByIdAndUserId`, `deleteByReportIdAndUserId`) and TTL expiration cascade deletion.
- `ServletControllerTest`: Verifies unauthenticated purge rejection (`401 Unauthorized`) and Java 17 JSON serialization.
- `StandaloneTesterTest`: Verifies zero-API-key offline CLI redaction, JDBC isolation, and TTL purge end-to-end.
