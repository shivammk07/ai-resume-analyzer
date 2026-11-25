# Contributing to CareerPulse — Team Moshdi Engineering Guide

Welcome to the **CareerPulse** repository (**Team Moshdi**, led by **Shivam Kumar**). This document defines our coding standards, branching model, code-review workflow, and quality gates across the Java 17 / JDBC / Jakarta EE / Swing and live preview codebases.

---

## Team Moshdi Module Ownership

| Role | Contributor | Primary Modules & Responsibilities |
| :--- | :--- | :--- |
| **Project Lead & Core Architect** | **Shivam Kumar** | Core Java 17 OOP domain model (`Analyzable`, `AbstractDocument`), 5-strategy `ResumeAnalyzerService`, Checkstyle & Maven build architecture, system integration |
| **Database & Persistence Lead** | **Team Moshdi — JDBC Track** | Normalized 5-table SQL schema (`schema.sql`), `DatabaseConnectionManager` (MySQL 8 + H2 fallback), atomic `JdbcAnalysisReportDao`, `JdbcUserDao`, `JdbcBenchmarkDao` |
| **Web & Desktop UI Lead** | **Team Moshdi — Servlet & Swing Track** | Jakarta EE 10 Servlets (`AuthServlet`, `ResumeUploadServlet`, `AnalysisHistoryServlet`, `BenchmarkServlet`, `PrivacyPurgeServlet`), `SecurityAndPrivacyFilter`, JSTL JSP views, and Java Swing Desktop GUI (`CareerPulseDesktopApp`) |
| **QA, Validation & Privacy Lead** | **Team Moshdi — QA & Security Track** | 12-resume labeled `BenchmarkValidator`, `RegexPiiRedactor`, PBKDF2 `PasswordHasher`, JUnit 5 + Mockito suites, Node integration tests, GitHub Actions CI |

---

## Coding Standards & Quality Gates

1. **Java 17 & Checkstyle (`config/checkstyle/checkstyle.xml`)**:
   - Use 4-space indentation (no tab characters).
   - No wildcard (`*`) imports.
   - Include class-level Javadoc on all public classes/interfaces and `@param` / `@return` / `@throws` on public service and DAO methods.
   - Always annotate overridden methods with `@Override`.
   - Use parameterized `PreparedStatement` for every JDBC query—never concatenate user input into SQL.
2. **Security & Privacy Hygiene**:
   - Never commit `.env` files, API keys, database passwords, or raw candidate PII.
   - Escape all JSP dynamic output using JSTL `<c:out value="${...}"/>`.
   - Enforce owner-scoped queries (`WHERE user_id = ?`) on all report reads and deletions.
3. **Required Pre-PR Checks**:
   ```bash
   mvn checkstyle:check
   mvn clean test package
   npm run lint && npm run test && npm run build
   ```

---

## Git Branching & Semantic Commit Workflow

- **Default Branch**: `main` (always buildable and CI-green).
- **Feature Branches**: `feat/<module>-<short-slug>`, `fix/<issue>-<short-slug>`, `docs/<topic>`.
- **Conventional Commits**:
  - `feat(core-java): add polymorphic QuantifiableImpactScorer`
  - `feat(jdbc-dao): implement atomic transaction rollback in JdbcAnalysisReportDao`
  - `feat(jakarta-web): enforce CSRF verification in SecurityAndPrivacyFilter`
  - `feat(swing-gui): add 4-tab CareerPulseDesktopApp with SwingWorker`
  - `test(benchmarks): validate 12-resume corpus MAE and Spearman correlation`
  - `docs(architecture): add UML class, ERD, and sequence diagrams`
- **Pull Request Reviews**: Complete the checklist in `.github/PULL_REQUEST_TEMPLATE.md` and confirm GitHub Actions CI passes before merging.
