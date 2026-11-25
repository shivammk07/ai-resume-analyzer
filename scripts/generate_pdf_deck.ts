import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { runBenchmarkValidationSuite } from '../src/server/benchmarkSuite';
import { redactResumePii } from '../src/server/piiRedactor';

/**
 * Generates the standalone 13-slide CareerPulse Presentation in PDF format (.pdf)
 * synchronized 100% with the current codebase & architecture:
 *   - Pure Maven Java 17 Core (9 packages, 7 JUnit 5 suites, Swing GUI, Tomcat WAR, Offline CLI)
 *   - Zero external API keys & zero camera permissions
 *   - Universal All-Format Offline Document Parser (PDF, DOCX, DOC, ODT, RTF, HTML, JSON, LaTeX, Image OCR)
 *   - After-Analyze "Write This Instead" Upgrade Studio
 *   - Interactive ATS Resume Builder (3 templates, 4 accent palettes, Live ATS Meter, PDF/Word/TXT export)
 *
 * Output: docs/CareerPulse_Java_Enterprise_Presentation.pdf
 * Run:    npx tsx scripts/generate_pdf_deck.ts
 */

const W = 960;
const H = 540;
const TOTAL_SLIDES = 13;

const C = {
  BG: '#0B0F19',
  SURFACE: '#111827',
  CARD: '#162033',
  DARK_BOX: '#0E1525',
  BORDER: '#24324B',
  WHITE: '#F8FAFC',
  TEXT: '#E2E8F0',
  MUTED: '#94A3B8',
  INDIGO: '#6366F1',
  INDIGO_DARK: '#3730A3',
  CYAN: '#06B6D4',
  EMERALD: '#10B981',
  AMBER: '#F59E0B',
  ROSE: '#F43F5E',
  PAPER: '#FFFFFF',
  INK: '#0F172A',
  INK_MUTED: '#475569',
};

function drawRoundedCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: string,
  strokeColor: string = C.BORDER,
  radius = 8,
  lineWidth = 1
) {
  doc.save();
  doc.lineWidth(lineWidth).roundedRect(x, y, w, h, radius).fillAndStroke(fillColor, strokeColor);
  doc.restore();
}

function drawSlideChrome(
  doc: PDFKit.PDFDocument,
  sectionTag: string,
  title: string,
  slideNum: number
) {
  doc.rect(0, 0, W, H).fill(C.BG);
  doc.rect(0, 0, W, 4).fill(C.INDIGO);

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(C.CYAN)
    .text(sectionTag.toUpperCase(), 42, 20, { width: W - 84, characterSpacing: 0.9 });

  doc
    .font('Helvetica-Bold')
    .fontSize(19.5)
    .fillColor(C.WHITE)
    .text(title, 42, 35, { width: W - 84, lineBreak: false, ellipsis: true });

  doc
    .save()
    .moveTo(42, 66)
    .lineTo(W - 42, 66)
    .lineWidth(0.8)
    .strokeColor(C.BORDER)
    .stroke()
    .restore();

  doc
    .save()
    .moveTo(42, H - 30)
    .lineTo(W - 42, H - 30)
    .lineWidth(0.5)
    .strokeColor(C.BORDER)
    .stroke()
    .restore();

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(C.MUTED)
    .text(
      'CareerPulse  |  Java 17 / JDBC / Jakarta EE 10 / Swing / Offline CLI & Resume Studio  |  Team Moshdi (Lead: Shivam Kumar)',
      42,
      H - 22,
      { width: 760, lineBreak: false }
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(C.INDIGO)
    .text(`${slideNum} / ${TOTAL_SLIDES}`, W - 122, H - 22, { width: 80, align: 'right', lineBreak: false });
}

interface TableCell {
  text: string;
  color?: string;
  bold?: boolean;
  mono?: boolean;
  align?: 'left' | 'center' | 'right';
}

function drawTable(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  colWidths: number[],
  headers: string[],
  rows: TableCell[][],
  options?: {
    headerHeight?: number;
    rowHeight?: number;
    fontSize?: number;
    headerFontSize?: number;
  }
) {
  const headerH = options?.headerHeight ?? 24;
  const rowH = options?.rowHeight ?? 36;
  const fontSize = options?.fontSize ?? 8.4;
  const headerFontSize = options?.headerFontSize ?? 8.8;
  const totalW = colWidths.reduce((a, b) => a + b, 0);

  doc.save();
  doc.roundedRect(x, y, totalW, headerH, 4).fill(C.INDIGO);
  doc.restore();

  let cx = x;
  headers.forEach((h, i) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(headerFontSize)
      .fillColor(C.WHITE)
      .text(h, cx + 6, y + (headerH - headerFontSize) / 2 - 1, {
        width: colWidths[i] - 12,
        align: rows[0]?.[i]?.align || 'left',
        lineBreak: false,
        ellipsis: true,
      });
    cx += colWidths[i];
  });

  let cy = y + headerH;
  rows.forEach((row, rIdx) => {
    const bg = rIdx % 2 === 0 ? C.SURFACE : C.CARD;
    doc.save();
    doc.rect(x, cy, totalW, rowH).fill(bg);
    doc
      .moveTo(x, cy + rowH)
      .lineTo(x + totalW, cy + rowH)
      .lineWidth(0.5)
      .strokeColor(C.BORDER)
      .stroke();
    doc.restore();

    let cellX = x;
    row.forEach((cell, cIdx) => {
      const fontName = cell.mono
        ? cell.bold
          ? 'Courier-Bold'
          : 'Courier'
        : cell.bold
        ? 'Helvetica-Bold'
        : 'Helvetica';
      doc
        .font(fontName)
        .fontSize(fontSize)
        .fillColor(cell.color || C.TEXT)
        .text(cell.text, cellX + 6, cy + 5, {
          width: colWidths[cIdx] - 12,
          height: rowH - 8,
          align: cell.align || 'left',
          lineGap: 1.5,
        });
      cellX += colWidths[cIdx];
    });

    cy += rowH;
  });

  doc.save();
  doc
    .rect(x, y, totalW, headerH + rows.length * rowH)
    .lineWidth(0.8)
    .strokeColor(C.BORDER)
    .stroke();
  doc.restore();
}

function drawMiniNavbar(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  activeTab: 'Analyzer' | 'Resume Builder'
) {
  doc.save();
  doc.roundedRect(x, y, w, 28, 6).fill('#090D16');
  doc.moveTo(x, y + 28).lineTo(x + w, y + 28).lineWidth(0.7).strokeColor(C.BORDER).stroke();
  doc.restore();

  // Logo icon + wordmark
  drawRoundedCard(doc, x + 10, y + 6, 16, 16, C.INDIGO, C.INDIGO, 3);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.WHITE).text('C', x + 10, y + 10, { width: 16, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.WHITE).text('CareerPulse', x + 31, y + 9);

  // 5 Nav links
  const tabs = ['Analyzer', 'Resume Builder', 'Audit History', 'Validation Lab', 'Privacy & Docs'];
  let tx = x + 104;
  tabs.forEach((t) => {
    const isActive = t === activeTab;
    const tw = t.length * 4.1 + 10;
    doc
      .font(isActive ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(7.0)
      .fillColor(isActive ? C.WHITE : C.MUTED)
      .text(t, tx, y + 10, { width: tw, align: 'center', lineBreak: false });
    if (isActive) {
      doc.rect(tx + 4, y + 25, tw - 8, 2).fill(C.INDIGO);
    }
    tx += tw + 2;
  });

  // Right CTA
  drawRoundedCard(doc, x + w - 82, y + 5, 72, 18, C.INDIGO, C.INDIGO, 4);
  doc
    .font('Helvetica-Bold')
    .fontSize(7.0)
    .fillColor(C.WHITE)
    .text(activeTab === 'Resume Builder' ? 'Explore Samples' : 'Create Resume', x + w - 82, y + 10, {
      width: 72,
      align: 'center',
      lineBreak: false,
    });
}

async function generatePdfPresentation() {
  const benchmark = runBenchmarkValidationSuite();
  const sampleRawPii =
    'Priya Nair | Email: priya.nair@example.com | Phone: (415) 555-0192 | ' +
    'SSN: 123-45-6789 | DOB: 04/12/1996 | Address: 742 Evergreen Terrace Street';
  const redactionDemo = redactResumePii(sampleRawPii);

  const imgSwing = path.resolve(process.cwd(), 'docs/screenshots/swing-desktop-gui.jpg');

  const outDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, 'CareerPulse_Java_Enterprise_Presentation.pdf');

  const doc = new PDFDocument({
    size: [W, H],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: 'CareerPulse — Offline Java 17 ATS Resume Analyzer, Rewrite Studio & Resume Builder',
      Author: 'Shivam Kumar (Team Moshdi)',
      Subject: 'Updated Architecture & Codebase Presentation (PDF Format)',
      Keywords: 'Java 17, Maven, JDBC, Jakarta EE, Swing, Offline CLI, All-Format Parser, Resume Builder, Zero API Key',
    },
  });

  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  // =========================================================================
  // SLIDE 1: Title & Updated Platform Identity
  // =========================================================================
  doc.rect(0, 0, W, H).fill(C.BG);
  doc.rect(0, 0, 14, H).fill(C.INDIGO);

  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor(C.CYAN)
    .text('100% OFFLINE · ZERO API KEYS · JAVA 17 ENTERPRISE & RESUME STUDIO', 58, 52, {
      characterSpacing: 1.3,
    });

  doc.font('Helvetica-Bold').fontSize(44).fillColor(C.WHITE).text('CareerPulse', 58, 76);

  doc
    .font('Helvetica')
    .fontSize(14)
    .fillColor(C.MUTED)
    .text(
      'All-Format Offline ATS Resume Analyzer, "Write This Instead" Advisor & Interactive Resume Builder\nCore Java 17 OOP · JDBC DAO (MySQL 8 + H2) · Jakarta EE 10 Servlets/JSP · Swing GUI · Standalone CLI',
      58,
      136,
      { width: 844, lineGap: 6 }
    );

  drawRoundedCard(doc, 58, 218, 844, 78, C.CARD, C.BORDER, 8, 1.2);
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(C.WHITE)
    .text('Team Moshdi  ·  Project Lead & Core Architect: Shivam Kumar', 78, 234, { width: 804 });
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(C.CYAN)
    .text(
      'Zero External API Keys  ·  Zero Camera Permissions  ·  All Formats Offline (PDF/DOCX/DOC/ODT/RTF/Image OCR)  ·  3-Template Resume Builder',
      78,
      258,
      { width: 804 }
    );

  const heroStats = [
    {
      val: '9 Pkgs',
      lbl: 'Pure Maven Java 17 Core',
      sub: '43 Java Classes + 7 JUnit 5 Suites',
      accent: C.INDIGO,
    },
    {
      val: '15+ Fmts',
      lbl: 'All-Format Offline Parser',
      sub: 'PDF, DOCX, DOC, ODT, RTF & OCR',
      accent: C.CYAN,
    },
    {
      val: `${benchmark.bandAccuracyPct}%`,
      lbl: '12-Resume Band Accuracy',
      sub: `MAE ${benchmark.meanAbsoluteError} · Spearman rho ${benchmark.spearmanRho}`,
      accent: C.EMERALD,
    },
    {
      val: '3 Modes',
      lbl: 'Analyze · Rewrite · Build',
      sub: `Offline p50: ${benchmark.p50LatencyMs} ms · 0 API Keys`,
      accent: C.AMBER,
    },
  ];

  heroStats.forEach((st, idx) => {
    const x = 58 + idx * 216;
    drawRoundedCard(doc, x, 330, 196, 138, C.SURFACE, st.accent, 8, 1.2);
    doc.font('Helvetica-Bold').fontSize(23).fillColor(st.accent).text(st.val, x + 16, 348, { width: 164 });
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C.WHITE).text(st.lbl, x + 16, 392, { width: 164 });
    doc.font('Helvetica').fontSize(8.8).fillColor(C.MUTED).text(st.sub, x + 16, 416, { width: 164, lineGap: 2 });
  });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(C.MUTED)
    .text('GitHub Repository: github.com/shivammk07/ai-resume-analyzer  ·  Updated Architecture PDF Deck', 58, H - 24);
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(C.INDIGO)
    .text(`1 / ${TOTAL_SLIDES}`, W - 122, H - 24, { width: 80, align: 'right' });

  // =========================================================================
  // SLIDE 2: Exact Current Codebase & Project Structure Map
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '01 / Current Repository & Codebase Structure',
    'Pure Standard Maven Java 17 Core + Interactive Offline Web Preview Studio',
    2
  );

  // Left card: Pure Standard Maven Java 17 Tree
  drawRoundedCard(doc, 42, 82, 434, 412, C.SURFACE, C.INDIGO, 8, 1.2);
  doc.font('Helvetica-Bold').fontSize(11.2).fillColor(C.INDIGO).text('Pure Standard Maven Java 17 Core (GitHub Repo)', 58, 96);
  doc
    .font('Courier')
    .fontSize(7.9)
    .fillColor(C.TEXT)
    .text(
      'pom.xml                               # Java 17, WAR, Checkstyle, JUnit 5\n' +
        'config/checkstyle/checkstyle.xml      # Strict code style enforcement\n' +
        '.github/workflows/ci.yml              # Pure Java 17 Maven CI pipeline\n' +
        'src/main/java/com/careerpulse/\n' +
        '  |-- model/       (12 classes)       # Analyzable, Resume/JD, BuilderProfile\n' +
        '  |-- engine/      (10 classes)       # 5 Scorers, RewriteAdvisor, DocBuilder\n' +
        '  |-- dao/         (6 classes)        # MySQL 8 + H2 JDBC DAOs & Transactions\n' +
        '  |-- web/         (7 classes)        # 6 Jakarta EE 10 Servlets + SecurityFilter\n' +
        '  |-- gui/         (3 classes)        # 5-Tab Java Swing App + Bio-Data Builder\n' +
        '  |-- cli/         (1 class)          # CareerPulseStandaloneTester (0 API Key)\n' +
        '  |-- privacy/     (3 classes)        # RegexPiiRedactor + PBKDF2 PasswordHasher\n' +
        '  |-- exception/   (4 classes)        # Custom Checked/Runtime Hierarchy\n' +
        '  `-- util/        (2 classes)        # JsonSupport + DocumentTextExtractor\n' +
        'src/main/webapp/WEB-INF/views/        # 7 JSTL-escaped JSP views + web.xml\n' +
        'src/test/java/com/careerpulse/        # 8 JUnit 5 + Mockito + H2 Test Suites\n' +
        'docs/                                 # UML, Privacy, Validation, PDF Deck & Screens',
      56,
      118,
      { width: 406, lineGap: 3.3 }
    );

  // Right card: Interactive Web Studio & New Modules
  drawRoundedCard(doc, 494, 82, 424, 246, C.SURFACE, C.CYAN, 8, 1.2);
  doc.font('Helvetica-Bold').fontSize(11.2).fillColor(C.CYAN).text('Interactive Offline Web Studio Modules', 510, 96);
  doc
    .font('Courier')
    .fontSize(7.9)
    .fillColor(C.TEXT)
    .text(
      'server.ts                             # Express offline API (zero API keys)\n' +
        'src/server/\n' +
        '  |-- documentParser.ts               # NEW: PDF/DOCX/DOC/ODT/RTF/Image OCR\n' +
        '  |-- deterministicEngine.ts          # NEW: +suggestedSummary & keywordLines\n' +
        '  |-- piiRedactor.ts                  # Offline regex PII masking\n' +
        '  |-- benchmarkSuite.ts               # 12-resume labeled validation corpus\n' +
        '  `-- auditStore.ts                   # Owner-scoped TTL retention store\n' +
        'src/components/\n' +
        '  |-- ResumeUploader.tsx              # NEW: All-format upload, 0 camera\n' +
        '  |-- SuggestedRewriteStudio.tsx      # NEW: "Write This Instead" upgrades\n' +
        '  |-- ResumeBuilder.tsx               # NEW: 3-template ATS Resume Creator\n' +
        '  `-- Navbar, ScoreGauge, ValidationLab, AuditHistory, PrivacyGovernance\n' +
        'src/utils/resumeBuilderHelpers.ts     # NEW: Presets, live ATS meter & export',
      508,
      118,
      { width: 396, lineGap: 3.1 }
    );

  // Bottom Right highlight: Architectural Guarantees
  drawRoundedCard(doc, 494, 342, 424, 152, C.CARD, C.EMERALD, 8, 1.2);
  doc.font('Helvetica-Bold').fontSize(10.8).fillColor(C.EMERALD).text('Key Structural Improvements Completed', 510, 356);
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(C.WHITE)
    .text(
      '• Removed all external Gemini API key dependencies & camera permissions across Java & Web\n' +
        '• Added Java 17 Instant-safe JsonSupport fixing Gson reflection crashes in CI\n' +
        '• Added CareerPulseStandaloneTester CLI (--self-test, --file, --interactive)\n' +
        '• Upgraded document ingestion to parse 15+ formats offline (unpdf, mammoth, adm-zip, Tesseract)\n' +
        '• Added complete Analyze -> Write This Instead -> Create & Export Resume loop',
      510,
      378,
      { width: 392, lineGap: 3.5 }
    );

  // =========================================================================
  // SLIDE 3: Core Java 17 OOP, Strategy Pattern & Standalone CLI
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '02 / Core Java 17 OOP Architecture & Offline CLI',
    'Interfaces, Inheritance, 5 Scoring Strategies, JsonSupport & Standalone CLI',
    3
  );

  // Left: Domain OOP Hierarchy
  drawRoundedCard(doc, 42, 82, 424, 412, C.SURFACE, C.BORDER, 8);
  doc.font('Helvetica-Bold').fontSize(11.2).fillColor(C.CYAN).text('Domain Inheritance Hierarchy (com.careerpulse.model)', 58, 96);

  drawRoundedCard(doc, 114, 124, 280, 58, C.CARD, C.INDIGO, 6, 1.3);
  doc.font('Courier-Bold').fontSize(8.8).fillColor(C.WHITE).text('<<interface>> Analyzable', 124, 132, { width: 260, align: 'center' });
  doc.font('Courier').fontSize(7.8).fillColor(C.TEXT).text('+getNormalizedContent() · +getWordCount()\n+getTokenFrequencies(): Map<String, Integer>', 124, 148, { width: 260, align: 'center', lineGap: 2 });

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.MUTED).text('^  implements', 114, 187, { width: 280, align: 'center' });

  drawRoundedCard(doc, 98, 202, 312, 62, C.CARD, C.CYAN, 6, 1.3);
  doc.font('Courier-Bold').fontSize(8.8).fillColor(C.WHITE).text('<<abstract>> AbstractDocument', 108, 210, { width: 292, align: 'center' });
  doc.font('Courier').fontSize(7.8).fillColor(C.TEXT).text('#normalizedContent · #createdAt\n+getSectionsDetected(): Set<String>', 108, 226, { width: 292, align: 'center', lineGap: 2 });

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.MUTED).text('^  extends (Concrete Subclasses)', 98, 270, { width: 312, align: 'center' });

  drawRoundedCard(doc, 58, 286, 188, 86, C.CARD, C.EMERALD, 6, 1.2);
  doc.font('Courier-Bold').fontSize(8.5).fillColor(C.EMERALD).text('ResumeDocument', 68, 294);
  doc.font('Courier').fontSize(7.6).fillColor(C.TEXT).text('-userId, piiItemsMasked\n-retentionPolicy, expiresAt\n+getBulletLines(): List', 68, 310, { width: 168, lineGap: 2.5 });

  drawRoundedCard(doc, 262, 286, 188, 86, C.CARD, C.EMERALD, 6, 1.2);
  doc.font('Courier-Bold').fontSize(8.5).fillColor(C.EMERALD).text('JobDescriptionDocument', 272, 294);
  doc.font('Courier').fontSize(7.6).fillColor(C.TEXT).text('-targetTitle, seniority\n-requiredKeywords: Set\n+getRequiredKeywords()', 272, 310, { width: 168, lineGap: 2.5 });

  drawRoundedCard(doc, 58, 386, 392, 46, '#1E1B2E', C.ROSE, 6);
  doc.font('Helvetica-Bold').fontSize(8.3).fillColor(C.ROSE).text('Custom Exceptions:', 68, 394);
  doc.font('Helvetica').fontSize(8).fillColor(C.WHITE).text('CareerPulseException -> DocumentValidation · DatabaseOperation · UnauthorizedAccess', 68, 408, { width: 372 });

  drawRoundedCard(doc, 58, 440, 392, 42, '#10212D', C.AMBER, 6);
  doc.font('Helvetica-Bold').fontSize(8.3).fillColor(C.AMBER).text('Java 17 Util & Standalone CLI:', 68, 448);
  doc.font('Helvetica').fontSize(8).fillColor(C.WHITE).text('JsonSupport (ISO-8601 Instant TypeAdapter) · CareerPulseStandaloneTester (--self-test / --file)', 68, 462, { width: 372 });

  // Right: Polymorphic Strategy & Java Collections
  drawRoundedCard(doc, 484, 82, 434, 412, C.SURFACE, C.BORDER, 8);
  doc.font('Helvetica-Bold').fontSize(11.2).fillColor(C.EMERALD).text('Polymorphic Strategy Pattern (ScoringCriterion)', 500, 96);

  const strategies = [
    { name: 'AtsParsabilityScorer', wt: '25%', desc: 'Standard headings, date ranges, contact signals & layout hygiene' },
    { name: 'QuantifiableImpactScorer', wt: '25%', desc: 'Google XYZ metrics detection (%, $, x, latency, scale figures)' },
    { name: 'KeywordAlignmentScorer', wt: '20%', desc: 'Set intersection & difference against JD requiredKeywords' },
    { name: 'ActionVerbScorer', wt: '15%', desc: 'Strong ownership verbs vs. passive phrasing penalty' },
    { name: 'FormattingReadabilityScorer', wt: '15%', desc: 'Bullet length distribution, brevity & dense-wall detection' },
  ];

  strategies.forEach((st, i) => {
    const sy = 124 + i * 48;
    drawRoundedCard(doc, 500, sy, 402, 41, C.CARD, C.BORDER, 5);
    doc.font('Courier-Bold').fontSize(8.8).fillColor(C.WHITE).text(st.name, 512, sy + 7, { width: 280 });
    doc.font('Courier-Bold').fontSize(8.8).fillColor(C.CYAN).text(st.wt, 830, sy + 7, { width: 60, align: 'right' });
    doc.font('Helvetica').fontSize(8).fillColor(C.MUTED).text(st.desc, 512, sy + 22, { width: 380, lineBreak: false, ellipsis: true });
  });

  drawRoundedCard(doc, 500, 372, 402, 108, '#132238', C.INDIGO, 6, 1.2);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.CYAN).text('Java Collections & EngineMode.DETERMINISTIC_LOCAL', 512, 382);
  doc
    .font('Helvetica')
    .fontSize(8.3)
    .fillColor(C.WHITE)
    .text(
      '• PriorityQueue<FixRecommendation> (Comparable) ranks HIGH -> MEDIUM -> LOW fixes\n' +
        '• LinkedHashMap<String, CategoryScore> preserves deterministic 5-dimension order\n' +
        '• HashSet / Set<String> computes exact matched vs. missing JD skill keywords\n' +
        '• Strictly offline EngineMode.DETERMINISTIC_LOCAL (all external AI code removed)',
      512,
      400,
      { width: 378, lineGap: 3.5 }
    );

  // =========================================================================
  // SLIDE 4: Relational Database & JDBC DAO Layer
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '03 / Database Integration (JDBC & DAO)',
    'Normalized 5-Table Schema, MySQL 8 Primary & Automatic H2 Fallback',
    4
  );

  const erdTables = [
    { name: 'users', x: 42, y: 84, w: 244, h: 118, color: C.INDIGO, cols: 'PK id (BIGINT)\nUK email, display_name\npassword_hash (PBKDF2)\nrole, created_at' },
    { name: 'resumes', x: 318, y: 84, w: 260, h: 140, color: C.CYAN, cols: 'PK id (BIGINT)\nFK user_id -> users(id)\nfilename, redacted_content\npii_items_masked\nretention_policy, expires_at' },
    { name: 'analysis_reports', x: 318, y: 254, w: 260, h: 170, color: C.EMERALD, cols: 'PK id (BIGINT)\nFK resume_id -> resumes(id)\ntarget_role, engine_mode\noverall_score, score_label\n5 category scores + latency\nsummary_json, created_at' },
    { name: 'audit_access_logs', x: 42, y: 230, w: 244, h: 118, color: C.AMBER, cols: 'PK id (BIGINT)\nFK user_id -> users(id)\naction, resource_id\ndetails, created_at' },
    { name: 'benchmark_runs', x: 42, y: 370, w: 244, h: 122, color: C.ROSE, cols: 'PK id (BIGINT)\ndataset_size, mae\nband_accuracy_pct, spearman\np50_latency_ms, p95_latency' },
  ];

  erdTables.forEach((t) => {
    drawRoundedCard(doc, t.x, t.y, t.w, t.h, C.SURFACE, t.color, 6, 1.2);
    doc.save();
    doc.rect(t.x, t.y, t.w, 24).fill(t.color);
    doc.restore();
    doc.font('Courier-Bold').fontSize(9.5).fillColor(C.BG).text(t.name, t.x + 10, t.y + 6, { width: t.w - 20 });
    doc.font('Courier').fontSize(8).fillColor(C.WHITE).text(t.cols, t.x + 10, t.y + 32, { width: t.w - 20, lineGap: 3 });
  });

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.CYAN).text('1 --< N', 286, 126, { width: 32, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.EMERALD).text('1 --< N', 416, 232, { width: 64, align: 'center' });

  drawRoundedCard(doc, 602, 84, 316, 408, C.CARD, C.BORDER, 8);
  doc.font('Helvetica-Bold').fontSize(11.5).fillColor(C.WHITE).text('JDBC & DAO Implementation Highlights', 618, 98, { width: 284 });

  const jdbcBullets = [
    { head: 'Dual-RDBMS Connection Manager', body: 'Reads DB_URL, DB_USER, DB_PASSWORD for MySQL 8; automatically activates embedded H2 in MODE=MySQL when unconfigured.' },
    { head: 'GenericDao<T, ID> Pattern', body: 'Implemented by JdbcUserDao, JdbcAnalysisReportDao, JdbcBenchmarkDao, and JdbcAuditLogDao with JsonSupport serialization.' },
    { head: 'Atomic JDBC Transactions', body: 'saveResumeAndReportTransaction() sets autoCommit(false), inserts resume + report with RETURN_GENERATED_KEYS, commits or rolls back.' },
    { head: '100% Parameterized SQL', body: 'Every DAO query uses PreparedStatement bindings — zero string concatenation, preventing SQL injection.' },
    { head: 'Owner Isolation & TTL Cleanup', body: 'JOIN queries filter by WHERE res.user_id = ?; deleteExpiredResumes(Instant.now()) enforces automated retention expiry.' },
  ];
  jdbcBullets.forEach((b, idx) => {
    const by = 132 + idx * 71;
    doc.font('Helvetica-Bold').fontSize(9.2).fillColor(C.CYAN).text(b.head, 618, by, { width: 284 });
    doc.font('Helvetica').fontSize(8.2).fillColor(C.MUTED).text(b.body, 618, by + 15, { width: 284, lineGap: 2 });
  });

  // =========================================================================
  // SLIDE 5: Jakarta EE 10 Servlets, JSP & Security Filter
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '04 / Servlets & Web Integration (Jakarta EE 10)',
    'Apache Tomcat 10+ Servlet Controllers, Security Filter & JSTL Views',
    5
  );

  const pipeSteps = [
    { lbl: 'HTTP Request', sub: 'Tomcat 10.1+', col: C.MUTED },
    { lbl: 'SecurityFilter', sub: 'CSP · XFO · CSRF', col: C.ROSE },
    { lbl: 'Jakarta Servlet', sub: 'MVC Controller', col: C.INDIGO },
    { lbl: 'Core Engine + DAO', sub: 'PII · Score · JDBC', col: C.CYAN },
    { lbl: 'JSP + JSTL 3.0', sub: '<c:out> Escaped', col: C.EMERALD },
  ];

  pipeSteps.forEach((st, i) => {
    const px = 42 + i * 179;
    drawRoundedCard(doc, px, 84, 158, 56, C.CARD, st.col, 6, 1.3);
    doc.font('Helvetica-Bold').fontSize(9.8).fillColor(C.WHITE).text(st.lbl, px + 6, 94, { width: 146, align: 'center' });
    doc.font('Helvetica').fontSize(8.2).fillColor(st.col).text(st.sub, px + 6, 114, { width: 146, align: 'center' });
    if (i < pipeSteps.length - 1) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(C.MUTED).text('->', px + 158, 104, { width: 21, align: 'center' });
    }
  });

  drawTable(
    doc,
    42,
    158,
    [175, 95, 456, 150],
    ['Jakarta Component', 'Route', 'Responsibility & Security Enforcement', 'JSP View'],
    [
      [
        { text: 'SecurityAndPrivacyFilter', bold: true, color: C.ROSE },
        { text: '/*', mono: true, color: C.CYAN },
        { text: 'Injects CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy & validates per-session CSRF tokens on POST', color: C.WHITE },
        { text: 'All Views', color: C.MUTED },
      ],
      [
        { text: 'AuthServlet', bold: true, color: C.WHITE },
        { text: '/auth', mono: true, color: C.CYAN },
        { text: 'Salted PBKDF2-SHA256 registration & login, session ID rotation (session fixation defense), logout invalidation', color: C.WHITE },
        { text: 'auth.jsp', mono: true, color: C.EMERALD },
      ],
      [
        { text: 'ResumeUploadServlet', bold: true, color: C.WHITE },
        { text: '/analyze', mono: true, color: C.CYAN },
        { text: '@MultipartConfig ingestion, RegexPiiRedactor masking, offline deterministic scoring, atomic JDBC save & JsonSupport JSON', color: C.WHITE },
        { text: 'dashboard.jsp / report.jsp', mono: true, color: C.EMERALD },
      ],
      [
        { text: 'AnalysisHistoryServlet', bold: true, color: C.WHITE },
        { text: '/history', mono: true, color: C.CYAN },
        { text: 'Lists owner-scoped reports (WHERE user_id = ?), enforces 403/404 isolation on detail lookup & single-record delete', color: C.WHITE },
        { text: 'history.jsp', mono: true, color: C.EMERALD },
      ],
      [
        { text: 'BenchmarkServlet', bold: true, color: C.WHITE },
        { text: '/benchmarks', mono: true, color: C.CYAN },
        { text: 'Executes 12-resume labeled corpus via BenchmarkValidator, saves reproducible metrics in benchmark_runs', color: C.WHITE },
        { text: 'benchmark.jsp', mono: true, color: C.EMERALD },
      ],
      [
        { text: 'PrivacyPurgeServlet', bold: true, color: C.WHITE },
        { text: '/privacy', mono: true, color: C.CYAN },
        { text: 'Live PII redaction verifier, automated TTL expiration purge, one-click delete all user data & audit log display', color: C.WHITE },
        { text: 'privacy.jsp', mono: true, color: C.EMERALD },
      ],
    ],
    { headerHeight: 24, rowHeight: 51, fontSize: 8.4, headerFontSize: 8.8 }
  );

  // =========================================================================
  // SLIDE 6: Java Swing Desktop GUI Launcher
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '05 / Java GUI Rubric & Tri-Client Architecture',
    'Java Swing Desktop Application Sharing the Same Core & JDBC Layer',
    6
  );

  drawRoundedCard(doc, 42, 82, 595, 380, C.SURFACE, C.INDIGO, 8, 1.4);
  if (fs.existsSync(imgSwing)) {
    doc.image(imgSwing, 50, 90, { fit: [579, 364], align: 'center', valign: 'center' });
  }
  doc
    .font('Helvetica-Oblique')
    .fontSize(8.3)
    .fillColor(C.MUTED)
    .text('Full-window view of CareerPulseDesktopApp (Nimbus Look & Feel  ·  Launch: mvn compile exec:java)', 42, 472, { width: 595 });

  drawRoundedCard(doc, 656, 82, 262, 414, C.CARD, C.BORDER, 8);
  doc.font('Helvetica-Bold').fontSize(12.2).fillColor(C.CYAN).text('Swing Architecture', 672, 98);
  doc.save().moveTo(672, 118).lineTo(902, 118).lineWidth(0.7).strokeColor(C.BORDER).stroke().restore();
  const swingBullets = [
    '• 4-Tab JTabbedPane: Analyzer, JDBC History, Validation Lab, and Privacy Inspector',
    '• Strict MVC Separation: DesktopAuditController isolates business logic from JFrame',
    '• Responsive EDT: All scoring, JDBC & benchmark runs execute off-thread via SwingWorker',
    '• Reusable TableModels: Fix, History & Benchmark AbstractTableModels for clean tables',
    '• Zero Duplication: Calls exact same Core Java 17 & JDBC DAOs as Tomcat Servlets & CLI',
    '• Headless CI Verified: SwingGuiModelTest passes in JUnit 5 without X11 display',
  ];
  let sy6 = 128;
  for (const item of swingBullets) {
    doc.font('Helvetica').fontSize(8.8).fillColor(C.TEXT).text(item, 672, sy6, { width: 230, lineGap: 2.5 });
    sy6 += doc.heightOfString(item, { width: 230, lineGap: 2.5 }) + 11;
  }

  // =========================================================================
  // SLIDE 7: NEW Universal All-Format Offline Workbench (Vector UI Preview)
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '06 / New Feature — Universal All-Format Offline Ingestion',
    'Zero-API-Key, Zero-Camera Resume Analyzer Accepting 15+ Formats Offline',
    7
  );

  // Left: Vector-crisp live UI preview of updated ResumeUploader.tsx
  const uX = 42;
  const uY = 82;
  const uW = 552;
  const uH = 412;
  drawRoundedCard(doc, uX, uY, uW, uH, C.DARK_BOX, C.CYAN, 8, 1.3);
  drawMiniNavbar(doc, uX, uY, uW, 'Analyzer');

  // Hero card inside mockup
  drawRoundedCard(doc, uX + 16, uY + 40, uW - 32, 96, C.SURFACE, C.BORDER, 6);
  doc.font('Helvetica-Bold').fontSize(7.2).fillColor(C.EMERALD).text('100% Offline Engine · Zero API Keys · All Formats Accepted · Analyze · Rewrite · Build', uX + 26, uY + 50, { width: uW - 52, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(13.5).fillColor(C.WHITE).text('Analyze Any Resume, Get Exact Rewrites & Build a Better One', uX + 26, uY + 66, { width: uW - 52, align: 'center' });
  drawRoundedCard(doc, uX + 128, uY + 102, 134, 22, C.INDIGO, C.INDIGO, 5);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.WHITE).text('Analyze Your Resume', uX + 128, uY + 109, { width: 134, align: 'center' });
  drawRoundedCard(doc, uX + 272, uY + 102, 156, 22, C.DARK_BOX, C.EMERALD, 5);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.EMERALD).text('Create Resume from Scratch ->', uX + 272, uY + 109, { width: 156, align: 'center' });

  // Workbench dropzone mockup
  drawRoundedCard(doc, uX + 16, uY + 148, uW - 32, 248, C.SURFACE, C.BORDER, 6);
  // Tabs
  drawRoundedCard(doc, uX + 28, uY + 158, 146, 22, C.INDIGO, C.INDIGO, 4);
  doc.font('Helvetica-Bold').fontSize(7.8).fillColor(C.WHITE).text('Upload Any Resume Format', uX + 28, uY + 165, { width: 146, align: 'center' });
  drawRoundedCard(doc, uX + 180, uY + 158, 128, 22, C.DARK_BOX, C.BORDER, 4);
  doc.font('Helvetica').fontSize(7.8).fillColor(C.MUTED).text('Paste / Edit Resume Text', uX + 180, uY + 165, { width: 128, align: 'center' });
  doc.font('Courier').fontSize(7.6).fillColor(C.EMERALD).text('Offline Scan: < 10 ms', uX + 410, uY + 165, { width: 112, align: 'right' });

  // File accepted dropzone
  drawRoundedCard(doc, uX + 28, uY + 190, uW - 56, 62, '#0D211B', C.EMERALD, 6, 1);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.WHITE).text('alex_carter_java_architect.pdf', uX + 44, uY + 202);
  doc.font('Courier').fontSize(7.6).fillColor(C.EMERALD).text('148.2 KB  ·  Universal Offline Document Parser & OCR Ready', uX + 44, uY + 218);
  doc.font('Helvetica').fontSize(7.2).fillColor(C.MUTED).text('Accepted: PDF · DOCX · DOC · ODT · RTF · TXT · MD · HTML · JSON · CSV · LaTeX · PPTX · PNG/JPG OCR', uX + 44, uY + 234);

  // Target Role + Offline Engine Status + TTL
  drawRoundedCard(doc, uX + 28, uY + 262, 250, 34, C.DARK_BOX, C.BORDER, 4);
  doc.font('Helvetica').fontSize(7).fillColor(C.MUTED).text('Target Job Title', uX + 36, uY + 267);
  doc.font('Helvetica-Bold').fontSize(8.4).fillColor(C.WHITE).text('Senior Java Backend Engineer', uX + 36, uY + 279);

  drawRoundedCard(doc, uX + 288, uY + 262, 236, 34, C.DARK_BOX, C.EMERALD, 4);
  doc.font('Helvetica').fontSize(7).fillColor(C.MUTED).text('Scoring Engine Mode', uX + 296, uY + 267);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.EMERALD).text('Deterministic Local (100% Offline · 0 Keys)', uX + 296, uY + 279);

  drawRoundedCard(doc, uX + 28, uY + 306, uW - 56, 32, C.DARK_BOX, C.BORDER, 4);
  doc.font('Helvetica-Bold').fontSize(7.8).fillColor(C.WHITE).text('[x] Mask PII before analysis & storage  ·  Retention TTL: 24-Hour Auto-Expire', uX + 40, uY + 318);

  // Primary Submit Button
  drawRoundedCard(doc, uX + 28, uY + 350, uW - 56, 32, C.INDIGO, C.INDIGO, 6);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.WHITE).text('Run Deterministic Local ATS Audit (Offline · Zero API Keys)', uX + 28, uY + 361, { width: uW - 56, align: 'center' });

  // Right: Offline Document Parser Matrix (documentParser.ts)
  drawRoundedCard(doc, 612, 82, 306, 412, C.SURFACE, C.BORDER, 8);
  doc.font('Helvetica-Bold').fontSize(11.5).fillColor(C.CYAN).text('Universal Offline Parser Pipeline', 628, 96);
  doc.font('Courier').fontSize(7.8).fillColor(C.MUTED).text('src/server/documentParser.ts', 628, 113);

  const parserLayers = [
    { fmt: 'PDF Documents (.pdf)', lib: 'unpdf + stream fallback', col: C.INDIGO },
    { fmt: 'Modern Word (.docx)', lib: 'mammoth + OOXML ZIP fallback', col: C.CYAN },
    { fmt: 'OpenDoc / Slides (.odt .pptx)', lib: 'adm-zip XML extractor', col: C.EMERALD },
    { fmt: 'Images (.png .jpg .webp)', lib: 'tesseract.js Offline OCR', col: C.AMBER },
    { fmt: 'Rich / Structured Text', lib: 'RTF, HTML, JSON, LaTeX, MD, CSV', col: C.CYAN },
    { fmt: 'Legacy Binary (.doc)', lib: 'UTF-16LE & ASCII run extractor', col: C.MUTED },
  ];

  parserLayers.forEach((pl, i) => {
    const py = 134 + i * 48;
    drawRoundedCard(doc, 628, py, 274, 41, C.CARD, C.BORDER, 5);
    doc.font('Helvetica-Bold').fontSize(8.8).fillColor(pl.col).text(pl.fmt, 638, py + 7, { width: 254 });
    doc.font('Courier').fontSize(7.8).fillColor(C.TEXT).text(pl.lib, 638, py + 22, { width: 254 });
  });

  drawRoundedCard(doc, 628, 428, 274, 54, '#0D211B', C.EMERALD, 6);
  doc.font('Helvetica-Bold').fontSize(8.4).fillColor(C.EMERALD).text('Privacy & Permission Hardening', 638, 437);
  doc.font('Helvetica').fontSize(7.9).fillColor(C.WHITE).text('Zero camera access requested (requestFramePermissions: []). All parsing runs locally with zero external API calls.', 638, 451, { width: 254, lineGap: 2 });

  // =========================================================================
  // SLIDE 8: NEW "Write This Instead" Upgrade Studio & ATS Report
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '07 / New Feature — After-Analyze "Write This Instead" Studio',
    'Actionable Summary, Bullet Rewrites, Missing Keyword Lines & Score Lift',
    8
  );

  // Left: Vector UI preview of SuggestedRewriteStudio.tsx
  const rX = 42;
  const rY = 82;
  const rW = 584;
  const rH = 412;
  drawRoundedCard(doc, rX, rY, rW, rH, C.DARK_BOX, C.EMERALD, 8, 1.3);

  // Score lift header banner
  drawRoundedCard(doc, rX + 14, rY + 14, rW - 28, 66, C.SURFACE, C.INDIGO, 6);
  doc.font('Helvetica-Bold').fontSize(7.6).fillColor(C.EMERALD).text('PERSONALIZED "WRITE THIS INSTEAD" UPGRADE PLAN  ·  5 UPGRADES SELECTED', rX + 26, rY + 24);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(C.WHITE).text('Lift ATS Score from 64  ->  92 / 100  (+28 pts)', rX + 26, rY + 40);
  doc.font('Helvetica').fontSize(7.6).fillColor(C.MUTED).text('Copy individual rewrites or send all checked upgrades straight into the Resume Builder.', rX + 26, rY + 59);
  drawRoundedCard(doc, rX + rW - 160, rY + 28, 134, 30, C.INDIGO, C.INDIGO, 6);
  doc.font('Helvetica-Bold').fontSize(8.2).fillColor(C.WHITE).text('Build Upgraded Resume ->', rX + rW - 160, rY + 39, { width: 134, align: 'center' });

  // Section 01: Suggested Summary
  drawRoundedCard(doc, rX + 14, rY + 90, rW - 28, 80, C.SURFACE, C.BORDER, 6);
  doc.font('Helvetica-Bold').fontSize(8.8).fillColor(C.CYAN).text('01. Write This Professional Summary Instead', rX + 26, rY + 100);
  doc.font('Helvetica-Bold').fontSize(7.4).fillColor(C.EMERALD).text('[x] Included in Builder  ·  Copy Summary', rX + 380, rY + 101, { width: 176, align: 'right' });
  drawRoundedCard(doc, rX + 24, rY + 118, rW - 48, 44, C.DARK_BOX, C.EMERALD, 5);
  doc
    .font('Helvetica')
    .fontSize(7.8)
    .fillColor(C.WHITE)
    .text(
      '"Results-driven Senior Java Backend Engineer specializing in Java 17, Spring Boot, JDBC, and PostgreSQL, with a proven track record of delivering high-reliability microservices and measurable latency reductions."',
      rX + 32,
      rY + 125,
      { width: rW - 64, lineGap: 2 }
    );

  // Section 02: Before -> After Bullet Card
  drawRoundedCard(doc, rX + 14, rY + 180, rW - 28, 118, C.SURFACE, C.BORDER, 6);
  doc.font('Helvetica-Bold').fontSize(8.8).fillColor(C.INDIGO).text('02. Replace Weak Bullets — Write These High-Impact Lines Instead', rX + 26, rY + 190);
  // Before box
  drawRoundedCard(doc, rX + 24, rY + 208, 260, 78, C.DARK_BOX, C.ROSE, 5);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.ROSE).text('Instead of writing (Passive)', rX + 34, rY + 216);
  doc.font('Courier').fontSize(7.6).fillColor(C.MUTED).text('"Worked on REST microservices and helped optimize database queries for backend services."', rX + 34, rY + 232, { width: 240, lineGap: 2.5 });
  // After box
  drawRoundedCard(doc, rX + 296, rY + 208, 262, 78, C.DARK_BOX, C.EMERALD, 5);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.EMERALD).text('Write this instead (Google XYZ)', rX + 306, rY + 216);
  doc.font('Helvetica').fontSize(7.8).fillColor(C.WHITE).text('"Architected REST microservices and SQL query optimizations, reducing p99 latency by 38% and saving 12+ hrs/week via automated CI."', rX + 306, rY + 232, { width: 242, lineGap: 2.5 });

  // Section 03: Missing Keyword Templates
  drawRoundedCard(doc, rX + 14, rY + 308, rW - 28, 92, C.SURFACE, C.BORDER, 6);
  doc.font('Helvetica-Bold').fontSize(8.8).fillColor(C.AMBER).text('03. Missing ATS Keywords — Exact Bullets You Can Add Today', rX + 26, rY + 318);
  drawRoundedCard(doc, rX + 24, rY + 336, 260, 54, C.DARK_BOX, C.AMBER, 5);
  doc.font('Courier-Bold').fontSize(7.5).fillColor(C.AMBER).text('+ KUBERNETES  (Work Experience)', rX + 34, rY + 343);
  doc.font('Helvetica').fontSize(7.4).fillColor(C.TEXT).text('"Engineered production workflows leveraging Kubernetes, cutting deployment friction by 35%."', rX + 34, rY + 356, { width: 240, lineGap: 1.8 });
  drawRoundedCard(doc, rX + 296, rY + 336, 262, 54, C.DARK_BOX, C.AMBER, 5);
  doc.font('Courier-Bold').fontSize(7.5).fillColor(C.AMBER).text('+ KAFKA  (Technical Skills & Projects)', rX + 306, rY + 343);
  doc.font('Helvetica').fontSize(7.4).fillColor(C.TEXT).text('"Integrated Kafka into core backend services, reducing event latency by 42% at peak load."', rX + 306, rY + 356, { width: 242, lineGap: 1.8 });

  // Right Sidebar: How the Upgrade Engine Works
  drawRoundedCard(doc, 642, 82, 276, 412, C.CARD, C.BORDER, 8);
  doc.font('Helvetica-Bold').fontSize(11.8).fillColor(C.EMERALD).text('Actionable Upgrade Loop', 658, 98);
  doc.font('Courier').fontSize(7.6).fillColor(C.MUTED).text('SuggestedRewriteStudio.tsx', 658, 114);
  doc.save().moveTo(658, 128).lineTo(902, 128).lineWidth(0.7).strokeColor(C.BORDER).stroke().restore();

  const rewritePts = [
    '• Default Post-Audit Tab: Immediately opens after any resume scan so users see exactly what to change',
    '• Tailored Summary Synthesis: deterministicEngine.ts builds a role-aligned summary from detected skills & JD gaps',
    '• Passive-to-XYZ Upgrades: Automatically strips passive leads ("Worked on", "Responsible for") and applies Google XYZ impact templates',
    '• Ready-to-Paste Keyword Lines: Generates authentic sentence starters for every missing crucial ATS keyword',
    '• Live Score Simulator: Toggling checkboxes dynamically previews projected ATS score gains',
    '• One-Click Builder Transfer: buildDraftFromAnalysis() merges accepted suggestions into the Resume Builder automatically',
  ];
  let ry8 = 138;
  for (const pt of rewritePts) {
    doc.font('Helvetica').fontSize(8.5).fillColor(C.TEXT).text(pt, 658, ry8, { width: 244, lineGap: 2.3 });
    ry8 += doc.heightOfString(pt, { width: 244, lineGap: 2.3 }) + 10;
  }

  // =========================================================================
  // SLIDE 9: NEW Interactive ATS Resume Builder (Vector Split-Screen Preview)
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '08 / New Feature — Interactive ATS Resume Creator & Studio',
    'Split-Screen Resume Builder with Live ATS Meter, 3 Templates & Multi-Format Export',
    9
  );

  const bX = 42;
  const bY = 82;
  const bW = 612;
  const bH = 412;
  drawRoundedCard(doc, bX, bY, bW, bH, C.DARK_BOX, C.INDIGO, 8, 1.3);
  drawMiniNavbar(doc, bX, bY, bW, 'Resume Builder');

  // Top KPI strip inside builder mockup
  const kpiMini = [
    { lbl: 'Live ATS Score', val: '94/100', col: C.EMERALD },
    { lbl: 'Quantified Bullets', val: '5 / 5', col: C.WHITE },
    { lbl: 'Action Verbs', val: '5 / 5', col: C.CYAN },
    { lbl: 'Indexed Skills', val: '12 skills', col: C.WHITE },
  ];
  kpiMini.forEach((km, i) => {
    const kx = bX + 12 + i * 114;
    drawRoundedCard(doc, kx, bY + 36, 106, 36, C.SURFACE, C.BORDER, 5);
    doc.font('Helvetica').fontSize(6.6).fillColor(C.MUTED).text(km.lbl, kx + 8, bY + 42);
    doc.font('Courier-Bold').fontSize(10.5).fillColor(km.col).text(km.val, kx + 8, bY + 53);
  });
  drawRoundedCard(doc, bX + 470, bY + 41, 130, 26, C.EMERALD, C.EMERALD, 5);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.BG).text('Audit Created Resume ->', bX + 470, bY + 50, { width: 130, align: 'center' });

  // Left Editor Pane inside mockup
  drawRoundedCard(doc, bX + 12, bY + 82, 232, 318, C.SURFACE, C.BORDER, 6);
  const edTabs = ['Profile', 'Experience', 'Skills', 'Projects'];
  edTabs.forEach((et, i) => {
    const ex = bX + 18 + i * 54;
    drawRoundedCard(doc, ex, bY + 88, 50, 18, i === 1 ? C.INDIGO : C.DARK_BOX, C.BORDER, 4);
    doc.font('Helvetica-Bold').fontSize(6.8).fillColor(i === 1 ? C.WHITE : C.MUTED).text(et, ex, bY + 94, { width: 50, align: 'center' });
  });
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.INDIGO).text('Role #1 — Senior Backend Engineer', bX + 20, bY + 116);
  drawRoundedCard(doc, bX + 20, bY + 130, 216, 22, C.DARK_BOX, C.BORDER, 4);
  doc.font('Helvetica').fontSize(7.3).fillColor(C.WHITE).text('FinScale Cloud Systems  ·  2022 – Present', bX + 28, bY + 137);
  doc.font('Helvetica').fontSize(7).fillColor(C.MUTED).text('Achievement Bullets (1-click XYZ Upgrade):', bX + 20, bY + 160);
  drawRoundedCard(doc, bX + 20, bY + 173, 216, 60, C.DARK_BOX, C.INDIGO, 4);
  doc.font('Helvetica').fontSize(7.2).fillColor(C.TEXT).text('Architected event-driven Java 17 payment microservices processing 35,000+ TPS at 99.98% SLA uptime.', bX + 26, bY + 180, { width: 204, lineGap: 2 });
  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.CYAN).text('* Suggest Better Bullet (XYZ)', bX + 26, bY + 219);
  drawRoundedCard(doc, bX + 20, bY + 242, 216, 56, C.DARK_BOX, C.BORDER, 4);
  doc.font('Helvetica').fontSize(7.2).fillColor(C.TEXT).text('Optimized PostgreSQL query plans and HikariCP pools, cutting p99 latency from 240ms to 68ms.', bX + 26, bY + 249, { width: 204, lineGap: 2 });
  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.CYAN).text('* Suggest Better Bullet (XYZ)', bX + 26, bY + 284);
  drawRoundedCard(doc, bX + 20, bY + 308, 216, 22, C.DARK_BOX, C.BORDER, 4);
  doc.font('Helvetica-Bold').fontSize(7.2).fillColor(C.EMERALD).text('+ Add Bullet Point  ·  + Add Role', bX + 20, bY + 315, { width: 216, align: 'center' });
  doc.font('Helvetica').fontSize(6.8).fillColor(C.MUTED).text('Starter Presets: Java Backend · Full-Stack · Data/ML', bX + 20, bY + 340, { width: 216 });

  // Right Live Crisp White Paper Resume Preview inside mockup
  // Style toolbar
  drawRoundedCard(doc, bX + 254, bY + 82, 346, 26, C.SURFACE, C.BORDER, 5);
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.WHITE).text('Executive | Sidebar Pro | Classic | Bio-Data', bX + 260, bY + 91);
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.CYAN).text('PDF · Word (.doc) · .TXT', bX + 496, bY + 91, { width: 96, align: 'right' });

  // Crisp white paper sheet
  drawRoundedCard(doc, bX + 254, bY + 114, 346, 286, C.PAPER, '#CBD5E1', 5);
  // Executive soft indigo header band with real studio headshot portrait
  doc.save();
  doc.rect(bX + 254, bY + 114, 346, 52).fill('#EEF2FF');
  doc.rect(bX + 254, bY + 164, 346, 2.5).fill(C.INDIGO_DARK);
  doc.restore();
  const avatarPath = path.resolve(process.cwd(), 'src/assets/images/avatar_aarav_sharma_1795607286085.jpg');
  let headerTextX = bX + 268;
  if (fs.existsSync(avatarPath)) {
    doc.save();
    doc.roundedRect(bX + 264, bY + 121, 36, 36, 5).clip();
    doc.image(avatarPath, bX + 264, bY + 121, { width: 36, height: 36 });
    doc.restore();
    headerTextX = bX + 308;
  }
  doc.font('Helvetica-Bold').fontSize(12.5).fillColor(C.INDIGO_DARK).text('Aarav Sharma', headerTextX, bY + 121);
  doc.font('Helvetica-Bold').fontSize(7.4).fillColor('#334155').text('Senior Java Backend & Distributed Systems Engineer', headerTextX, bY + 137);
  doc.font('Helvetica').fontSize(6.3).fillColor(C.INK_MUTED).text('aarav.sharma@example.com · +91 98765 43210 · linkedin.com/in/aarav', headerTextX, bY + 149);

  // Paper body
  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.INDIGO_DARK).text('PROFESSIONAL SUMMARY', bX + 268, bY + 174);
  doc.font('Helvetica').fontSize(6.8).fillColor(C.INK).text('Java 17 & Spring Boot Backend Engineer with 5+ years designing fault-tolerant microservices and JDBC/PostgreSQL pipelines. Cut p99 latency by 58% and sustained 99.98% uptime.', bX + 268, bY + 185, { width: 318, lineGap: 1.5 });

  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.INDIGO_DARK).text('TECHNICAL SKILLS', bX + 268, bY + 216);
  doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#334155').text('Java 17 · Spring Boot · Jakarta EE · JDBC & SQL · PostgreSQL · Kafka · Docker · Kubernetes · JUnit 5 · Maven', bX + 268, bY + 227, { width: 318 });

  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.INDIGO_DARK).text('WORK EXPERIENCE', bX + 268, bY + 246);
  doc.font('Helvetica-Bold').fontSize(7.4).fillColor(C.INK).text('Senior Backend Software Engineer — FinScale Cloud Systems', bX + 268, bY + 258);
  doc.font('Courier').fontSize(6.6).fillColor(C.INK_MUTED).text('2022 – Present', bX + 518, bY + 258, { width: 68, align: 'right' });
  doc
    .font('Helvetica')
    .fontSize(6.7)
    .fillColor(C.INK)
    .text(
      '• Architected Java 17 payment microservices handling 35,000+ TPS at 99.98% uptime.\n' +
        '• Tuned PostgreSQL & HikariCP pools, lowering p99 latency from 240ms to 68ms.\n' +
        '• Automated Maven, Checkstyle & JUnit 5 CI pipelines, cutting regressions by 47%.',
      bX + 272,
      bY + 270,
      { width: 314, lineGap: 2.2 }
    );

  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.INDIGO_DARK).text('SELECTED PROJECTS & EDUCATION', bX + 268, bY + 324);
  doc.font('Helvetica-Bold').fontSize(7.1).fillColor(C.INK).text('CareerPulse — Offline Deterministic ATS Analyzer (Java 17 · JDBC · Swing)', bX + 268, bY + 336);
  doc.font('Helvetica').fontSize(6.7).fillColor(C.INK_MUTED).text('B.Tech Computer Science & Engineering — National Institute of Technology (2016 – 2020)', bX + 268, bY + 350);

  // Right Sidebar: Builder Capabilities
  drawRoundedCard(doc, 670, 82, 248, 412, C.CARD, C.BORDER, 8);
  doc.font('Helvetica-Bold').fontSize(11.8).fillColor(C.INDIGO).text('Resume Studio Features', 686, 98);
  doc.font('Courier').fontSize(7.6).fillColor(C.MUTED).text('ResumeBuilder.tsx', 686, 114);
  doc.save().moveTo(686, 128).lineTo(902, 128).lineWidth(0.7).strokeColor(C.BORDER).stroke().restore();

  const builderPts = [
    '• 3 Modern ATS Templates: Executive Modern, Clean Classic ATS, and Tech Minimal',
    '• 4 Curated Color Accents: Indigo, Emerald, Executive Slate, and Crimson',
    '• Live Offline ATS Meter: Scores bullets, metrics, action verbs & skills on every keystroke',
    '• 1-Click XYZ Upgrade: Calls offline /api/rewrite-bullet directly inside every experience entry',
    '• 3 Starter Presets: Java Backend, Full-Stack Developer, and Data/ML Engineer',
    '• Instant Multi-Format Export: Print/Save clean PDF, Microsoft Word (.doc), or ATS .TXT',
    '• Closed-Loop Audit: Click "Audit Now" to run the full 5-dimension report on your new resume',
  ];
  let by9 = 138;
  for (const pt of builderPts) {
    doc.font('Helvetica').fontSize(8.4).fillColor(C.TEXT).text(pt, 686, by9, { width: 216, lineGap: 2.2 });
    by9 += doc.heightOfString(pt, { width: 216, lineGap: 2.2 }) + 9;
  }

  // =========================================================================
  // SLIDE 10: Empirical Benchmark Validation (12-Resume Labeled Corpus)
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '09 / Validation Methodology & Empirical Evidence',
    '12-Resume Independently Annotated Benchmark Results (Reproducible)',
    10
  );

  const bmKpis = [
    { lbl: 'Labeled Corpus', val: `${benchmark.datasetSize} Resumes`, col: C.WHITE },
    { lbl: 'Band Accuracy', val: `${benchmark.bandAccuracyPct}%`, col: C.EMERALD },
    { lbl: 'Mean Abs Error', val: `${benchmark.meanAbsoluteError} pts`, col: C.CYAN },
    { lbl: 'Spearman Rank rho', val: `${benchmark.spearmanRho}`, col: C.INDIGO },
    { lbl: 'Latency p50 / p95', val: `${benchmark.p50LatencyMs} / ${benchmark.p95LatencyMs} ms`, col: C.AMBER },
  ];

  bmKpis.forEach((k, i) => {
    const kx = 42 + i * 178;
    drawRoundedCard(doc, kx, 80, 166, 56, C.CARD, C.BORDER, 6);
    doc.font('Helvetica').fontSize(8).fillColor(C.MUTED).text(k.lbl, kx + 10, 88, { width: 146 });
    doc.font('Courier-Bold').fontSize(13.5).fillColor(k.col).text(k.val, kx + 10, 106, { width: 146 });
  });

  drawTable(
    doc,
    42,
    148,
    [62, 92, 360, 74, 86, 70, 56, 76],
    ['ID', 'Tier', 'Annotated Candidate Profile', 'Expected', 'Band', 'Actual', 'Err', 'Status'],
    benchmark.results.map((r) => [
      { text: r.id, mono: true, color: C.CYAN },
      { text: r.tier, bold: true, color: r.tier === 'Strong' ? C.EMERALD : r.tier === 'Weak' ? C.ROSE : C.WHITE },
      { text: r.label, color: C.WHITE },
      { text: String(r.expectedScore), mono: true, color: C.MUTED, align: 'center' },
      { text: `${r.minBand}-${r.maxBand}`, mono: true, color: C.MUTED, align: 'center' },
      { text: String(r.predictedScore), mono: true, bold: true, color: C.WHITE, align: 'center' },
      { text: String(r.absoluteError), mono: true, color: C.MUTED, align: 'center' },
      { text: r.withinBand ? 'PASS' : 'OUT', bold: true, color: r.withinBand ? C.EMERALD : C.ROSE, align: 'center' },
    ]),
    { headerHeight: 22, rowHeight: 23.5, fontSize: 7.9, headerFontSize: 8.3 }
  );

  drawRoundedCard(doc, 42, 464, 876, 34, '#172033', C.AMBER, 5);
  doc
    .font('Helvetica-Oblique')
    .fontSize(8.3)
    .fillColor(C.WHITE)
    .text(
      'Scope Disclaimer: Benchmark metrics validate deterministic heuristic calibration across 4 quality tiers — scores are diagnostic indicators, not verified hiring outcomes.',
      54,
      475,
      { width: 852 }
    );

  // =========================================================================
  // SLIDE 11: Privacy, PII Redaction & Access Governance
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '10 / Data Protection & Privacy Governance',
    'Automated PII Redaction, Owner Isolation, TTL Retention & Purge Audit',
    11
  );

  drawRoundedCard(doc, 42, 84, 420, 146, C.SURFACE, C.ROSE, 8, 1.2);
  doc.font('Helvetica-Bold').fontSize(9.2).fillColor(C.ROSE).text('BEFORE REDACTION (Raw Uploaded Resume Text)', 56, 98, { width: 392 });
  doc.font('Courier').fontSize(8.8).fillColor(C.WHITE).text(sampleRawPii, 56, 122, { width: 392, lineGap: 4 });

  doc.font('Helvetica-Bold').fontSize(15).fillColor(C.EMERALD).text('->', 466, 148, { width: 28, align: 'center' });

  drawRoundedCard(doc, 498, 84, 420, 146, C.SURFACE, C.EMERALD, 8, 1.2);
  doc
    .font('Helvetica-Bold')
    .fontSize(9.2)
    .fillColor(C.EMERALD)
    .text(`AFTER REGEX REDACTOR (${redactionDemo.totalMaskedCount} PII Items Masked Offline Before Storage)`, 512, 98, { width: 392 });
  doc.font('Courier').fontSize(8.8).fillColor(C.EMERALD).text(redactionDemo.redactedText, 512, 122, { width: 392, lineGap: 4 });

  const pillars = [
    {
      title: 'PBKDF2-SHA256 & CSRF',
      col: C.INDIGO,
      body: '120,000-iteration salted PBKDF2 password hashing with constant-time verify(), session ID rotation on login, and per-session CSRF token validation in SecurityAndPrivacyFilter.',
    },
    {
      title: 'Owner-Scoped Isolation',
      col: C.CYAN,
      body: 'Every JDBC SELECT and DELETE filters by authenticated user_id (WHERE r.id = ? AND res.user_id = ?); cross-user access attempts return 403/404 and are tested in JUnit 5.',
    },
    {
      title: 'Configurable Retention TTL',
      col: C.AMBER,
      body: 'Users explicitly choose EPHEMERAL (zero database persistence), HOURS_24 (default auto-expiry), or DAYS_7. deleteExpiredResumes() purges stale rows deterministically.',
    },
    {
      title: 'Zero Permissions & Purge',
      col: C.EMERALD,
      body: 'Zero camera permissions and zero external API transmission. PrivacyPurgeServlet and Swing Privacy tab permanently delete all owned records while logging to audit_access_logs.',
    },
  ];

  pillars.forEach((p, idx) => {
    const px = 42 + idx * 223;
    drawRoundedCard(doc, px, 254, 207, 238, C.CARD, p.col, 8, 1.2);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(p.col).text(p.title, px + 14, 270, { width: 179 });
    doc.font('Helvetica').fontSize(8.8).fillColor(C.WHITE).text(p.body, px + 14, 300, { width: 179, lineGap: 3.5 });
  });

  // =========================================================================
  // SLIDE 12: Code Quality, Automated Testing & Pure Java 17 CI Pipeline
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '11 / Code Quality, Automated Testing & CI Pipeline',
    'Checkstyle, Javadoc, 7 JUnit 5 Suites, All-Format Verification & Pure Java 17 CI',
    12
  );

  drawRoundedCard(doc, 42, 84, 344, 410, C.SURFACE, C.BORDER, 8);
  doc.font('Helvetica-Bold').fontSize(11.5).fillColor(C.CYAN).text('Quality & Verification Gates', 58, 98, { width: 312 });

  const qualityPoints = [
    '• Pure 9-Package Maven Java 17 Layout:\n  model · exception · privacy · engine · dao · web · gui · cli · util',
    '• Checkstyle Enforcement:\n  config/checkstyle/checkstyle.xml verifies naming, Javadocs, brace hygiene, no wildcard imports & zero tabs',
    '• Zero External API Keys:\n  100% offline deterministic scoring across Java CLI, Swing GUI, Tomcat WAR & Web Studio',
    '• Verified All-Format Ingestion:\n  Live HTTP 200 verification for PDF (unpdf), DOCX (mammoth), ODT (adm-zip), RTF, JSON & OCR',
    '• Pure Java 17 GitHub Actions CI:\n  Checkstyle -> 7 JUnit 5 Suites -> CLI --self-test -> Javadoc -> Tomcat 10+ WAR artifact',
  ];

  let qy = 128;
  for (const qp of qualityPoints) {
    doc.font('Helvetica').fontSize(8.7).fillColor(C.WHITE).text(qp, 58, qy, { width: 312, lineGap: 2.8 });
    qy += doc.heightOfString(qp, { width: 312, lineGap: 2.8 }) + 11;
  }

  drawTable(
    doc,
    404,
    84,
    [180, 96, 238],
    ['Test Suite', 'Framework', 'Verified Capabilities'],
    [
      [
        { text: 'CoreJavaOopAndRedactionTest', mono: true, color: C.CYAN },
        { text: 'JUnit 5', bold: true, color: C.EMERALD },
        { text: 'OOP hierarchy, PriorityQueue ranking, RegexPiiRedactor, PBKDF2 hashing', color: C.WHITE },
      ],
      [
        { text: 'DeterministicScoringEngineTest', mono: true, color: C.CYAN },
        { text: 'JUnit 5', bold: true, color: C.EMERALD },
        { text: 'Offline reproducibility, strong > weak ranking, 5 category weights', color: C.WHITE },
      ],
      [
        { text: 'JdbcDaoIntegrationTest', mono: true, color: C.CYAN },
        { text: 'JUnit 5 + H2', bold: true, color: C.EMERALD },
        { text: 'Atomic commit/rollback, owner-scoped isolation, TTL expiry & purge', color: C.WHITE },
      ],
      [
        { text: 'BenchmarkValidationTest', mono: true, color: C.CYAN },
        { text: 'JUnit 5', bold: true, color: C.EMERALD },
        { text: 'Asserts MAE <= 10, Band Acc >= 75%, Spearman rho >= 0.85, latency', color: C.WHITE },
      ],
      [
        { text: 'ServletControllerTest', mono: true, color: C.CYAN },
        { text: 'JUnit 5 + Mockito', bold: true, color: C.EMERALD },
        { text: 'Servlet POST/GET routing, JsonSupport serialization & 401 purge guard', color: C.WHITE },
      ],
      [
        { text: 'SwingGuiModelTest', mono: true, color: C.CYAN },
        { text: 'JUnit 5 (Headless)', bold: true, color: C.EMERALD },
        { text: 'DesktopAuditController + Fix, History & Benchmark Swing TableModels', color: C.WHITE },
      ],
      [
        { text: 'StandaloneTesterTest', mono: true, color: C.CYAN },
        { text: 'JUnit 5 (Offline)', bold: true, color: C.AMBER },
        { text: 'CLI --self-test, --file local resume audit & Instant-safe JsonSupport', color: C.WHITE },
      ],
    ],
    { headerHeight: 24, rowHeight: 55, fontSize: 8.1, headerFontSize: 8.6 }
  );

  // =========================================================================
  // SLIDE 13: Teamwork, Collaboration & Zero-Setup Quick-Start
  // =========================================================================
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawSlideChrome(
    doc,
    '12 / Teamwork, Collaboration & Execution Guide',
    'Team Moshdi Ownership Matrix, Pure Maven Standards & Quick-Start Commands',
    13
  );

  drawTable(
    doc,
    42,
    84,
    [195, 185, 496],
    ['Role', 'Lead / Track', 'Delivered Modules & Artifacts'],
    [
      [
        { text: 'Project Lead & Core Architect', bold: true, color: C.CYAN },
        { text: 'Shivam Kumar', bold: true, color: C.WHITE },
        { text: 'Core Java 17 OOP hierarchy, 5-strategy engine, Standalone CLI, All-Format Parser, Resume Builder & PDF Deck', color: C.WHITE },
      ],
      [
        { text: 'Database & Persistence Lead', bold: true, color: C.CYAN },
        { text: 'Team Moshdi — JDBC Track', color: C.WHITE },
        { text: '5-table schema.sql, DatabaseConnectionManager (MySQL 8 + H2 fallback), atomic transactional DAOs & JsonSupport', color: C.WHITE },
      ],
      [
        { text: 'Web Servlets & Swing GUI Lead', bold: true, color: C.CYAN },
        { text: 'Team Moshdi — UI & Web Track', color: C.WHITE },
        { text: '5 Jakarta EE 10 Servlets, SecurityAndPrivacyFilter, 6 JSTL JSP views, 4-tab Swing GUI & Write-This-Instead UI', color: C.WHITE },
      ],
      [
        { text: 'QA, Benchmarks & Privacy Lead', bold: true, color: C.CYAN },
        { text: 'Team Moshdi — QA & Security Track', color: C.WHITE },
        { text: '12-resume BenchmarkValidator, RegexPiiRedactor, PBKDF2 hashing, 7 JUnit 5/Mockito suites & Pure Java 17 CI', color: C.WHITE },
      ],
    ],
    { headerHeight: 24, rowHeight: 42, fontSize: 8.5, headerFontSize: 8.8 }
  );

  drawRoundedCard(doc, 42, 298, 424, 196, C.CARD, C.INDIGO, 8, 1.2);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.INDIGO).text('Direct Out-of-the-Box Use (Zero API Keys)', 58, 314, { width: 392 });
  doc
    .font('Helvetica')
    .fontSize(8.8)
    .fillColor(C.WHITE)
    .text(
      '• Clone & Run Immediately: Zero GEMINI_API_KEY or external cloud accounts needed\n\n' +
        '• Pure Maven Java 17 Repository Layout: Passes Checkstyle, Javadoc & 7 JUnit 5 suites\n\n' +
        '• Interactive Web Studio: Upload any format, review "Write This Instead" upgrades, and build/export a polished PDF or Word resume\n\n' +
        '• Synchronized docs: README.md, ARCHITECTURE_UML.md, VALIDATION_METHODOLOGY.md, PRIVACY_AND_SECURITY.md',
      58,
      340,
      { width: 392, lineGap: 2.2 }
    );

  drawRoundedCard(doc, 488, 298, 430, 196, C.SURFACE, C.EMERALD, 8, 1.2);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.EMERALD).text('Evaluator Quick-Start Commands (Zero Setup)', 504, 314, { width: 398 });
  doc
    .font('Courier')
    .fontSize(8.2)
    .fillColor(C.CYAN)
    .text(
      '# 1. Checkstyle, 7 JUnit 5 + Mockito Suites & Tomcat 10+ WAR\n' +
        'mvn checkstyle:check && mvn clean test package\n\n' +
        '# 2. Zero-API-Key Standalone CLI Tester (--self-test / --file)\n' +
        'mvn compile exec:java \\\n' +
        '  -Dexec.mainClass=com.careerpulse.cli.CareerPulseStandaloneTester\n\n' +
        '# 3. Launch Java Swing Desktop GUI (H2 Auto-Fallback Ready)\n' +
        'mvn compile exec:java',
      504,
      340,
      { width: 398, lineGap: 2.5 }
    );

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const stat = fs.statSync(outPath);
  console.log(`Generated 13-slide updated PDF deck: ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

generatePdfPresentation().catch((err) => {
  console.error('Failed to generate updated PDF presentation:', err);
  process.exit(1);
});
