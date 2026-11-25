package com.careerpulse.engine;

import com.careerpulse.exception.DocumentValidationException;
import com.careerpulse.model.BenchmarkModels.BenchmarkCase;
import com.careerpulse.model.BenchmarkModels.BenchmarkResult;
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import com.careerpulse.model.EngineMode;
import com.careerpulse.model.RetentionPolicy;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Evaluates the deterministic ATS scoring engine against 12 independently annotated
 * resumes across 4 quality tiers (Weak, Developing, Competitive, Strong) to produce
 * reproducible validation accuracy (MAE, Band Accuracy, Spearman rank correlation)
 * and latency (p50/p95 ms) evidence.
 */
public class BenchmarkValidator {
    private final ResumeAnalyzerService analyzerService;

    public BenchmarkValidator() {
        this(new ResumeAnalyzerService());
    }

    public BenchmarkValidator(ResumeAnalyzerService analyzerService) {
        this.analyzerService = analyzerService;
    }

    public List<BenchmarkCase> getLabeledDataset() {
        return List.of(
            new BenchmarkCase(
                "BM-01", "Senior Java & JDBC Architect (Strong)", "Strong",
                "Senior Java Backend Engineer",
                "Required: Java, JDBC, Servlets, JSP, MySQL, Maven, REST API, JUnit, Docker, SQL, Architecture, Microservices.",
                """
                Priya Nair
                priya.nair@example.com | (415) 555-0192 | linkedin.com/in/priyanair

                SUMMARY
                Principal Java Backend Engineer with 9 years building distributed JDBC persistence layers, Jakarta Servlets, and high-throughput REST APIs on MySQL.

                EXPERIENCE
                Senior Java Architect | FinCore Systems | 2021 - Present
                - Architected Jakarta EE Servlet and JDBC DAO services on MySQL handling 42,000 requests per second with 99.98% uptime.
                - Optimized parameterized SQL queries and connection pooling, reducing p95 checkout latency by 48% ($1.4M annual cloud savings).
                - Automated Maven CI/CD pipelines and 320 JUnit 5 integration tests, cutting regression defects by 63% across 4 teams.
                - Engineered Dockerized microservices and REST API gateways serving 1.8M monthly active users.

                Java Software Engineer | DataGrid Corp | 2017 - 2021
                - Implemented transactional JDBC batch pipelines processing 12M records daily with zero data loss.
                - Led migration from legacy monolith to modular Java 17 architecture, accelerating release velocity by 2.4x.
                - Mentored 6 engineers in clean OOP interfaces, collections optimization, and JSP security escaping.

                SKILLS
                Java 17, Jakarta Servlets, JSP, JDBC, MySQL, H2, Maven, JUnit, REST API, Microservices, Docker, SQL, Git, Architecture

                EDUCATION
                B.S. in Computer Science, State University (2013 - 2017)
                """,
                92, 84, 100,
                "Complete standard sections, strong active verbs, 100% quantified XYZ bullets, and high JD keyword alignment."
            ),
            new BenchmarkCase(
                "BM-02", "Cloud DevOps & SRE Lead (Strong)", "Strong",
                "Site Reliability Engineer",
                "Required: Kubernetes, Docker, Terraform, AWS, Linux, Prometheus, Grafana, CI/CD, Python, Security, Automation.",
                """
                Arjun Mehta
                arjun.mehta@example.com | 512-555-0148 | github.com/arjunmehta

                SUMMARY
                Site Reliability Engineer specializing in AWS Kubernetes clusters, Terraform infrastructure automation, and observability with Prometheus and Grafana.

                EXPERIENCE
                Lead SRE | CloudScale Inc | 2020 - Present
                - Engineered multi-region AWS Kubernetes clusters via Terraform, sustaining 99.99% SLA across 140 production microservices.
                - Automated Docker CI/CD security scanning in Python, reducing mean time to recovery by 54% (from 42 minutes to 19 minutes).
                - Built Prometheus and Grafana SLO dashboards monitoring 85,000 metrics/sec and cutting alert fatigue by 61%.
                - Hardened Linux container hosts and IAM least-privilege policies, eliminating 100% of critical audit findings.

                DevOps Engineer | NetPulse | 2017 - 2020
                - Migrated 28 legacy workloads to Docker containers, saving $380k annually in compute spend.
                - Streamlined deployment pipelines for 35 engineers, increasing weekly releases by 3x.

                SKILLS
                AWS, Kubernetes, Docker, Terraform, Linux, Prometheus, Grafana, Python, CI/CD, Security, Git

                EDUCATION
                B.Tech in Information Technology (2013 - 2017)
                """,
                91, 83, 100,
                "Strong SRE metrics, clean ATS headings, concise active bullets, and near-total JD skill coverage."
            ),
            new BenchmarkCase(
                "BM-03", "Full-Stack TypeScript & React Engineer (Strong)", "Strong",
                "Senior Full-Stack Engineer",
                "Required: TypeScript, React, Node, PostgreSQL, SQL, REST API, Docker, Testing, Security, Architecture.",
                """
                Elena Rostova
                elena.rostova@example.com | (206) 555-0183 | linkedin.com/in/elenarostova

                SUMMARY
                Full-Stack Software Engineer with 7 years designing accessible React frontends, Node REST APIs, and PostgreSQL data models.

                EXPERIENCE
                Senior Full-Stack Engineer | Meridian Analytics | 2021 - Present
                - Architected a React and TypeScript analytics workspace serving 240,000 weekly users with sub-120ms interaction latency.
                - Built Node REST API services backed by PostgreSQL SQL queries, increasing report throughput by 3.2x.
                - Established automated testing suites covering 91% of critical workflows, reducing production incidents by 47%.
                - Secured customer uploads with automated PII redaction and strict session access controls across 12 endpoints.

                Software Engineer | WebCraft Labs | 2018 - 2021
                - Developed reusable UI component architecture in TypeScript and Dockerized deployment builds, cutting onboarding time by 40%.
                - Optimized SQL indexing on 18M-row tables, reducing dashboard load times from 4.8s to 0.7s.

                SKILLS
                TypeScript, JavaScript, React, Node, PostgreSQL, SQL, REST API, Docker, Testing, Security, Architecture

                EDUCATION
                M.S. in Software Engineering (2016 - 2018)
                """,
                90, 82, 100,
                "Balanced structure, clear quantifiable outcomes, active verbs, and thorough keyword match."
            ),
            new BenchmarkCase(
                "BM-04", "Mid-Level Java Developer (Competitive)", "Competitive",
                "Java Backend Developer",
                "Required: Java, Spring, JDBC, MySQL, REST API, Maven, JUnit, Git, Docker, Microservices.",
                """
                Rohan Verma
                rohan.verma@example.com | 408-555-0177

                SUMMARY
                Java Developer with 4 years of experience building REST APIs and MySQL database integrations using Maven and JDBC.

                EXPERIENCE
                Java Developer | CoreTech Solutions | 2022 - Present
                - Built Java and JDBC data access layers backed by MySQL serving 15,000 daily users.
                - Implemented REST API endpoints with Spring and Maven, reducing response times by 22%.
                - Wrote JUnit unit tests for billing modules and collaborated with QA teams via Git.
                - Maintained database migration scripts and resolved customer support tickets.

                Junior Developer | SoftBridge | 2020 - 2022
                - Developed internal reporting dashboards in Java and SQL for operations teams.
                - Assisted in migrating stored procedures and fixing bugs in legacy services.

                SKILLS
                Java, Spring, JDBC, MySQL, SQL, Maven, JUnit, REST API, Git

                EDUCATION
                B.S. in Computer Science (2016 - 2020)
                """,
                77, 68, 86,
                "Solid ATS sections and keywords, moderate quantification (only 2/6 bullets have metrics) and minor passive phrasing."
            ),
            new BenchmarkCase(
                "BM-05", "Data & Analytics Engineer (Competitive)", "Competitive",
                "Data Engineer",
                "Required: Python, SQL, Spark, ETL, AWS, PostgreSQL, Analytics, Tableau, Git, Testing.",
                """
                Marcus Vance
                marcus.vance@example.com | (312) 555-0133 | linkedin.com/in/marcusvance

                SUMMARY
                Data Engineer building automated Python and SQL ETL pipelines for executive analytics and Tableau reporting.

                EXPERIENCE
                Data Engineer | NorthStar Retail | 2021 - Present
                - Built Python and SQL ETL jobs ingesting 4.5M daily sales events into PostgreSQL with 99.5% reliability.
                - Designed Tableau executive dashboards used by 120 stakeholders across finance and merchandising.
                - Optimized slow SQL aggregations, reducing nightly batch duration by 35%.
                - Documented data dictionaries and supported ad-hoc analytics requests from business units.

                Data Analyst | MetricFlow | 2019 - 2021
                - Created weekly SQL reporting scripts and maintained KPI spreadsheets.
                - Helped with data cleansing during warehouse migration projects.

                SKILLS
                Python, SQL, PostgreSQL, ETL, Analytics, Tableau, Git

                EDUCATION
                B.A. in Statistics (2015 - 2019)
                """,
                76, 67, 85,
                "Good structure and solid analytics metrics, missing a few JD cloud/Spark keywords and one passive bullet."
            ),
            new BenchmarkCase(
                "BM-06", "Cybersecurity Analyst (Competitive)", "Competitive",
                "Security Analyst",
                "Required: Security, Linux, Python, AWS, OAuth, Encryption, REST API, Testing, SQL, Git.",
                """
                Lucas Chen
                lucas.chen@example.com | 650-555-0124

                SUMMARY
                Security Analyst focused on Linux hardening, OAuth access controls, and encryption audits in AWS environments.

                EXPERIENCE
                Security Analyst | ShieldNet | 2021 - Present
                - Automated Linux vulnerability scans in Python, reducing triage backlog by 40% across 90 servers.
                - Audited OAuth authentication flows and encryption configurations for 14 public REST APIs.
                - Delivered quarterly security awareness training to 180 employees.
                - Investigated SIEM alerts and documented incident response playbooks.

                IT Support Specialist | MetroBank | 2019 - 2021
                - Managed user access permissions and endpoint patching across regional branches.

                SKILLS
                Security, Linux, Python, AWS, OAuth, Encryption, Git

                EDUCATION
                B.S. in Cybersecurity (2015 - 2019)
                """,
                75, 66, 85,
                "Clean layout and relevant security skills, moderate metric density and partial JD coverage."
            ),
            new BenchmarkCase(
                "BM-07", "Entry-Level CS Graduate (Developing)", "Developing",
                "Junior Java Software Engineer",
                "Required: Java, JDBC, Servlets, JSP, MySQL, Maven, JUnit, Git, REST API, SQL.",
                """
                Ananya Sharma
                ananya.sharma@example.com

                EDUCATION
                B.S. in Computer Science (2021 - 2025)

                EXPERIENCE
                Software Intern | Campus Labs | 2024 - 2024
                - Worked on a student portal using Java and MySQL.
                - Helped with fixing UI bugs and writing SQL queries.
                - Participated in daily standups and learned Git workflows.

                SKILLS
                Java, SQL, MySQL, Git
                """,
                58, 48, 68,
                "Standard headings present, but short length, passive verbs ('worked on', 'helped with'), zero quantified metrics, and missing Servlets/JDBC/Maven/JUnit."
            ),
            new BenchmarkCase(
                "BM-08", "Career Switcher Generic Resume (Developing)", "Developing",
                "Backend Software Engineer",
                "Required: Java, PostgreSQL, Docker, Kubernetes, REST API, Microservices, Testing, CI/CD, Git.",
                """
                Jordan Taylor
                jordan.taylor@example.com | (555) 234-5678

                SUMMARY
                Hardworking professional transitioning into software engineering with strong teamwork and communication.

                EXPERIENCE
                Operations Coordinator | FastShip Logistics | 2020 - 2024
                - Responsible for scheduling deliveries and coordinating warehouse staff.
                - Worked on Excel spreadsheets and monthly shipping reports.
                - Assisted in onboarding new hires and handling customer phone inquiries.

                SKILLS
                Excel, Communication, Git, Basic SQL
                """,
                52, 42, 62,
                "Clean sections and contact details, but heavy passive language, zero metrics, and severe keyword mismatch against Backend SWE JD."
            ),
            new BenchmarkCase(
                "BM-09", "Dense Narrative Mid-Career Resume (Developing)", "Developing",
                "Product & Engineering Manager",
                "Required: Agile, Scrum, Architecture, Analytics, SQL, REST API, Security, Microservices, Cloud.",
                """
                David Kim
                david.kim@example.com

                EXPERIENCE
                Project Manager at Horizon Tech from 2019 to 2024 where I was responsible for overseeing multiple software deliveries across engineering and design teams, coordinating sprint planning meetings, preparing executive slide decks, tracking budget spreadsheets, managing vendor contracts, handling escalations, and working on stakeholder communications across international time zones every quarter without missing major contractual milestones.

                SKILLS
                Agile, Scrum, Communication, Leadership, Budgeting
                """,
                49, 39, 60,
                "Wall-of-text narrative with no bullets, missing Education/Summary sections, passive phrasing, and missing technical JD keywords."
            ),
            new BenchmarkCase(
                "BM-10", "Unstructured Short Plain Draft (Weak)", "Weak",
                "Senior Java & Cloud Engineer",
                "Required: Java, JDBC, Servlets, MySQL, AWS, Docker, Kubernetes, REST API, JUnit, Maven.",
                """
                Sam Patel
                I am looking for a software job. I worked on some coding assignments in college and helped with a website for a local shop. Duties included updating pages and talking to clients. I am a fast learner and team player.
                """,
                32, 20, 44,
                "Missing all standard headings, no contact info, no bullets, no metrics, passive verbs, and near-zero keyword overlap."
            ),
            new BenchmarkCase(
                "BM-11", "Vague Responsibility List Without Metrics (Weak)", "Weak",
                "Data Platform Engineer",
                "Required: Python, Spark, SQL, AWS, ETL, PostgreSQL, Kafka, Docker, Testing, CI/CD.",
                """
                Alex Morgan
                Responsible for helping the office with computer tasks and data entry.
                Worked on reports and assisted in filing documents for managers.
                Tasked with answering emails and participating in team meetings.
                """,
                33, 20, 45,
                "No sections, no contact details, no bullets, multiple passive phrases, zero metrics, and zero technical JD alignment."
            ),
            new BenchmarkCase(
                "BM-12", "Fragmented Minimal Bio (Weak)", "Weak",
                "Full-Stack Java & React Developer",
                "Required: Java, React, TypeScript, JDBC, MySQL, Servlets, REST API, Git, Docker, Testing.",
                """
                Chris Lee
                Available immediately for developer roles. Experienced with computers and office tools. Helped with small web tasks and worked on group projects during school.
                """,
                31, 18, 43,
                "Severely incomplete resume lacking structure, contact signals, metrics, action verbs, and required stack keywords."
            )
        );
    }

    public BenchmarkSummary runValidationSuite() throws DocumentValidationException {
        List<BenchmarkCase> dataset = getLabeledDataset();
        if (!dataset.isEmpty()) {
            // Single warm-up pass prevents cold JVM regex/classloading jitter on first measurement
            BenchmarkCase warmup = dataset.get(0);
            analyzerService.analyze(
                warmup.resumeText(),
                warmup.id() + ".txt",
                "Benchmark Warmup",
                warmup.targetRole(),
                warmup.jobDescription(),
                "Senior",
                true,
                RetentionPolicy.EPHEMERAL,
                EngineMode.DETERMINISTIC_LOCAL
            );
        }

        List<BenchmarkResult> results = new ArrayList<>(dataset.size());
        double[] latencies = new double[dataset.size()];
        double[] expectedArr = new double[dataset.size()];
        double[] predictedArr = new double[dataset.size()];

        double totalAbsError = 0.0;
        int withinBandCount = 0;

        for (int i = 0; i < dataset.size(); i++) {
            BenchmarkCase tc = dataset.get(i);
            long startNs = System.nanoTime();
            ResumeAnalyzerService.AnalysisBundle bundle = analyzerService.analyze(
                tc.resumeText(),
                tc.id() + ".txt",
                "Benchmark Text",
                tc.targetRole(),
                tc.jobDescription(),
                "Senior",
                true,
                RetentionPolicy.EPHEMERAL,
                EngineMode.DETERMINISTIC_LOCAL
            );
            double latencyMs = (System.nanoTime() - startNs) / 1_000_000.0;

            int predicted = bundle.report().getOverallScore();
            int absError = Math.abs(predicted - tc.expectedScore());
            boolean withinBand = predicted >= tc.minBand() && predicted <= tc.maxBand();

            totalAbsError += absError;
            if (withinBand) {
                withinBandCount++;
            }

            latencies[i] = latencyMs;
            expectedArr[i] = tc.expectedScore();
            predictedArr[i] = predicted;

            results.add(new BenchmarkResult(
                tc.id(),
                tc.label(),
                tc.tier(),
                tc.targetRole(),
                tc.expectedScore(),
                tc.minBand(),
                tc.maxBand(),
                predicted,
                absError,
                withinBand,
                round2(latencyMs),
                tc.rubricRationale()
            ));
        }

        double mae = round2(totalAbsError / dataset.size());
        double bandAccuracyPct = round2((withinBandCount * 100.0) / dataset.size());
        double spearman = round3(computeSpearmanRho(expectedArr, predictedArr));

        double[] sortedLatencies = Arrays.copyOf(latencies, latencies.length);
        Arrays.sort(sortedLatencies);
        double p50 = round2(percentile(sortedLatencies, 50));
        double p95 = round2(percentile(sortedLatencies, 95));

        return new BenchmarkSummary(
            dataset.size(),
            mae,
            bandAccuracyPct,
            spearman,
            p50,
            p95,
            Collections.unmodifiableList(results)
        );
    }

    private static double percentile(double[] sorted, double p) {
        if (sorted.length == 0) return 0.0;
        int idx = (int) Math.ceil((p / 100.0) * sorted.length) - 1;
        idx = Math.max(0, Math.min(sorted.length - 1, idx));
        return sorted[idx];
    }

    private static double computeSpearmanRho(double[] x, double[] y) {
        double[] rx = rankArray(x);
        double[] ry = rankArray(y);
        int n = x.length;
        double meanX = Arrays.stream(rx).average().orElse(0.0);
        double meanY = Arrays.stream(ry).average().orElse(0.0);
        double num = 0.0;
        double denX = 0.0;
        double denY = 0.0;
        for (int i = 0; i < n; i++) {
            double dx = rx[i] - meanX;
            double dy = ry[i] - meanY;
            num += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        }
        double denom = Math.sqrt(denX * denY);
        return denom == 0.0 ? 0.0 : num / denom;
    }

    private static double[] rankArray(double[] values) {
        int n = values.length;
        Integer[] indices = new Integer[n];
        for (int i = 0; i < n; i++) indices[i] = i;
        Arrays.sort(indices, (a, b) -> Double.compare(values[a], values[b]));

        double[] ranks = new double[n];
        int i = 0;
        while (i < n) {
            int j = i;
            while (j + 1 < n && Double.compare(values[indices[j + 1]], values[indices[i]]) == 0) {
                j++;
            }
            double avgRank = (i + j) / 2.0 + 1.0;
            for (int k = i; k <= j; k++) {
                ranks[indices[k]] = avgRank;
            }
            i = j + 1;
        }
        return ranks;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static double round3(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }
}
