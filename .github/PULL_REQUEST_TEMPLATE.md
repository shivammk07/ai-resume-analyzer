## Summary

<!-- Briefly describe what this pull request changes and why. -->

## Architectural Module(s) Touched

- [ ] Core Java 17 OOP & Deterministic Scoring Engine (`com.careerpulse.model`, `com.careerpulse.engine`)
- [ ] JDBC Persistence & SQL Schema (`com.careerpulse.dao`, `schema.sql`)
- [ ] Jakarta EE 10 Servlets, Filter & JSP Views (`com.careerpulse.web`, `webapp/`)
- [ ] Java Swing Desktop GUI (`com.careerpulse.gui`)
- [ ] Privacy, PII Redaction & Security (`com.careerpulse.privacy`)
- [ ] Automated Tests, Benchmarks & Documentation (`src/test/`, `tests/`, `docs/`)

## Verification Checklist

- [ ] Code follows `config/checkstyle/checkstyle.xml` (no star imports, Javadoc present, clean formatting)
- [ ] All JDBC queries use parameterized `PreparedStatement` with owner-scoped access checks
- [ ] No API keys, credentials, or personal resume PII committed
- [ ] `mvn clean test package` passes (or verified in GitHub Actions CI)
- [ ] `npm run lint && npm run test && npm run build` passes
- [ ] Documentation / UML diagrams updated if interfaces or schemas changed
