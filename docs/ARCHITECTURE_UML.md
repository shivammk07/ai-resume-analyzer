# CareerPulse — Software Architecture & UML Diagrams

**Author:** Team Moshdi (Project Lead: Shivam Kumar)  
**Target Runtime:** Java 17 LTS · Maven 3.9+ · Apache Tomcat 10.1+ (Jakarta EE 10) · MySQL 8 / H2 Fallback

---

## 1. Dual-Client Layered Component Architecture

Both the **Jakarta EE 10 Web Application** (Servlets + JSP) and the **Java Swing Desktop GUI** share the exact same Core Java 17 domain layer, deterministic scoring engine, PII redaction service, and JDBC DAO layer—eliminating logic duplication and demonstrating strict layered MVC architecture.

```mermaid
flowchart TB
    subgraph Clients["Dual Presentation Clients"]
        WEB["Jakarta EE 10 Web Client\n(Tomcat 10+ · 5 Servlets · 6 JSP Views\nSecurityAndPrivacyFilter + CSRF)"]
        GUI["Java Swing Desktop GUI\n(JFrame · JTabbedPane · SwingWorker\nDesktopAuditController + 3 TableModels)"]
    end

    subgraph Core["Core Java 17 Domain & Scoring Engine"]
        SVC["ResumeAnalyzerService\n(Strategy Orchestrator + PriorityQueue)"]
        PII["RegexPiiRedactor\n(SSN · Email · Phone · Address · DOB)"]
        BM["BenchmarkValidator\n(12 Labeled Resumes · MAE · Band% · Rho)"]
        CRIT["5 ScoringCriterion Implementations\nParsability 25% · Impact 25% · Keywords 20%\nAction Verbs 15% · Formatting 15%"]
        AI["GeminiHttpAiEnricher\n(Strictly Opt-In · Env-Only Key)"]
    end

    subgraph Persistence["JDBC & DAO Persistence Layer"]
        MGR["DatabaseConnectionManager\n(MySQL 8 Env Primary + H2 Fallback)"]
        DAO["GenericDao<T, ID>\nJdbcUserDao · JdbcAnalysisReportDao\nJdbcBenchmarkDao · JdbcAuditLogDao"]
    end

    subgraph DB["Normalized Relational Schema (5 Tables)"]
        SQL[("users · resumes · analysis_reports\nbenchmark_runs · audit_access_logs")]
    end

    WEB --> SVC
    WEB --> PII
    WEB --> BM
    WEB --> DAO
    GUI --> SVC
    GUI --> PII
    GUI --> BM
    GUI --> DAO
    SVC --> CRIT
    SVC --> PII
    SVC -. Optional .-> AI
    BM --> SVC
    DAO --> MGR
    MGR --> SQL
```

---

## 2. Core Java OOP Class Diagram (Interfaces, Inheritance & Polymorphism)

```mermaid
classDiagram
    class Analyzable {
        <<interface>>
        +getDocumentType() String
        +getNormalizedContent() String
        +getWordCount() int
        +getTokenFrequencies() Map~String, Integer~
    }

    class AbstractDocument {
        <<abstract>>
        #String normalizedContent
        #Instant createdAt
        +getWordCount() int
        +getTokenFrequencies() Map~String, Integer~
        +getSectionsDetected() Set~String~
    }

    class ResumeDocument {
        -Long id
        -long userId
        -String fileName
        -int piiItemsMasked
        -RetentionPolicy retentionPolicy
        -Instant expiresAt
        +getBulletLines() List~String~
    }

    class JobDescriptionDocument {
        -String targetTitle
        -String seniorityLevel
        -Set~String~ requiredKeywords
        +getRequiredKeywords() Set~String~
    }

    class ScoringCriterion {
        <<interface>>
        +getKey() String
        +getLabel() String
        +getWeight() double
        +evaluate(ResumeDocument, JobDescriptionDocument) CategoryScore
    }

    class AtsParsabilityScorer
    class QuantifiableImpactScorer
    class KeywordAlignmentScorer
    class ActionVerbScorer
    class FormattingReadabilityScorer

    class ResumeAnalyzerService {
        -List~ScoringCriterion~ criteria
        -PiiRedactor piiRedactor
        -OptionalAiEnricher aiEnricher
        +analyze(...) AnalysisBundle
    }

    class FixRecommendation {
        <<Comparable>>
        -Priority priority
        -String section
        -String title
        +compareTo(FixRecommendation) int
    }

    Analyzable <|.. AbstractDocument
    AbstractDocument <|-- ResumeDocument
    AbstractDocument <|-- JobDescriptionDocument
    ScoringCriterion <|.. AtsParsabilityScorer
    ScoringCriterion <|.. QuantifiableImpactScorer
    ScoringCriterion <|.. KeywordAlignmentScorer
    ScoringCriterion <|.. ActionVerbScorer
    ScoringCriterion <|.. FormattingReadabilityScorer
    ResumeAnalyzerService o--> ScoringCriterion : polymorphic list
    ResumeAnalyzerService --> ResumeDocument
    ResumeAnalyzerService --> JobDescriptionDocument
    ResumeAnalyzerService --> FixRecommendation : PriorityQueue
```

---

## 3. Relational Database Entity-Relationship Diagram (JDBC Schema)

Defined in `src/main/resources/schema.sql` and executed identically on **MySQL 8** and **H2 (`MODE=MySQL`)**:

```mermaid
erDiagram
    USERS ||--o{ RESUMES : owns
    RESUMES ||--o{ ANALYSIS_REPORTS : produces
    USERS ||--o{ AUDIT_ACCESS_LOGS : triggers

    USERS {
        BIGINT id PK
        VARCHAR email UK
        VARCHAR display_name
        VARCHAR password_hash
        VARCHAR role
        TIMESTAMP created_at
    }

    RESUMES {
        BIGINT id PK
        BIGINT user_id FK
        VARCHAR filename
        VARCHAR detected_format
        TEXT redacted_content
        INT pii_items_masked
        VARCHAR retention_policy
        TIMESTAMP expires_at
        TIMESTAMP created_at
    }

    ANALYSIS_REPORTS {
        BIGINT id PK
        BIGINT resume_id FK
        VARCHAR target_role
        VARCHAR engine_mode
        INT overall_score
        VARCHAR score_label
        INT parsability_score
        INT impact_score
        INT action_verb_score
        INT keyword_score
        INT formatting_score
        BIGINT analysis_time_ms
        TEXT summary_json
        TIMESTAMP created_at
    }

    BENCHMARK_RUNS {
        BIGINT id PK
        INT dataset_size
        DOUBLE mae
        DOUBLE band_accuracy_pct
        DOUBLE spearman_rho
        DOUBLE p50_latency_ms
        DOUBLE p95_latency_ms
        TEXT details_json
        TIMESTAMP created_at
    }

    AUDIT_ACCESS_LOGS {
        BIGINT id PK
        BIGINT user_id FK
        VARCHAR action
        VARCHAR resource_id
        VARCHAR details
        TIMESTAMP created_at
    }
```

---

## 4. End-to-End Request & Transaction Sequence Diagram

```mermaid
sequenceDiagram
    actor User as Candidate / Evaluator
    participant Filter as SecurityAndPrivacyFilter
    participant Servlet as ResumeUploadServlet (or Swing GUI)
    participant Redactor as RegexPiiRedactor
    participant Engine as ResumeAnalyzerService
    participant DAO as JdbcAnalysisReportDao
    participant DB as MySQL 8 / H2 RDBMS

    User->>Filter: POST /analyze (Resume + JD + CSRF Token + TTL Policy)
    Filter->>Filter: Validate CSRF token & attach CSP/XFO headers
    Filter->>Servlet: Forward authenticated request
    Servlet->>Redactor: redact(rawResumeText)
    Redactor-->>Servlet: RedactionResult (masked tokens + counts)
    Servlet->>Engine: analyze(redactedText, jd, DETERMINISTIC_LOCAL)
    Engine->>Engine: Execute 5 ScoringCriterion strategies & PriorityQueue
    Engine-->>Servlet: AnalysisBundle (scores, gaps, fixes, disclaimer)
    alt retentionPolicy != EPHEMERAL
        Servlet->>DAO: saveResumeAndReportTransaction(resume, report)
        DAO->>DB: BEGIN TX -> INSERT resumes -> INSERT analysis_reports -> COMMIT
        DB-->>DAO: Generated PKs (rollback on SQLException)
    end
    Servlet-->>User: Render report.jsp (JSTL escaped) or update Swing EDT
```
