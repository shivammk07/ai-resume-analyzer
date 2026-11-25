# CareerPulse — Core Java 17, JDBC, Jakarta EE 10 & Swing ATS Audit Platform

**Team Moshdi · Project Lead: Shivam Kumar**

CareerPulse is a privacy-first, offline-capable Applicant Tracking System (ATS) resume auditing platform built with **Core Java 17 OOP**, **JDBC + DAO persistence (MySQL 8 with automatic H2 fallback)**, **Jakarta EE 10 Servlets & JSP (Apache Tomcat 10+)**, and a **Java Swing Desktop GUI**, accompanied by a live **React + TypeScript** preview companion.

It operates **offline-first via a deterministic 5-dimension ATS scoring engine** (zero external API key required), validates scoring calibration against a **12-resume independently annotated benchmark corpus**, enforces **automated PII redaction and configurable TTL data retention**, and ships with automated **JUnit 5 + Mockito**, **Checkstyle**, **Javadoc**, and **GitHub Actions CI**.

---

## Academic Rubric Alignment Matrix

| Evaluation Area | Implementation Highlights | Verification Artifact |
| :--- | :--- | :--- |
| **Core Java Concepts** | `Analyzable` interface -> `AbstractDocument` -> `ResumeDocument` / `JobDescriptionDocument`; 5 polymorphic `ScoringCriterion` strategies; `Map`, `Set`, `List`, `PriorityQueue`; custom exception hierarchy | `CoreJavaOopAndRedactionTest`, `DeterministicScoringEngineTest` |
| **Database Integration (JDBC)** | 5 normalized tables (`schema.sql`), `DatabaseConnectionManager` (MySQL 8 primary + H2 fallback), `GenericDao<T, ID>`, parameterized `PreparedStatement`, atomic commit/rollback transactions | `JdbcDaoIntegrationTest`, `docs/ARCHITECTURE_UML.md` |
| **Servlet & Web Integration** | 5 Jakarta EE 10 Servlets (`AuthServlet`, `ResumeUploadServlet`, `AnalysisHistoryServlet`, `BenchmarkServlet`, `PrivacyPurgeServlet`), `SecurityAndPrivacyFilter` (CSRF + CSP headers), 6 JSTL-escaped JSP views | `ServletControllerTest`, `target/careerpulse.war` |
| **Java GUI Execution** | Modular 4-tab Java Swing Desktop Application (`CareerPulseDesktopApp`, `DesktopAuditController`, `SwingTableModels`) with non-blocking `SwingWorker` execution sharing the exact Core Java + JDBC layer | `SwingGuiModelTest`, `mvn compile exec:java` |
| **Code Quality & Testing** | Checkstyle ruleset (`config/checkstyle/checkstyle.xml`), Javadoc coverage, 6 JUnit 5 + Mockito suites, Node integration test suite, GitHub Actions CI | `.github/workflows/ci.yml`, `mvn checkstyle:check` |
| **Teamwork & Collaboration** | Explicit Team Moshdi module roles, semantic commit history, `CONTRIBUTING.md`, Pull Request template, Bug & Feature Issue templates | `CONTRIBUTING.md`, `.github/` |
| **Innovation / Extra Effort** | Dual Web + Swing clients, offline deterministic engine (0.17 ms p50), 12-resume empirical benchmark (100% band accuracy, 0.981 Spearman rho), automated PII redaction & TTL purge | `docs/VALIDATION_METHODOLOGY.md`, `docs/PRIVACY_AND_SECURITY.md`, `docs/CareerPulse_Java_Enterprise_Presentation.pptx` |

---

## Team Moshdi — Collaboration & Module Ownership

| Role | Lead / Track | Delivered Components |
| :--- | :--- | :--- |
| **Project Lead & Core Architect** | **Shivam Kumar** | Core Java 17 OOP hierarchy, 5-strategy `ResumeAnalyzerService`, Maven + Checkstyle + CI architecture, final integration & presentation |
| **Database & JDBC Engineering** | **Team Moshdi — JDBC Track** | 5-table relational schema (`schema.sql`), `DatabaseConnectionManager` (MySQL 8 + H2 fallback), transactional `JdbcAnalysisReportDao`, `JdbcUserDao`, `JdbcBenchmarkDao`, `JdbcAuditLogDao` |
| **Web Servlets & Swing GUI** | **Team Moshdi — UI & Web Track** | Jakarta EE 10 Servlets, `SecurityAndPrivacyFilter`, JSTL JSP views, and 4-tab Java Swing Desktop GUI (`com.careerpulse.gui`) |
| **QA, Benchmarks & Privacy** | **Team Moshdi — QA & Security Track** | 12-resume `BenchmarkValidator`, `RegexPiiRedactor`, PBKDF2 `PasswordHasher`, 6 JUnit 5 + Mockito suites, Node tests |

See [CONTRIBUTING.md](CONTRIBUTING.md) for branching standards, Checkstyle rules, and PR review guidelines.

---

## Architecture & Documentation Index

- **[Architecture & UML Diagrams](docs/ARCHITECTURE_UML.md)** — Component, OOP Class, 5-Table ER, and Transaction Sequence diagrams.
- **[Validation Methodology](docs/VALIDATION_METHODOLOGY.md)** — 12-resume labeled corpus (100% Band Accuracy, 6.08 MAE, 0.981 Spearman $\rho$, 0.17 ms p50 / 1.36 ms p95 latency) and diagnostic scope disclaimer.
- **[Privacy & Security Governance](docs/PRIVACY_AND_SECURITY.md)** — Regex PII masking, PBKDF2-SHA256 hashing, owner-scoped JDBC queries, CSRF/CSP protection, and TTL retention purge.
- **[Project Presentation Deck](docs/CareerPulse_Java_Enterprise_Presentation.pptx)** — 12-slide rubric presentation synchronized with this repository.

---

## Quick Start — Java 17, Tomcat 10+ & Swing GUI

### Prerequisites
- **Java 17+** (`java -version`) and **Apache Maven 3.9+** (`mvn -version`)
- Optional: **MySQL 8** (configure `DB_URL`, `DB_USER`, `DB_PASSWORD` from `.env.example`; otherwise embedded **H2 in MySQL compatibility mode** starts automatically)
- Optional: **Apache Tomcat 10.1+** (Jakarta EE 10) for WAR deployment

### 1. Run Checkstyle, JUnit 5 + Mockito Tests, Javadoc & Package WAR
```bash
mvn checkstyle:check
mvn clean test package
mvn javadoc:javadoc
```
Deploy `target/careerpulse.war` into `$CATALINA_HOME/webapps/` and open `http://localhost:8080/careerpulse/`.

### 2. Launch the Java Swing Desktop GUI
```bash
mvn compile exec:java
```
Launches `com.careerpulse.gui.CareerPulseDesktopApp` with 4 tabs (`Resume Analyzer`, `Saved History (JDBC)`, `Validation Lab`, `Privacy & PII Inspector`).

---

## Quick Start — Live Web Preview (React + TypeScript)

```bash
npm install
npm run test    # Verifies PII masking, deterministic engine, 12-resume benchmark & owner isolation
npm run lint    # TypeScript strict type-check
npm run dev     # Starts live preview at http://localhost:3000
```

To regenerate the 12-slide presentation deck from verified metrics:
```bash
npx tsx scripts/generate_pptx.ts
```
