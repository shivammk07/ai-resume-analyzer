import { runDeterministicAudit } from './deterministicEngine';

export interface BenchmarkCase {
  id: string;
  label: string;
  tier: 'Strong' | 'Competitive' | 'Developing' | 'Weak';
  targetRole: string;
  jobDescription: string;
  resumeText: string;
  expectedScore: number;
  minBand: number;
  maxBand: number;
  rubricRationale: string;
}

export interface BenchmarkResult {
  id: string;
  label: string;
  tier: 'Strong' | 'Competitive' | 'Developing' | 'Weak';
  targetRole: string;
  expectedScore: number;
  minBand: number;
  maxBand: number;
  predictedScore: number;
  absoluteError: number;
  withinBand: boolean;
  latencyMs: number;
  rubricRationale: string;
}

export interface BenchmarkSummary {
  id: string;
  runTimestamp: string;
  datasetSize: number;
  meanAbsoluteError: number;
  bandAccuracyPct: number;
  spearmanRho: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  results: BenchmarkResult[];
  disclaimer: string;
}

export const LABELED_BENCHMARK_DATASET: BenchmarkCase[] = [
  {
    id: 'BM-01',
    label: 'Senior Java & JDBC Architect',
    tier: 'Strong',
    targetRole: 'Senior Java Backend Engineer',
    jobDescription: 'Required: Java, JDBC, Servlets, JSP, MySQL, Maven, REST API, JUnit, Docker, SQL, Architecture, Microservices.',
    resumeText: `Priya Nair
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
B.S. in Computer Science, State University (2013 - 2017)`,
    expectedScore: 92,
    minBand: 84,
    maxBand: 100,
    rubricRationale: 'Complete standard sections, strong active verbs, 100% quantified XYZ bullets, and high JD keyword alignment.',
  },
  {
    id: 'BM-02',
    label: 'Cloud DevOps & SRE Lead',
    tier: 'Strong',
    targetRole: 'Site Reliability Engineer',
    jobDescription: 'Required: Kubernetes, Docker, Terraform, AWS, Linux, Prometheus, Grafana, CI/CD, Python, Security, Automation.',
    resumeText: `Arjun Mehta
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
B.Tech in Information Technology (2013 - 2017)`,
    expectedScore: 91,
    minBand: 83,
    maxBand: 100,
    rubricRationale: 'Strong SRE metrics, clean ATS headings, concise active bullets, and near-total JD skill coverage.',
  },
  {
    id: 'BM-03',
    label: 'Full-Stack TypeScript & React Engineer',
    tier: 'Strong',
    targetRole: 'Senior Full-Stack Engineer',
    jobDescription: 'Required: TypeScript, React, Node, PostgreSQL, SQL, REST API, Docker, Testing, Security, Architecture.',
    resumeText: `Elena Rostova
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
M.S. in Software Engineering (2016 - 2018)`,
    expectedScore: 90,
    minBand: 82,
    maxBand: 100,
    rubricRationale: 'Balanced structure, clear quantifiable outcomes, active verbs, and thorough keyword match.',
  },
  {
    id: 'BM-04',
    label: 'Mid-Level Java Developer',
    tier: 'Competitive',
    targetRole: 'Java Backend Developer',
    jobDescription: 'Required: Java, Spring, JDBC, MySQL, REST API, Maven, JUnit, Git, Docker, Microservices.',
    resumeText: `Rohan Verma
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
B.S. in Computer Science (2016 - 2020)`,
    expectedScore: 77,
    minBand: 68,
    maxBand: 86,
    rubricRationale: 'Solid ATS sections and keywords, moderate quantification (2/6 bullets have metrics) and minor passive phrasing.',
  },
  {
    id: 'BM-05',
    label: 'Data & Analytics Engineer',
    tier: 'Competitive',
    targetRole: 'Data Engineer',
    jobDescription: 'Required: Python, SQL, Spark, ETL, AWS, PostgreSQL, Analytics, Tableau, Git, Testing.',
    resumeText: `Marcus Vance
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
B.A. in Statistics (2015 - 2019)`,
    expectedScore: 76,
    minBand: 67,
    maxBand: 85,
    rubricRationale: 'Good structure and solid analytics metrics, missing a few JD cloud/Spark keywords and one passive bullet.',
  },
  {
    id: 'BM-06',
    label: 'Cybersecurity Analyst',
    tier: 'Competitive',
    targetRole: 'Security Analyst',
    jobDescription: 'Required: Security, Linux, Python, AWS, OAuth, Encryption, REST API, Testing, SQL, Git.',
    resumeText: `Lucas Chen
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
B.S. in Cybersecurity (2015 - 2019)`,
    expectedScore: 75,
    minBand: 66,
    maxBand: 85,
    rubricRationale: 'Clean layout and relevant security skills, moderate metric density and partial JD coverage.',
  },
  {
    id: 'BM-07',
    label: 'Entry-Level CS Graduate',
    tier: 'Developing',
    targetRole: 'Junior Java Software Engineer',
    jobDescription: 'Required: Java, JDBC, Servlets, JSP, MySQL, Maven, JUnit, Git, REST API, SQL.',
    resumeText: `Ananya Sharma
ananya.sharma@example.com

EDUCATION
B.S. in Computer Science (2021 - 2025)

EXPERIENCE
Software Intern | Campus Labs | 2024 - 2024
- Worked on a student portal using Java and MySQL.
- Helped with fixing UI bugs and writing SQL queries.
- Participated in daily standups and learned Git workflows.

SKILLS
Java, SQL, MySQL, Git`,
    expectedScore: 58,
    minBand: 48,
    maxBand: 68,
    rubricRationale: 'Standard headings present, but short length, passive verbs, zero quantified metrics, and missing Servlets/JDBC/Maven/JUnit.',
  },
  {
    id: 'BM-08',
    label: 'Career Switcher Generic Resume',
    tier: 'Developing',
    targetRole: 'Backend Software Engineer',
    jobDescription: 'Required: Java, PostgreSQL, Docker, Kubernetes, REST API, Microservices, Testing, CI/CD, Git.',
    resumeText: `Jordan Taylor
jordan.taylor@example.com | (555) 234-5678

SUMMARY
Hardworking professional transitioning into software engineering with strong teamwork and communication.

EXPERIENCE
Operations Coordinator | FastShip Logistics | 2020 - 2024
- Responsible for scheduling deliveries and coordinating warehouse staff.
- Worked on Excel spreadsheets and monthly shipping reports.
- Assisted in onboarding new hires and handling customer phone inquiries.

SKILLS
Excel, Communication, Git, Basic SQL`,
    expectedScore: 52,
    minBand: 42,
    maxBand: 62,
    rubricRationale: 'Clean sections and contact details, but heavy passive language, zero metrics, and severe keyword mismatch.',
  },
  {
    id: 'BM-09',
    label: 'Dense Narrative Mid-Career Resume',
    tier: 'Developing',
    targetRole: 'Product & Engineering Manager',
    jobDescription: 'Required: Agile, Scrum, Architecture, Analytics, SQL, REST API, Security, Microservices, Cloud.',
    resumeText: `David Kim
david.kim@example.com

EXPERIENCE
Project Manager at Horizon Tech from 2019 to 2024 where I was responsible for overseeing multiple software deliveries across engineering and design teams, coordinating sprint planning meetings, preparing executive slide decks, tracking budget spreadsheets, managing vendor contracts, handling escalations, and working on stakeholder communications across international time zones every quarter without missing major contractual milestones.

SKILLS
Agile, Scrum, Communication, Leadership, Budgeting`,
    expectedScore: 49,
    minBand: 39,
    maxBand: 60,
    rubricRationale: 'Wall-of-text narrative with no bullets, missing Education/Summary sections, passive phrasing, and missing technical keywords.',
  },
  {
    id: 'BM-10',
    label: 'Unstructured Short Plain Draft',
    tier: 'Weak',
    targetRole: 'Senior Java & Cloud Engineer',
    jobDescription: 'Required: Java, JDBC, Servlets, MySQL, AWS, Docker, Kubernetes, REST API, JUnit, Maven.',
    resumeText: `Sam Patel
I am looking for a software job. I worked on some coding assignments in college and helped with a website for a local shop. Duties included updating pages and talking to clients. I am a fast learner and team player.`,
    expectedScore: 32,
    minBand: 20,
    maxBand: 44,
    rubricRationale: 'Missing all standard headings, no contact info, no bullets, no metrics, passive verbs, and near-zero keyword overlap.',
  },
  {
    id: 'BM-11',
    label: 'Vague Responsibility List Without Metrics',
    tier: 'Weak',
    targetRole: 'Data Platform Engineer',
    jobDescription: 'Required: Python, Spark, SQL, AWS, ETL, PostgreSQL, Kafka, Docker, Testing, CI/CD.',
    resumeText: `Alex Morgan
Responsible for helping the office with computer tasks and data entry.
Worked on reports and assisted in filing documents for managers.
Tasked with answering emails and participating in team meetings.`,
    expectedScore: 33,
    minBand: 20,
    maxBand: 45,
    rubricRationale: 'No sections, no contact details, no bullets, multiple passive phrases, zero metrics, and zero technical JD alignment.',
  },
  {
    id: 'BM-12',
    label: 'Fragmented Minimal Bio',
    tier: 'Weak',
    targetRole: 'Full-Stack Java & React Developer',
    jobDescription: 'Required: Java, React, TypeScript, JDBC, MySQL, Servlets, REST API, Git, Docker, Testing.',
    resumeText: `Chris Lee
Available immediately for developer roles. Experienced with computers and office tools. Helped with small web tasks and worked on group projects during school.`,
    expectedScore: 31,
    minBand: 18,
    maxBand: 43,
    rubricRationale: 'Severely incomplete resume lacking structure, contact signals, metrics, action verbs, and required stack keywords.',
  },
];

function rankArray(values: number[]): number[] {
  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i).sort((a, b) => values[a] - values[b]);
  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && values[indices[j + 1]] === values[indices[i]]) {
      j++;
    }
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      ranks[indices[k]] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

function computeSpearmanRho(x: number[], y: number[]): number {
  const rx = rankArray(x);
  const ry = rankArray(y);
  const meanX = rx.reduce((a, b) => a + b, 0) / rx.length;
  const meanY = ry.reduce((a, b) => a + b, 0) / ry.length;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < rx.length; i++) {
    const dx = rx[i] - meanX;
    const dy = ry[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const denom = Math.sqrt(denX * denY);
  return denom === 0 ? 0 : num / denom;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function runBenchmarkValidationSuite(): BenchmarkSummary {
  const results: BenchmarkResult[] = [];
  const latencies: number[] = [];
  const expected: number[] = [];
  const predicted: number[] = [];
  let totalAbsError = 0;
  let withinBandCount = 0;

  for (const tc of LABELED_BENCHMARK_DATASET) {
    const t0 = performance.now();
    const audit = runDeterministicAudit({
      resumeText: tc.resumeText,
      fileName: `${tc.id}.txt`,
      detectedFormat: 'Benchmark Text',
      jobTitle: tc.targetRole,
      jobDescription: tc.jobDescription,
      targetLevel: 'Senior',
      redactPii: true,
      retentionPolicy: 'EPHEMERAL',
    });
    const latencyMs = Number((performance.now() - t0).toFixed(2));
    const absError = Math.abs(audit.overallScore - tc.expectedScore);
    const withinBand = audit.overallScore >= tc.minBand && audit.overallScore <= tc.maxBand;

    totalAbsError += absError;
    if (withinBand) withinBandCount++;

    latencies.push(latencyMs);
    expected.push(tc.expectedScore);
    predicted.push(audit.overallScore);

    results.push({
      id: tc.id,
      label: tc.label,
      tier: tc.tier,
      targetRole: tc.targetRole,
      expectedScore: tc.expectedScore,
      minBand: tc.minBand,
      maxBand: tc.maxBand,
      predictedScore: audit.overallScore,
      absoluteError: absError,
      withinBand,
      latencyMs,
      rubricRationale: tc.rubricRationale,
    });
  }

  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  return {
    id: `bm_${Date.now()}`,
    runTimestamp: new Date().toISOString(),
    datasetSize: LABELED_BENCHMARK_DATASET.length,
    meanAbsoluteError: Number((totalAbsError / LABELED_BENCHMARK_DATASET.length).toFixed(2)),
    bandAccuracyPct: Number(((withinBandCount * 100) / LABELED_BENCHMARK_DATASET.length).toFixed(2)),
    spearmanRho: Number(computeSpearmanRho(expected, predicted).toFixed(3)),
    p50LatencyMs: Number(percentile(sortedLatencies, 50).toFixed(2)),
    p95LatencyMs: Number(percentile(sortedLatencies, 95).toFixed(2)),
    results,
    disclaimer:
      'Validation evaluates deterministic rubric consistency against 12 independently annotated resumes across 4 quality tiers. Scores measure ATS heuristic alignment and are not verified hiring outcomes.',
  };
}
