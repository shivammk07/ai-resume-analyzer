# ATS Scoring Validation Methodology & Scope Disclaimer

## 1. Explicit Scope & Non-Recruitment Disclaimer
CareerPulse's ATS score is a **deterministic, rule-based heuristic metric** designed to help candidates audit formatting hygiene, structural completeness, active verb usage, quantified achievement density (Google XYZ formula), and keyword alignment against a target job description.

**Important Limitation**: Neither deterministic heuristic scores nor optional AI-assisted suggestions represent verified recruitment outcomes, recruiter shortlisting probabilities, or guaranteed hiring decisions.

## 2. Five Weighted Deterministic Criteria
The Core Java engine (`ResumeAnalyzerService`) composes five polymorphic `ScoringCriterion` implementations so every score is 100% reproducible offline with zero external API dependency:

| Criterion Class | Weight | Signal Evaluated |
| :--- | :---: | :--- |
| `AtsParsabilityScorer` | 25% | Standard section headers (`Summary`, `Experience`, `Skills`, `Education`), contact signal presence (including redacted placeholders), chronological date ranges, and healthy word count |
| `QuantifiableImpactScorer` | 25% | Proportion of experience bullets containing measurable impact metrics (`%`, `$`, multipliers, throughput, latency, scale) |
| `KeywordAlignmentScorer` | 20% | Set-based keyword recall against extracted target job description skills |
| `ActionVerbScorer` | 15% | Opening strong ownership verbs vs. passive phrasing (`responsible for`, `worked on`, `helped with`) |
| `FormattingReadabilityScorer` | 15% | Structured bullet density, concise bullet length (8–34 words), and absence of dense wall-of-text lines (>55 words) |

## 3. Independently Labeled Benchmark Dataset (12 Resumes, 4 Tiers)
To evaluate scoring calibration objectively, `BenchmarkValidator` (Java) and `benchmarkSuite.ts` (TypeScript) execute the deterministic engine against 12 independently annotated resume examples spanning four distinct quality tiers:

- **Strong (3 resumes — expected 84–100)**: Complete structure, strong active verbs, quantified XYZ metrics, high JD alignment (`BM-01` to `BM-03`).
- **Competitive (3 resumes — expected 66–86)**: Solid ATS structure and skills with moderate metric coverage (`BM-04` to `BM-06`).
- **Developing (3 resumes — expected 39–68)**: Entry-level, career-switcher, or dense narrative resumes with passive verbs or missing metrics/keywords (`BM-07` to `BM-09`).
- **Weak (3 resumes — expected 18–45)**: Unstructured drafts lacking sections, contact metadata, bullets, metrics, and required keywords (`BM-10` to `BM-12`).

## 4. Quantitative Validation & Performance Metrics
Both `BenchmarkValidationTest` (JUnit 5) and `tests/careerpulse.test.ts` (Node test runner) automatically assert:
1. **Mean Absolute Error (MAE)**: Average absolute point difference between system score and human rubric score ($\le 10.0$ points).
2. **Tolerance Band Accuracy**: Percentage of benchmark resumes falling inside their independently annotated human band ($\ge 75\%$).
3. **Spearman Rank Correlation ($\rho$)**: Monotonic rank-order agreement between human quality ordering and engine scores ($\ge 0.85$).
4. **Reproducible Latency (p50 & p95 ms)**: Local deterministic execution latency measured per resume ($p95 < 100\text{ ms}$).
