-- CareerPulse Relational Database Schema
-- Compatible with MySQL 8.0+ and H2 (MODE=MySQL)

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'CANDIDATE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resumes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    detected_format VARCHAR(80) NOT NULL,
    redacted_content TEXT NOT NULL,
    pii_items_masked INT NOT NULL DEFAULT 0,
    retention_policy VARCHAR(32) NOT NULL DEFAULT 'HOURS_24',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resumes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analysis_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id BIGINT NOT NULL,
    target_role VARCHAR(180) NOT NULL,
    engine_mode VARCHAR(32) NOT NULL DEFAULT 'DETERMINISTIC_LOCAL',
    overall_score INT NOT NULL,
    score_label VARCHAR(64) NOT NULL,
    parsability_score INT NOT NULL,
    impact_score INT NOT NULL,
    action_verb_score INT NOT NULL,
    keyword_score INT NOT NULL,
    formatting_score INT NOT NULL,
    analysis_time_ms BIGINT NOT NULL DEFAULT 0,
    summary_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS benchmark_runs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dataset_size INT NOT NULL,
    mae DOUBLE NOT NULL,
    band_accuracy_pct DOUBLE NOT NULL,
    spearman_rho DOUBLE NOT NULL,
    p50_latency_ms DOUBLE NOT NULL,
    p95_latency_ms DOUBLE NOT NULL,
    details_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_access_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(64) NOT NULL,
    resource_id VARCHAR(120) NULL,
    details VARCHAR(512) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_expires_at ON resumes(expires_at);
CREATE INDEX IF NOT EXISTS idx_reports_resume_id ON analysis_reports(resume_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_access_logs(user_id);
