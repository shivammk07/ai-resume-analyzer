import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import { runBenchmarkValidationSuite } from '../src/server/benchmarkSuite';
import { redactResumePii } from '../src/server/piiRedactor';

/**
 * Generates the standalone 12-slide CareerPulse Academic Rubric Presentation (.pptx)
 * synchronized with live verified benchmark metrics, real PII redaction output,
 * UML architecture visuals, and uncropped full-page UI visuals.
 *
 * Output: docs/CareerPulse_Java_Enterprise_Presentation.pptx
 * Run:    npx tsx scripts/generate_pptx.ts
 */
async function buildRubricPresentation() {
  const benchmark = runBenchmarkValidationSuite();
  const sampleRawPii =
    'Priya Nair | Email: priya.nair@example.com | Phone: (415) 555-0192 | ' +
    'SSN: 123-45-6789 | DOB: 04/12/1996 | Address: 742 Evergreen Terrace Street';
  const redactionDemo = redactResumePii(sampleRawPii);

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = 'CareerPulse — Core Java 17, JDBC, Jakarta EE 10 & Swing ATS Audit Platform';
  pres.subject = 'Academic Project Presentation — Java Web & Java GUI Rubrics (Team Moshdi)';
  pres.author = 'Shivam Kumar (Team Moshdi)';

  // Visual Design Tokens (Dark Slate Executive Engineering Theme)
  const BG = '0B0F19';
  const SURFACE = '111827';
  const CARD = '162033';
  const BORDER = '24324B';
  const WHITE = 'F8FAFC';
  const MUTED = '94A3B8';
  const INDIGO = '6366F1';
  const CYAN = '06B6D4';
  const EMERALD = '10B981';
  const AMBER = 'F59E0B';
  const ROSE = 'F43F5E';

  const imgSwing = path.resolve(process.cwd(), 'src/assets/images/swing_gui_desktop_1795588217627.jpg');
  const imgUpload = path.resolve(process.cwd(), 'src/assets/images/web_upload_workbench_1795588186064.jpg');
  const imgReport = path.resolve(process.cwd(), 'src/assets/images/web_before_after_report_1795588186470.jpg');

  const addHeader = (slide: pptxgen.Slide, sectionTag: string, title: string, slideNum: number) => {
    slide.background = { color: BG };
    slide.addText(sectionTag.toUpperCase(), {
      x: 0.6, y: 0.35, w: 9.5, h: 0.25,
      fontSize: 9.5, bold: true, color: CYAN, fontFace: 'Calibri', charSpacing: 1.2,
    });
    slide.addText(title, {
      x: 0.6, y: 0.62, w: 11.6, h: 0.5,
      fontSize: 24, bold: true, color: WHITE, fontFace: 'Calibri',
    });
    slide.addShape(pres.ShapeType.line, {
      x: 0.6, y: 1.18, w: 12.13, h: 0,
      line: { color: BORDER, width: 1 },
    });
    // Consistent subtle footer
    slide.addText('CareerPulse  ·  Java 17 / JDBC / Jakarta EE 10 / Swing  ·  Team Moshdi (Lead: Shivam Kumar)', {
      x: 0.6, y: 7.12, w: 10.5, h: 0.24,
      fontSize: 8.5, color: MUTED, fontFace: 'Calibri',
    });
    slide.addText(`${slideNum} / 12`, {
      x: 11.5, y: 7.12, w: 1.23, h: 0.24,
      fontSize: 8.5, bold: true, color: INDIGO, align: 'right', fontFace: 'Calibri',
    });
  };

  // =========================================================================
  // SLIDE 1: Title & Team Moshdi Identity
  // =========================================================================
  const s1 = pres.addSlide();
  s1.background = { color: BG };
  s1.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: INDIGO }, line: { color: INDIGO, width: 0 },
  });
  s1.addText('JAVA WEB & JAVA GUI ENTERPRISE PROJECT SUBMISSION', {
    x: 0.85, y: 0.85, w: 11.5, h: 0.32,
    fontSize: 11, bold: true, color: CYAN, fontFace: 'Calibri', charSpacing: 1.5,
  });
  s1.addText('CareerPulse', {
    x: 0.85, y: 1.25, w: 11.5, h: 1.0,
    fontSize: 50, bold: true, color: WHITE, fontFace: 'Calibri',
  });
  s1.addText(
    'Privacy-First Deterministic ATS Resume Audit Platform\nCore Java 17 OOP · JDBC DAO (MySQL 8 + H2) · Jakarta EE 10 Servlets/JSP · Java Swing GUI',
    {
      x: 0.85, y: 2.35, w: 11.5, h: 0.95,
      fontSize: 17, color: MUTED, fontFace: 'Calibri', lineSpacing: 26,
    }
  );

  // Team Identity Strip
  s1.addShape(pres.ShapeType.roundRect, {
    x: 0.85, y: 3.6, w: 11.6, h: 1.1,
    fill: { color: CARD }, line: { color: BORDER, width: 1.2 }, rectRadius: 0.08,
  });
  s1.addText('Team Moshdi  ·  Project Lead & Core Architect: Shivam Kumar', {
    x: 1.15, y: 3.78, w: 11.0, h: 0.35,
    fontSize: 14, bold: true, color: WHITE, fontFace: 'Calibri',
  });
  s1.addText(
    'Tri-Client Architecture (Tomcat 10+ WAR + Swing GUI + Standalone CLI Tester)  ·  Zero External API Keys  ·  Checkstyle + 7 JUnit 5 Suites',
    {
      x: 1.15, y: 4.18, w: 11.0, h: 0.32,
      fontSize: 11.5, color: CYAN, fontFace: 'Calibri',
    }
  );

  // 4 Verified Headline Stat Tiles
  const heroStats = [
    { val: '9 Pkgs', lbl: 'Pure Maven Java 17 Layout', sub: 'OOP + DAO + Servlets + Swing + CLI', accent: INDIGO },
    { val: '5 Tables', lbl: 'Normalized JDBC Schema', sub: 'MySQL 8 Primary + H2 Fallback', accent: CYAN },
    { val: `${benchmark.bandAccuracyPct}%`, lbl: '12-Resume Band Accuracy', sub: `MAE ${benchmark.meanAbsoluteError} · Spearman ρ ${benchmark.spearmanRho}`, accent: EMERALD },
    { val: `${benchmark.p50LatencyMs} ms`, lbl: 'Offline Deterministic p50', sub: `p95: ${benchmark.p95LatencyMs} ms · 0 API Keys`, accent: AMBER },
  ];
  heroStats.forEach((st, idx) => {
    const x = 0.85 + idx * 2.97;
    s1.addShape(pres.ShapeType.roundRect, {
      x, y: 5.05, w: 2.75, h: 1.65,
      fill: { color: SURFACE }, line: { color: st.accent, width: 1.2 }, rectRadius: 0.08,
    });
    s1.addText(st.val, {
      x: x + 0.18, y: 5.22, w: 2.4, h: 0.55,
      fontSize: 26, bold: true, color: st.accent, fontFace: 'Calibri',
    });
    s1.addText(st.lbl, {
      x: x + 0.18, y: 5.82, w: 2.4, h: 0.32,
      fontSize: 11, bold: true, color: WHITE, fontFace: 'Calibri',
    });
    s1.addText(st.sub, {
      x: x + 0.18, y: 6.18, w: 2.4, h: 0.35,
      fontSize: 9.5, color: MUTED, fontFace: 'Calibri',
    });
  });

  // =========================================================================
  // SLIDE 2: Problem Statement & Reviewer Feedback Resolution Matrix
  // =========================================================================
  const s2 = pres.addSlide();
  addHeader(s2, '01 / Problem Understanding & Review Resolution', 'Closing Every Academic Evaluation Gap End-to-End', 2);

  const resolutionRows: pptxgen.TableRow[] = [
    [
      { text: 'Rubric / Reviewer Finding', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Prior Gap Identified', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Implemented CareerPulse Solution (Verified)', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
    ],
    [
      { text: 'Core Java OOP (0 -> Full)', options: { bold: true, color: CYAN } },
      { text: 'No Java classes, inheritance, interfaces, or collections', options: { color: MUTED } },
      { text: 'Analyzable -> AbstractDocument -> Resume/JD subclasses; 5 ScoringCriterion strategies; PriorityQueue & custom exceptions', options: { color: WHITE } },
    ],
    [
      { text: 'JDBC & Database (0 -> Full)', options: { bold: true, color: CYAN } },
      { text: 'No JDBC connection, DAO layer, or relational schema', options: { color: MUTED } },
      { text: '5-table schema.sql, DatabaseConnectionManager (MySQL 8 + H2 fallback), GenericDao + atomic commit/rollback DAOs', options: { color: WHITE } },
    ],
    [
      { text: 'Servlets & JSP (0 -> Full)', options: { bold: true, color: CYAN } },
      { text: 'Backend used Express.js instead of Java Servlets/JSP', options: { color: MUTED } },
      { text: '5 Jakarta EE 10 Servlets + SecurityAndPrivacyFilter (CSRF/CSP) + 6 JSTL-escaped JSP views packaged as Tomcat WAR', options: { color: WHITE } },
    ],
    [
      { text: 'Java GUI Execution', options: { bold: true, color: CYAN } },
      { text: 'Needed modular Java desktop client for GUI rubric', options: { color: MUTED } },
      { text: '4-tab Java Swing Desktop GUI (CareerPulseDesktopApp + SwingWorker) sharing the exact Core Java & JDBC layer', options: { color: WHITE } },
    ],
    [
      { text: 'External API Dependency', options: { bold: true, color: CYAN } },
      { text: 'Scoring depended on external API keys & rate limits', options: { color: MUTED } },
      { text: '100% offline deterministic 5-dimension ATS engine (zero external API keys) + Standalone CLI Tester (--self-test / --file)', options: { color: WHITE } },
    ],
    [
      { text: 'Accuracy & Privacy', options: { bold: true, color: CYAN } },
      { text: 'Unvalidated ATS claims; unmasked resume PII', options: { color: MUTED } },
      { text: `12-resume labeled corpus (${benchmark.bandAccuracyPct}% band accuracy, ρ=${benchmark.spearmanRho}) + RegexPiiRedactor + TTL retention + scope disclaimer`, options: { color: WHITE } },
    ],
    [
      { text: 'Quality, Testing & Team', options: { bold: true, color: CYAN } },
      { text: 'Insufficient automated tests & collaboration docs', options: { color: MUTED } },
      { text: 'Pure Maven Java 17 layout, Checkstyle + Javadoc + 7 JUnit 5/Mockito suites + Pure Java 17 GitHub Actions CI + CONTRIBUTING/PR templates', options: { color: WHITE } },
    ],
  ];

  s2.addTable(resolutionRows, {
    x: 0.6, y: 1.38, w: 12.13, h: 5.4,
    colW: [2.5, 3.63, 6.0],
    fontSize: 10.5, fontFace: 'Calibri',
    fill: { color: SURFACE },
    border: { type: 'solid', color: BORDER, pt: 0.75 },
    valign: 'middle',
    margin: [6, 8, 6, 8],
  });

  // =========================================================================
  // SLIDE 3: Core Java 17 OOP, Interfaces, Inheritance & Collections
  // =========================================================================
  const s3 = pres.addSlide();
  addHeader(s3, '02 / Core Java 17 OOP Architecture', 'Interfaces, Inheritance, Polymorphic Strategy & Java Collections', 3);

  // Left: Domain OOP Inheritance Hierarchy
  s3.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 1.4, w: 5.85, h: 5.45,
    fill: { color: SURFACE }, line: { color: BORDER, width: 1 }, rectRadius: 0.08,
  });
  s3.addText('Domain Inheritance Hierarchy (com.careerpulse.model)', {
    x: 0.85, y: 1.58, w: 5.4, h: 0.32, fontSize: 13, bold: true, color: CYAN,
  });

  // Box 1: Interface Analyzable
  s3.addShape(pres.ShapeType.roundRect, {
    x: 1.65, y: 2.05, w: 3.75, h: 0.85,
    fill: { color: CARD }, line: { color: INDIGO, width: 1.4 }, rectRadius: 0.06,
  });
  s3.addText('«interface» Analyzable\n+getNormalizedContent() · +getWordCount()\n+getTokenFrequencies(): Map<String, Integer>', {
    x: 1.75, y: 2.12, w: 3.55, h: 0.72, fontSize: 9.5, color: WHITE, align: 'center', fontFace: 'Consolas',
  });

  // Arrow down
  s3.addText('▲  implements', { x: 2.7, y: 2.93, w: 1.65, h: 0.25, fontSize: 9, color: MUTED, align: 'center' });

  // Box 2: AbstractDocument
  s3.addShape(pres.ShapeType.roundRect, {
    x: 1.45, y: 3.22, w: 4.15, h: 0.95,
    fill: { color: CARD }, line: { color: CYAN, width: 1.4 }, rectRadius: 0.06,
  });
  s3.addText('«abstract» AbstractDocument\n#normalizedContent · #createdAt\n+getSectionsDetected(): Set<String>', {
    x: 1.55, y: 3.3, w: 3.95, h: 0.8, fontSize: 9.5, color: WHITE, align: 'center', fontFace: 'Consolas',
  });

  s3.addText('▲  extends (Concrete Subclasses)', { x: 1.8, y: 4.22, w: 3.45, h: 0.25, fontSize: 9, color: MUTED, align: 'center' });

  // Subclass 1: ResumeDocument
  s3.addShape(pres.ShapeType.roundRect, {
    x: 0.85, y: 4.55, w: 2.55, h: 1.2,
    fill: { color: CARD }, line: { color: EMERALD, width: 1.2 }, rectRadius: 0.06,
  });
  s3.addText('ResumeDocument\n-userId, piiItemsMasked\n-retentionPolicy, expiresAt\n+getBulletLines(): List', {
    x: 0.95, y: 4.65, w: 2.35, h: 1.0, fontSize: 9, color: WHITE, fontFace: 'Consolas',
  });

  // Subclass 2: JobDescriptionDocument
  s3.addShape(pres.ShapeType.roundRect, {
    x: 3.65, y: 4.55, w: 2.55, h: 1.2,
    fill: { color: CARD }, line: { color: EMERALD, width: 1.2 }, rectRadius: 0.06,
  });
  s3.addText('JobDescriptionDocument\n-targetTitle, seniority\n-requiredKeywords: Set\n+getRequiredKeywords()', {
    x: 3.75, y: 4.65, w: 2.35, h: 1.0, fontSize: 9, color: WHITE, fontFace: 'Consolas',
  });

  // Custom Exception Strip
  s3.addShape(pres.ShapeType.roundRect, {
    x: 0.85, y: 5.95, w: 5.35, h: 0.72,
    fill: { color: '1E1B2E' }, line: { color: ROSE, width: 1 }, rectRadius: 0.06,
  });
  s3.addText('Custom Exceptions: CareerPulseException -> DocumentValidationException · DatabaseOperationException · UnauthorizedAccessException', {
    x: 0.98, y: 6.04, w: 5.1, h: 0.54, fontSize: 9.2, color: WHITE, fontFace: 'Calibri',
  });

  // Right: Polymorphic Scoring Strategy & Java Collections
  s3.addShape(pres.ShapeType.roundRect, {
    x: 6.7, y: 1.4, w: 6.03, h: 5.45,
    fill: { color: SURFACE }, line: { color: BORDER, width: 1 }, rectRadius: 0.08,
  });
  s3.addText('Polymorphic Strategy Pattern (ScoringCriterion)', {
    x: 6.95, y: 1.58, w: 5.5, h: 0.32, fontSize: 13, bold: true, color: EMERALD,
  });

  const strategies = [
    { name: 'AtsParsabilityScorer', wt: '25%', desc: 'Standard headings, date patterns, contact signals & layout hygiene' },
    { name: 'QuantifiableImpactScorer', wt: '25%', desc: 'Google XYZ metrics detection (%, $, x, latency, scale figures)' },
    { name: 'KeywordAlignmentScorer', wt: '20%', desc: 'Set intersection & difference against JD requiredKeywords' },
    { name: 'ActionVerbScorer', wt: '15%', desc: 'Strong ownership verbs vs. passive phrasing penalty' },
    { name: 'FormattingReadabilityScorer', wt: '15%', desc: 'Bullet length distribution, brevity & dense-wall detection' },
  ];

  strategies.forEach((st, i) => {
    const y = 2.02 + i * 0.64;
    s3.addShape(pres.ShapeType.roundRect, {
      x: 6.95, y, w: 5.53, h: 0.54,
      fill: { color: CARD }, line: { color: BORDER, width: 1 }, rectRadius: 0.05,
    });
    s3.addText(st.name, { x: 7.1, y: y + 0.06, w: 2.9, h: 0.22, fontSize: 10, bold: true, color: WHITE, fontFace: 'Consolas' });
    s3.addText(st.wt, { x: 11.75, y: y + 0.06, w: 0.6, h: 0.22, fontSize: 10, bold: true, color: CYAN, align: 'right', fontFace: 'Consolas' });
    s3.addText(st.desc, { x: 7.1, y: y + 0.28, w: 5.2, h: 0.22, fontSize: 8.8, color: MUTED, fontFace: 'Calibri' });
  });

  // Java Collections Highlight Box
  s3.addShape(pres.ShapeType.roundRect, {
    x: 6.95, y: 5.32, w: 5.53, h: 1.35,
    fill: { color: '132238' }, line: { color: INDIGO, width: 1.2 }, rectRadius: 0.06,
  });
  s3.addText('Java Collections & Functional Streams Used', {
    x: 7.1, y: 5.42, w: 5.2, h: 0.26, fontSize: 10.5, bold: true, color: INDIGO,
  });
  s3.addText(
    '• PriorityQueue<FixRecommendation> (Comparable) ranks HIGH -> MEDIUM -> LOW fixes\n' +
    '• LinkedHashMap<String, CategoryScore> preserves deterministic 5-dimension order\n' +
    '• HashSet / Set<String> computes exact matched vs. missing JD skill keywords\n' +
    '• Unmodifiable List<ScoringCriterion> enables open/closed extensibility',
    { x: 7.1, y: 5.7, w: 5.25, h: 0.92, fontSize: 9.2, color: WHITE, lineSpacing: 14 }
  );

  // =========================================================================
  // SLIDE 4: Relational Database & JDBC DAO Persistence Layer
  // =========================================================================
  const s4 = pres.addSlide();
  addHeader(s4, '03 / Database Integration (JDBC & DAO)', 'Normalized 5-Table Schema, MySQL 8 Primary & Automatic H2 Fallback', 4);

  // Left: 5-Table ERD visual
  const tables = [
    { name: 'users', x: 0.6, y: 1.45, w: 3.4, h: 1.65, color: INDIGO, cols: 'PK id (BIGINT)\nUK email, display_name\npassword_hash (PBKDF2)\nrole, created_at' },
    { name: 'resumes', x: 4.35, y: 1.45, w: 3.6, h: 1.9, color: CYAN, cols: 'PK id (BIGINT)\nFK user_id -> users(id)\nfilename, redacted_content\npii_items_masked\nretention_policy, expires_at' },
    { name: 'analysis_reports', x: 4.35, y: 3.65, w: 3.6, h: 2.25, color: EMERALD, cols: 'PK id (BIGINT)\nFK resume_id -> resumes(id)\ntarget_role, engine_mode\noverall_score, score_label\n5 category scores + latency\nsummary_json, created_at' },
    { name: 'audit_access_logs', x: 0.6, y: 3.55, w: 3.4, h: 1.55, color: AMBER, cols: 'PK id (BIGINT)\nFK user_id -> users(id)\naction, resource_id\ndetails, created_at' },
    { name: 'benchmark_runs', x: 0.6, y: 5.32, w: 3.4, h: 1.55, color: ROSE, cols: 'PK id (BIGINT)\ndataset_size, mae\nband_accuracy_pct, spearman\np50_latency_ms, p95_latency' },
  ];

  tables.forEach((t) => {
    s4.addShape(pres.ShapeType.roundRect, {
      x: t.x, y: t.y, w: t.w, h: t.h,
      fill: { color: SURFACE }, line: { color: t.color, width: 1.3 }, rectRadius: 0.06,
    });
    s4.addShape(pres.ShapeType.rect, {
      x: t.x, y: t.y, w: t.w, h: 0.34,
      fill: { color: t.color }, line: { color: t.color, width: 0 },
    });
    s4.addText(t.name, {
      x: t.x + 0.12, y: t.y + 0.04, w: t.w - 0.24, h: 0.26,
      fontSize: 10.5, bold: true, color: BG, fontFace: 'Consolas',
    });
    s4.addText(t.cols, {
      x: t.x + 0.12, y: t.y + 0.4, w: t.w - 0.24, h: t.h - 0.45,
      fontSize: 9, color: WHITE, fontFace: 'Consolas', lineSpacing: 13.5,
    });
  });

  // Connectors
  s4.addText('1 ──< N', { x: 3.96, y: 1.85, w: 0.42, h: 0.3, fontSize: 8.5, bold: true, color: CYAN, align: 'center' });
  s4.addText('1 ──< N', { x: 5.75, y: 3.36, w: 0.8, h: 0.26, fontSize: 8.5, bold: true, color: EMERALD, align: 'center' });

  // Right: JDBC Engineering Highlights
  s4.addShape(pres.ShapeType.roundRect, {
    x: 8.3, y: 1.45, w: 4.43, h: 5.42,
    fill: { color: CARD }, line: { color: BORDER, width: 1 }, rectRadius: 0.08,
  });
  s4.addText('JDBC & DAO Implementation Highlights', {
    x: 8.55, y: 1.65, w: 4.0, h: 0.32, fontSize: 13, bold: true, color: WHITE,
  });

  const jdbcBullets = [
    { head: 'Dual-RDBMS Connection Manager', body: 'Reads DB_URL, DB_USER, DB_PASSWORD for MySQL 8; automatically activates H2 in MODE=MySQL when unconfigured for instant grading.' },
    { head: 'GenericDao<T, ID> Pattern', body: 'Implemented by JdbcUserDao, JdbcAnalysisReportDao, JdbcBenchmarkDao, and JdbcAuditLogDao with clean ResultSet row mapping.' },
    { head: 'Atomic JDBC Transactions', body: 'saveResumeAndReportTransaction() sets autoCommit(false), inserts resume + report with RETURN_GENERATED_KEYS, commits, or rolls back.' },
    { head: '100% Parameterized SQL', body: 'Every DAO query uses PreparedStatement bindings — zero string concatenation, preventing SQL injection.' },
    { head: 'Owner Isolation & TTL Cleanup', body: 'JOIN queries filter by WHERE res.user_id = ?; deleteExpiredResumes(Instant.now()) enforces automated retention expiry.' },
  ];
  jdbcBullets.forEach((b, idx) => {
    const y = 2.1 + idx * 0.92;
    s4.addText(b.head, { x: 8.55, y, w: 3.95, h: 0.24, fontSize: 10.5, bold: true, color: CYAN });
    s4.addText(b.body, { x: 8.55, y: y + 0.24, w: 3.95, h: 0.62, fontSize: 9.2, color: MUTED, lineSpacing: 13 });
  });

  // =========================================================================
  // SLIDE 5: Jakarta EE 10 Servlets, JSP & Security Filter (Tomcat 10+)
  // =========================================================================
  const s5 = pres.addSlide();
  addHeader(s5, '04 / Servlets & Web Integration (Jakarta EE 10)', 'Apache Tomcat 10+ Servlet Controllers, Security Filter & JSTL Views', 5);

  // Pipeline Strip
  const pipeSteps = [
    { lbl: 'HTTP Request', sub: 'Tomcat 10.1+', col: MUTED },
    { lbl: 'SecurityFilter', sub: 'CSP · XFO · CSRF', col: ROSE },
    { lbl: 'Jakarta Servlet', sub: 'MVC Controller', col: INDIGO },
    { lbl: 'Core Engine + DAO', sub: 'PII · Score · JDBC', col: CYAN },
    { lbl: 'JSP + JSTL 3.0', sub: '<c:out> Escaped', col: EMERALD },
  ];
  pipeSteps.forEach((st, i) => {
    const x = 0.6 + i * 2.48;
    s5.addShape(pres.ShapeType.roundRect, {
      x, y: 1.4, w: 2.2, h: 0.82,
      fill: { color: CARD }, line: { color: st.col, width: 1.3 }, rectRadius: 0.06,
    });
    s5.addText(st.lbl, { x, y: 1.48, w: 2.2, h: 0.3, fontSize: 10.5, bold: true, color: WHITE, align: 'center' });
    s5.addText(st.sub, { x, y: 1.8, w: 2.2, h: 0.28, fontSize: 9, color: st.col, align: 'center' });
    if (i < pipeSteps.length - 1) {
      s5.addText('➔', { x: x + 2.2, y: 1.62, w: 0.28, h: 0.35, fontSize: 14, bold: true, color: MUTED, align: 'center' });
    }
  });

  // Servlets Table
  const servletRows: pptxgen.TableRow[] = [
    [
      { text: 'Jakarta Component', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Route', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Responsibility & Security Enforcement', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'JSP View', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
    ],
    [
      { text: 'SecurityAndPrivacyFilter', options: { bold: true, color: ROSE } },
      { text: '/*', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'Injects CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy & validates per-session CSRF tokens on POST', options: { color: WHITE } },
      { text: 'All Views', options: { color: MUTED } },
    ],
    [
      { text: 'AuthServlet', options: { bold: true, color: WHITE } },
      { text: '/auth', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'Salted PBKDF2-SHA256 registration & login, session ID rotation (session fixation defense), logout invalidation', options: { color: WHITE } },
      { text: 'auth.jsp', options: { fontFace: 'Consolas', color: EMERALD } },
    ],
    [
      { text: 'ResumeUploadServlet', options: { bold: true, color: WHITE } },
      { text: '/analyze', options: { fontFace: 'Consolas', color: CYAN } },
      { text: '@MultipartConfig ingestion, RegexPiiRedactor masking, offline deterministic scoring, atomic JDBC save & Java 17 JSON', options: { color: WHITE } },
      { text: 'dashboard.jsp / report.jsp', options: { fontFace: 'Consolas', color: EMERALD } },
    ],
    [
      { text: 'AnalysisHistoryServlet', options: { bold: true, color: WHITE } },
      { text: '/history', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'Lists owner-scoped reports (WHERE user_id = ?), enforces 403/404 isolation on detail lookup & single-record delete', options: { color: WHITE } },
      { text: 'history.jsp', options: { fontFace: 'Consolas', color: EMERALD } },
    ],
    [
      { text: 'BenchmarkServlet', options: { bold: true, color: WHITE } },
      { text: '/benchmarks', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'Executes 12-resume labeled corpus via BenchmarkValidator, saves reproducible metrics in benchmark_runs', options: { color: WHITE } },
      { text: 'benchmark.jsp', options: { fontFace: 'Consolas', color: EMERALD } },
    ],
    [
      { text: 'PrivacyPurgeServlet', options: { bold: true, color: WHITE } },
      { text: '/privacy', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'Live PII redaction verifier, automated TTL expiration purge, one-click delete all user data & audit log display', options: { color: WHITE } },
      { text: 'privacy.jsp', options: { fontFace: 'Consolas', color: EMERALD } },
    ],
  ];

  s5.addTable(servletRows, {
    x: 0.6, y: 2.48, w: 12.13, h: 4.35,
    colW: [2.45, 1.35, 6.23, 2.1],
    fontSize: 10, fontFace: 'Calibri',
    fill: { color: SURFACE },
    border: { type: 'solid', color: BORDER, pt: 0.75 },
    valign: 'middle',
    margin: [5, 7, 5, 7],
  });

  // =========================================================================
  // SLIDE 6: Java Swing Desktop GUI Launcher (Full Uncropped Visual)
  // =========================================================================
  const s6 = pres.addSlide();
  addHeader(s6, '05 / Java GUI Rubric & Dual-Client Innovation', 'Java Swing Desktop Application Sharing the Same Core & JDBC Layer', 6);

  if (fs.existsSync(imgSwing)) {
    s6.addShape(pres.ShapeType.roundRect, {
      x: 0.6, y: 1.4, w: 8.35, h: 4.82,
      fill: { color: SURFACE }, line: { color: INDIGO, width: 1.4 }, rectRadius: 0.06,
    });
    s6.addImage({ path: imgSwing, x: 0.68, y: 1.48, w: 8.19, h: 4.61 });
  }
  s6.addText('Full-window view of CareerPulseDesktopApp (Nimbus Look & Feel · Launch: mvn compile exec:java)', {
    x: 0.6, y: 6.32, w: 8.35, h: 0.35, fontSize: 9.5, italic: true, color: MUTED,
  });

  // Right highlights card
  s6.addShape(pres.ShapeType.roundRect, {
    x: 9.18, y: 1.4, w: 3.55, h: 5.35,
    fill: { color: CARD }, line: { color: BORDER, width: 1 }, rectRadius: 0.08,
  });
  s6.addText('Swing Architecture', { x: 9.4, y: 1.6, w: 3.1, h: 0.3, fontSize: 13, bold: true, color: CYAN });
  const swingPts = [
    '• 4-Tab JTabbedPane: Analyzer, JDBC History, Validation Lab, Privacy Inspector',
    '• Strict MVC Separation: DesktopAuditController isolates business logic from JFrame',
    '• Responsive EDT: All scoring, JDBC & benchmark runs execute via SwingWorker',
    '• Reusable TableModels: Fix, History & Benchmark AbstractTableModels',
    '• Zero Duplication: Calls exact same Core Java & JDBC DAOs as Tomcat Servlets',
    '• Headless CI Verified: SwingGuiModelTest passes in JUnit 5 without X11',
  ];
  s6.addText(swingPts.join('\n\n'), {
    x: 9.4, y: 2.02, w: 3.12, h: 4.5, fontSize: 9.8, color: WHITE, lineSpacing: 14,
  });

  // =========================================================================
  // SLIDE 7: Full-Page Web Workbench — Upload, Engine & Privacy Controls
  // =========================================================================
  const s7 = pres.addSlide();
  addHeader(s7, '06 / Live Interface — Ingestion & Privacy Controls', 'Full-Page PDF Upload Workbench with Offline Engine & TTL Governance', 7);

  if (fs.existsSync(imgUpload)) {
    s7.addShape(pres.ShapeType.roundRect, {
      x: 0.6, y: 1.4, w: 8.35, h: 4.82,
      fill: { color: SURFACE }, line: { color: CYAN, width: 1.4 }, rectRadius: 0.06,
    });
    s7.addImage({ path: imgUpload, x: 0.68, y: 1.48, w: 8.19, h: 4.61 });
  }
  s7.addText('Uncropped full-page view: PDF upload, Offline Deterministic Engine toggle, PII masking ON, and 24-Hour TTL policy', {
    x: 0.6, y: 6.32, w: 8.35, h: 0.35, fontSize: 9.5, italic: true, color: MUTED,
  });

  s7.addShape(pres.ShapeType.roundRect, {
    x: 9.18, y: 1.4, w: 3.55, h: 5.35,
    fill: { color: CARD }, line: { color: BORDER, width: 1 }, rectRadius: 0.08,
  });
  s7.addText('Key UX Safeguards', { x: 9.4, y: 1.6, w: 3.1, h: 0.3, fontSize: 13, bold: true, color: EMERALD });
  const uploadPts = [
    '• Multi-Format Ingestion: Plain Text, Markdown & multipart resume uploads',
    '• 100% Offline Engine: Deterministic Local mode runs with zero external API keys',
    '• Standalone CLI Parity: Audit local files or run --self-test from terminal',
    '• Privacy by Default: PII redaction checkbox enabled before analysis & persistence',
    '• Explicit TTL Control: EPHEMERAL (no storage), HOURS_24, or DAYS_7 auto-expiry',
    '• Clean 4-View Navigation: Analyzer, Audit History, Validation Lab, Privacy & Docs',
  ];
  s7.addText(uploadPts.join('\n\n'), {
    x: 9.4, y: 2.02, w: 3.12, h: 4.5, fontSize: 9.8, color: WHITE, lineSpacing: 14,
  });

  // =========================================================================
  // SLIDE 8: Full-Page ATS Report — Before & After Transformation Results
  // =========================================================================
  const s8 = pres.addSlide();
  addHeader(s8, '07 / Live Interface — Before & After ATS Transformation', 'Weighted 5-Dimension Audit, Google XYZ Rewrites & Redaction Verification', 8);

  if (fs.existsSync(imgReport)) {
    s8.addShape(pres.ShapeType.roundRect, {
      x: 0.6, y: 1.4, w: 8.35, h: 4.82,
      fill: { color: SURFACE }, line: { color: EMERALD, width: 1.4 }, rectRadius: 0.06,
    });
    s8.addImage({ path: imgReport, x: 0.68, y: 1.48, w: 8.19, h: 4.61 });
  }
  s8.addText('Uncropped full-page report: 92/100 Strong Alignment, 5 weighted gauges, PII redaction inspector & Before -> After XYZ rewrite', {
    x: 0.6, y: 6.32, w: 8.35, h: 0.35, fontSize: 9.5, italic: true, color: MUTED,
  });

  s8.addShape(pres.ShapeType.roundRect, {
    x: 9.18, y: 1.4, w: 3.55, h: 5.35,
    fill: { color: CARD }, line: { color: BORDER, width: 1 }, rectRadius: 0.08,
  });
  s8.addText('Measured Uplift', { x: 9.4, y: 1.6, w: 3.1, h: 0.3, fontSize: 13, bold: true, color: INDIGO });
  const reportPts = [
    '• Before Score: 64/100 (passive bullets, unquantified work, missing JDBC/Servlet keywords)',
    '• After Score: 92/100 (+28 pts via Google XYZ metrics, active verbs & JD alignment)',
    '• Inspect PII Redaction: Users verify exact sanitized text stored in JDBC/history',
    '• Prioritized Fix Queue: PriorityQueue orders HIGH impact items first with score simulator',
    '• Honest Scope Notice: Explicit disclaimer states scores are heuristic diagnostics, not hiring guarantees',
  ];
  s8.addText(reportPts.join('\n\n'), {
    x: 9.4, y: 2.02, w: 3.12, h: 4.5, fontSize: 9.8, color: WHITE, lineSpacing: 14,
  });

  // =========================================================================
  // SLIDE 9: Empirical Benchmark Validation (12-Resume Labeled Corpus)
  // =========================================================================
  const s9 = pres.addSlide();
  addHeader(s9, '08 / Validation Methodology & Empirical Evidence', '12-Resume Independently Annotated Benchmark Results (Reproducible)', 9);

  // 5 KPI Strip
  const bmKpis = [
    { lbl: 'Labeled Corpus', val: `${benchmark.datasetSize} Resumes`, col: WHITE },
    { lbl: 'Band Accuracy', val: `${benchmark.bandAccuracyPct}%`, col: EMERALD },
    { lbl: 'Mean Abs Error', val: `${benchmark.meanAbsoluteError} pts`, col: CYAN },
    { lbl: 'Spearman Rank ρ', val: `${benchmark.spearmanRho}`, col: INDIGO },
    { lbl: 'Latency p50 / p95', val: `${benchmark.p50LatencyMs} / ${benchmark.p95LatencyMs} ms`, col: AMBER },
  ];
  bmKpis.forEach((k, i) => {
    const x = 0.6 + i * 2.46;
    s9.addShape(pres.ShapeType.roundRect, {
      x, y: 1.36, w: 2.3, h: 0.9,
      fill: { color: CARD }, line: { color: BORDER, width: 1 }, rectRadius: 0.06,
    });
    s9.addText(k.lbl, { x: x + 0.12, y: 1.44, w: 2.06, h: 0.24, fontSize: 9, color: MUTED });
    s9.addText(k.val, { x: x + 0.12, y: 1.7, w: 2.06, h: 0.44, fontSize: 16, bold: true, color: k.col, fontFace: 'Consolas' });
  });

  // Live 12-row Benchmark Table
  const bmRows: pptxgen.TableRow[] = [
    [
      { text: 'ID', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Tier', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Annotated Candidate Profile', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Expected', options: { bold: true, color: WHITE, fill: { color: INDIGO }, align: 'center' } },
      { text: 'Band', options: { bold: true, color: WHITE, fill: { color: INDIGO }, align: 'center' } },
      { text: 'Actual', options: { bold: true, color: WHITE, fill: { color: INDIGO }, align: 'center' } },
      { text: 'Err', options: { bold: true, color: WHITE, fill: { color: INDIGO }, align: 'center' } },
      { text: 'Status', options: { bold: true, color: WHITE, fill: { color: INDIGO }, align: 'center' } },
    ],
    ...benchmark.results.map((r): pptxgen.TableRow => [
      { text: r.id, options: { fontFace: 'Consolas', color: CYAN } },
      { text: r.tier, options: { bold: true, color: r.tier === 'Strong' ? EMERALD : r.tier === 'Weak' ? ROSE : WHITE } },
      { text: r.label, options: { color: WHITE } },
      { text: String(r.expectedScore), options: { fontFace: 'Consolas', color: MUTED, align: 'center' } },
      { text: `${r.minBand}-${r.maxBand}`, options: { fontFace: 'Consolas', color: MUTED, align: 'center' } },
      { text: String(r.predictedScore), options: { fontFace: 'Consolas', bold: true, color: WHITE, align: 'center' } },
      { text: String(r.absoluteError), options: { fontFace: 'Consolas', color: MUTED, align: 'center' } },
      { text: r.withinBand ? 'PASS' : 'OUT', options: { bold: true, color: r.withinBand ? EMERALD : ROSE, align: 'center' } },
    ]),
  ];

  s9.addTable(bmRows, {
    x: 0.6, y: 2.42, w: 12.13, h: 3.92,
    colW: [0.85, 1.35, 4.93, 1.05, 1.2, 0.95, 0.75, 1.05],
    fontSize: 9.2, fontFace: 'Calibri',
    fill: { color: SURFACE },
    border: { type: 'solid', color: BORDER, pt: 0.5 },
    valign: 'middle',
    margin: [2, 5, 2, 5],
  });

  // Explicit Non-Recruitment Scope Disclaimer
  s9.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 6.46, w: 12.13, h: 0.52,
    fill: { color: '172033' }, line: { color: AMBER, width: 1 }, rectRadius: 0.05,
  });
  s9.addText(
    'Scope Disclaimer: Benchmark metrics validate deterministic heuristic calibration across 4 quality tiers — scores are diagnostic indicators, not verified hiring outcomes.',
    { x: 0.75, y: 6.55, w: 11.8, h: 0.34, fontSize: 9.5, italic: true, color: WHITE }
  );

  // =========================================================================
  // SLIDE 10: Privacy, PII Redaction & Access Governance
  // =========================================================================
  const s10 = pres.addSlide();
  addHeader(s10, '09 / Data Protection & Privacy Governance', 'Automated PII Redaction, Owner Isolation, TTL Retention & Purge Audit', 10);

  // Top: Live Before/After PII Redaction Proof
  s10.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 1.4, w: 5.85, h: 2.05,
    fill: { color: SURFACE }, line: { color: ROSE, width: 1.2 }, rectRadius: 0.08,
  });
  s10.addText('BEFORE REDACTION (Raw Uploaded Resume Text)', {
    x: 0.8, y: 1.54, w: 5.45, h: 0.28, fontSize: 10.5, bold: true, color: ROSE,
  });
  s10.addText(sampleRawPii, {
    x: 0.8, y: 1.9, w: 5.45, h: 1.35, fontSize: 10.5, color: WHITE, fontFace: 'Consolas', lineSpacing: 16,
  });

  s10.addText('➔', { x: 6.48, y: 2.2, w: 0.36, h: 0.4, fontSize: 20, bold: true, color: EMERALD, align: 'center' });

  s10.addShape(pres.ShapeType.roundRect, {
    x: 6.88, y: 1.4, w: 5.85, h: 2.05,
    fill: { color: SURFACE }, line: { color: EMERALD, width: 1.2 }, rectRadius: 0.08,
  });
  s10.addText(`AFTER REGEX REDACTOR (${redactionDemo.totalMaskedCount} PII Items Masked Offline Before Storage)`, {
    x: 7.08, y: 1.54, w: 5.45, h: 0.28, fontSize: 10.5, bold: true, color: EMERALD,
  });
  s10.addText(redactionDemo.redactedText, {
    x: 7.08, y: 1.9, w: 5.45, h: 1.35, fontSize: 10.5, color: EMERALD, fontFace: 'Consolas', lineSpacing: 16,
  });

  // Bottom: 4 Governance Pillar Cards
  const pillars = [
    {
      title: 'PBKDF2-SHA256 & CSRF',
      col: INDIGO,
      body: '120,000-iteration salted PBKDF2 password hashing with constant-time verify(), session ID rotation on login, and per-session CSRF token checks in SecurityAndPrivacyFilter.',
    },
    {
      title: 'Owner-Scoped Isolation',
      col: CYAN,
      body: 'Every JDBC SELECT and DELETE filters by authenticated user_id (WHERE r.id = ? AND res.user_id = ?); cross-user access attempts return 403/404 and are tested in JUnit 5.',
    },
    {
      title: 'Configurable Retention TTL',
      col: AMBER,
      body: 'Users explicitly select EPHEMERAL (zero database persistence), HOURS_24 (default auto-expiry), or DAYS_7. deleteExpiredResumes() purges stale rows deterministically.',
    },
    {
      title: 'One-Click Purge & Audit Log',
      col: EMERALD,
      body: 'PrivacyPurgeServlet and Swing Privacy tab support permanent deletion of all owned resumes/reports while recording every action in audit_access_logs.',
    },
  ];

  pillars.forEach((p, idx) => {
    const x = 0.6 + idx * 3.09;
    s10.addShape(pres.ShapeType.roundRect, {
      x, y: 3.8, w: 2.88, h: 3.05,
      fill: { color: CARD }, line: { color: p.col, width: 1.2 }, rectRadius: 0.08,
    });
    s10.addText(p.title, { x: x + 0.16, y: 3.98, w: 2.56, h: 0.35, fontSize: 11.5, bold: true, color: p.col });
    s10.addText(p.body, { x: x + 0.16, y: 4.42, w: 2.56, h: 2.25, fontSize: 9.8, color: WHITE, lineSpacing: 15 });
  });

  // =========================================================================
  // SLIDE 11: Code Quality, Automated Testing & CI Pipeline
  // =========================================================================
  const s11 = pres.addSlide();
  addHeader(s11, '10 / Code Quality, Testing & Continuous Integration', 'Checkstyle Standards, Javadoc Coverage, 7 JUnit 5 Suites & Pure Java 17 CI', 11);

  // Left: Code Quality Standards
  s11.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 1.4, w: 4.8, h: 5.45,
    fill: { color: SURFACE }, line: { color: BORDER, width: 1 }, rectRadius: 0.08,
  });
  s11.addText('Code Quality & Modularity', { x: 0.85, y: 1.6, w: 4.3, h: 0.32, fontSize: 13, bold: true, color: CYAN });
  const qualityList = [
    '• Pure 9-Package Standard Maven Java 17 Layout:\n  model · exception · privacy · engine · dao · web · gui · cli · util',
    '• Checkstyle Enforcement:\n  config/checkstyle/checkstyle.xml verifies naming, Javadocs, brace hygiene, no wildcard imports & zero tabs',
    '• Javadoc Documentation:\n  Class-level & method-level Javadocs generated via mvn javadoc:javadoc',
    '• Zero External API Keys:\n  100% offline deterministic scoring; optional MySQL DB_URL/USER/PASSWORD via env vars with H2 auto-fallback',
    '• GitHub Actions Pure Java 17 CI:\n  Checkstyle -> 7 JUnit 5 Suites -> CLI --self-test -> Javadoc -> Tomcat 10+ WAR artifact',
  ];
  s11.addText(qualityList.join('\n\n'), {
    x: 0.85, y: 2.02, w: 4.3, h: 4.6, fontSize: 9.8, color: WHITE, lineSpacing: 14,
  });

  // Right: Automated Test Matrix Table
  const testRows: pptxgen.TableRow[] = [
    [
      { text: 'Test Suite', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Framework', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Verified Capabilities', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
    ],
    [
      { text: 'CoreJavaOopAndRedactionTest', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'JUnit 5', options: { color: EMERALD, bold: true } },
      { text: 'OOP hierarchy, PriorityQueue ranking, RegexPiiRedactor, PBKDF2 hashing', options: { color: WHITE } },
    ],
    [
      { text: 'DeterministicScoringEngineTest', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'JUnit 5', options: { color: EMERALD, bold: true } },
      { text: 'Offline reproducibility, strong > weak ranking, 5 category weights', options: { color: WHITE } },
    ],
    [
      { text: 'JdbcDaoIntegrationTest', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'JUnit 5 + H2', options: { color: EMERALD, bold: true } },
      { text: 'Atomic commit/rollback, owner-scoped isolation, TTL expiry & purge', options: { color: WHITE } },
    ],
    [
      { text: 'BenchmarkValidationTest', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'JUnit 5', options: { color: EMERALD, bold: true } },
      { text: 'Asserts MAE <= 10, Band Acc >= 75%, Spearman rho >= 0.85, latency', options: { color: WHITE } },
    ],
    [
      { text: 'ServletControllerTest', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'JUnit 5 + Mockito', options: { color: EMERALD, bold: true } },
      { text: 'Servlet POST/GET routing, Java 17 JSON serialization & 401 purge guard', options: { color: WHITE } },
    ],
    [
      { text: 'SwingGuiModelTest', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'JUnit 5 (Headless)', options: { color: EMERALD, bold: true } },
      { text: 'DesktopAuditController + Fix, History & Benchmark Swing TableModels', options: { color: WHITE } },
    ],
    [
      { text: 'StandaloneTesterTest', options: { fontFace: 'Consolas', color: CYAN } },
      { text: 'JUnit 5 (Offline)', options: { color: AMBER, bold: true } },
      { text: 'CLI --self-test, --file local resume audit & Instant-safe JsonSupport', options: { color: WHITE } },
    ],
  ];

  s11.addTable(testRows, {
    x: 5.65, y: 1.4, w: 7.08, h: 5.45,
    colW: [2.45, 1.35, 3.28],
    fontSize: 9.2, fontFace: 'Calibri',
    fill: { color: SURFACE },
    border: { type: 'solid', color: BORDER, pt: 0.75 },
    valign: 'middle',
    margin: [4, 6, 4, 6],
  });

  // =========================================================================
  // SLIDE 12: Teamwork, Collaboration & Submission Quick-Start
  // =========================================================================
  const s12 = pres.addSlide();
  addHeader(s12, '11 / Teamwork, Collaboration & Deployment', 'Team Moshdi Ownership Matrix, Git Workflow & Execution Guide', 12);

  // Top: Team Moshdi Contribution Table
  const teamRows: pptxgen.TableRow[] = [
    [
      { text: 'Role', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Lead / Track', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
      { text: 'Delivered Modules & Artifacts', options: { bold: true, color: WHITE, fill: { color: INDIGO } } },
    ],
    [
      { text: 'Project Lead & Core Architect', options: { bold: true, color: CYAN } },
      { text: 'Shivam Kumar', options: { bold: true, color: WHITE } },
      { text: 'Core Java 17 OOP hierarchy, 5-strategy scoring engine, Checkstyle/Maven build, integration & final deck', options: { color: WHITE } },
    ],
    [
      { text: 'Database & Persistence Lead', options: { bold: true, color: CYAN } },
      { text: 'Team Moshdi — JDBC Track', options: { color: WHITE } },
      { text: '5-table schema.sql, DatabaseConnectionManager (MySQL 8 + H2 fallback), atomic transactional DAOs', options: { color: WHITE } },
    ],
    [
      { text: 'Web Servlets & Swing GUI Lead', options: { bold: true, color: CYAN } },
      { text: 'Team Moshdi — UI & Web Track', options: { color: WHITE } },
      { text: '5 Jakarta EE 10 Servlets, SecurityAndPrivacyFilter, 6 JSTL JSP views & 4-tab Java Swing Desktop GUI', options: { color: WHITE } },
    ],
    [
      { text: 'QA, Benchmarks & Privacy Lead', options: { bold: true, color: CYAN } },
      { text: 'Team Moshdi — QA & Security Track', options: { color: WHITE } },
      { text: '12-resume BenchmarkValidator, RegexPiiRedactor, PBKDF2 hashing, 6 JUnit 5/Mockito suites & CI pipeline', options: { color: WHITE } },
    ],
  ];

  s12.addTable(teamRows, {
    x: 0.6, y: 1.4, w: 12.13, h: 2.75,
    colW: [2.7, 2.55, 6.88],
    fontSize: 10, fontFace: 'Calibri',
    fill: { color: SURFACE },
    border: { type: 'solid', color: BORDER, pt: 0.75 },
    valign: 'middle',
    margin: [5, 7, 5, 7],
  });

  // Bottom Left: Collaboration Hygiene
  s12.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 4.42, w: 5.9, h: 2.45,
    fill: { color: CARD }, line: { color: INDIGO, width: 1.2 }, rectRadius: 0.08,
  });
  s12.addText('GitHub Collaboration & Documentation Standards', {
    x: 0.85, y: 4.6, w: 5.4, h: 0.3, fontSize: 12, bold: true, color: INDIGO,
  });
  s12.addText(
    '• CONTRIBUTING.md defines branch naming, Checkstyle & PR review gates\n' +
    '• .github/PULL_REQUEST_TEMPLATE.md & Bug/Feature Issue templates\n' +
    '• Semantic commit history separated by module (core, jdbc, servlets, gui, tests, docs)\n' +
    '• Synchronized docs: README.md, ARCHITECTURE_UML.md, VALIDATION_METHODOLOGY.md, PRIVACY_AND_SECURITY.md',
    { x: 0.85, y: 4.98, w: 5.4, h: 1.75, fontSize: 9.8, color: WHITE, lineSpacing: 16 }
  );

  // Bottom Right: Verifier Quick-Start Commands
  s12.addShape(pres.ShapeType.roundRect, {
    x: 6.78, y: 4.42, w: 5.95, h: 2.45,
    fill: { color: SURFACE }, line: { color: EMERALD, width: 1.2 }, rectRadius: 0.08,
  });
  s12.addText('Evaluator Quick-Start Commands (Zero Setup)', {
    x: 7.0, y: 4.6, w: 5.5, h: 0.3, fontSize: 12, bold: true, color: EMERALD,
  });
  s12.addText(
    '# 1. Checkstyle, 7 JUnit 5 + Mockito Suites & Tomcat 10+ WAR\n' +
    'mvn checkstyle:check && mvn clean test package\n\n' +
    '# 2. Zero-API-Key Standalone CLI Tester (--self-test / --file)\n' +
    'mvn compile exec:java -Dexec.mainClass=com.careerpulse.cli.CareerPulseStandaloneTester\n\n' +
    '# 3. Launch Java Swing Desktop GUI (H2 Auto-Fallback Ready)\n' +
    'mvn compile exec:java',
    { x: 7.0, y: 4.98, w: 5.5, h: 1.75, fontSize: 9.2, color: CYAN, fontFace: 'Consolas', lineSpacing: 13.5 }
  );

  const outDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, 'CareerPulse_Java_Enterprise_Presentation.pptx');
  await pres.writeFile({ fileName: outPath });
  console.log('Generated 12-slide presentation:', outPath);
}

buildRubricPresentation().catch((err) => {
  console.error('Failed to generate PPTX:', err);
  process.exit(1);
});
