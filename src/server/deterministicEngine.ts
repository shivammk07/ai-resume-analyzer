import { ResumeAnalysis, CategoryScore, CriticalFix, BulletEnhancement } from '../types/resume';
import { redactResumePii } from './piiRedactor';

export const VALIDATION_DISCLAIMER =
  'Heuristic Notice: Scores reflect deterministic rubric alignment (parsability, metrics, action verbs, keyword overlap, and formatting) validated against an internal labeled corpus. They are decision-support indicators and do not guarantee hiring or recruiter outcomes.';

const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'that', 'this', 'from', 'have', 'has', 'was', 'were',
  'are', 'our', 'your', 'you', 'will', 'can', 'into', 'using', 'used', 'across', 'within',
  'through', 'over', 'under', 'about', 'more', 'than', 'their', 'they', 'them', 'been',
  'being', 'also', 'such', 'other', 'including', 'strong', 'experience', 'years', 'work',
  'role', 'team', 'skills', 'ability', 'preferred', 'required', 'knowledge', 'working',
]);

const DOMAIN_SKILL_LEXICON = [
  'java', 'jdbc', 'servlet', 'servlets', 'jsp', 'jakarta', 'spring', 'springboot', 'maven',
  'mysql', 'postgresql', 'sql', 'h2', 'hibernate', 'jpa', 'rest', 'api', 'microservices',
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'linux', 'git', 'ci/cd', 'junit', 'testing',
  'python', 'typescript', 'javascript', 'react', 'node', 'kafka', 'redis', 'graphql',
  'agile', 'scrum', 'security', 'oauth', 'encryption', 'architecture', 'distributed',
  'analytics', 'tableau', 'etl', 'spark', 'terraform', 'prometheus', 'grafana', 'devops',
];

const STRONG_VERBS = new Set([
  'architected', 'engineered', 'designed', 'implemented', 'built', 'led', 'spearheaded',
  'optimized', 'reduced', 'increased', 'accelerated', 'automated', 'migrated', 'scaled',
  'delivered', 'launched', 'developed', 'refactored', 'established', 'mentored', 'orchestrated',
  'streamlined', 'eliminated', 'secured', 'deployed', 'integrated', 'resolved', 'created',
  'improved', 'transformed', 'directed', 'owned', 'authored', 'benchmarked', 'hardened',
]);

const PASSIVE_PHRASES = [
  'responsible for', 'worked on', 'helped with', 'assisted in', 'duties included',
  'tasked with', 'involved in', 'participated in', 'did various',
];

const KNOWN_SECTIONS = new Set([
  'summary', 'objective', 'profile', 'experience', 'work experience',
  'employment', 'projects', 'skills', 'technical skills', 'education',
  'certifications', 'awards', 'publications',
]);

const BULLET_REGEX = /^([-*•▪◦]|\d+[.)])\s+.+/;
const CONTACT_REGEX = /(@|\[REDACTED_EMAIL\]|\[REDACTED_PHONE\]|linkedin\.com|github\.com|\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b)/i;
const DATE_RANGE_REGEX = /(20\d{2}|19\d{2})\s*[-–—to]+\s*(20\d{2}|present|current)/i;
const METRIC_REGEX = /(\$\d+[\d,.]*[kmb]?|\b\d+(?:\.\d+)?\s*(%|x|ms|sec|seconds|minutes|hours|hrs|k|m|b|million|billion|users|requests|rps|tps|queries|clients|engineers|teams|projects|gb|tb)\b)/gi;

function normalizeWhitespace(input: string): string {
  return input
    .replace(/[ \t\v\f]+/g, ' ')
    .replace(/\r?\n+/g, '\n')
    .trim();
}

function tokenize(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const matches = text.toLowerCase().match(/[a-z0-9+#.-]{2,}/g) || [];
  for (const raw of matches) {
    const tok = raw.replace(/^\.+|\.+$/g, '');
    if (tok.length < 2 || STOP_WORDS.has(tok)) continue;
    freq.set(tok, (freq.get(tok) || 0) + 1);
  }
  return freq;
}

function canonicalSection(heading: string): string {
  if (heading.includes('experience') || heading.includes('employment')) return 'experience';
  if (heading.includes('skill')) return 'skills';
  if (heading.includes('education')) return 'education';
  if (heading.includes('summary') || heading.includes('objective') || heading.includes('profile')) return 'summary';
  if (heading.includes('project')) return 'projects';
  if (heading.includes('certif')) return 'certifications';
  return heading;
}

function parseSections(lines: string[]): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let active = 'header';
  sections.set(active, []);
  for (const line of lines) {
    const normalizedHeading = line.toLowerCase().replace(/[:\-_=|]+$/, '').trim();
    if (line.length <= 45 && KNOWN_SECTIONS.has(normalizedHeading)) {
      active = canonicalSection(normalizedHeading);
      if (!sections.has(active)) sections.set(active, []);
    } else {
      const bucket = sections.get(active) || [];
      bucket.push(line);
      sections.set(active, bucket);
    }
  }
  return sections;
}

function extractRequiredKeywords(jobTitle?: string, jobDescription?: string): string[] {
  const source = jobDescription?.trim()
    ? `${jobTitle || ''} ${jobDescription}`
    : jobTitle?.trim() || 'Software Engineer Java SQL REST API';
  const lower = source.toLowerCase();
  const keywords = new Set<string>();

  for (const skill of DOMAIN_SKILL_LEXICON) {
    if (lower.includes(skill)) {
      keywords.add(skill);
    }
  }

  const freq = tokenize(source);
  const topTokens = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tok]) => tok)
    .filter((tok) => tok.length >= 3)
    .slice(0, 12);

  for (const tok of topTokens) {
    keywords.add(tok);
  }
  return [...keywords];
}

function makeCategory(score: number, feedback: string): CategoryScore {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score: clamped,
    feedback,
    status: clamped >= 80 ? 'good' : clamped >= 60 ? 'warning' : 'critical',
  };
}

export interface DeterministicAuditOptions {
  resumeText: string;
  fileName?: string;
  detectedFormat?: string;
  jobTitle?: string;
  jobDescription?: string;
  targetLevel?: string;
  redactPii?: boolean;
  retentionPolicy?: 'EPHEMERAL' | 'HOURS_24' | 'DAYS_7';
}

export function runDeterministicAudit(options: DeterministicAuditOptions): ResumeAnalysis {
  const startHr = performance.now();
  const shouldRedact = options.redactPii !== false;
  const redaction = shouldRedact
    ? redactResumePii(options.resumeText)
    : { redactedText: options.resumeText, totalMaskedCount: 0, categoryCounts: {} };

  const normalized = normalizeWhitespace(redaction.redactedText);
  const lines = redaction.redactedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const wordCount = normalized ? normalized.split(/\s+/).length : 0;
  const sections = parseSections(lines);
  const bullets = lines
    .filter((l) => BULLET_REGEX.test(l))
    .map((l) => l.replace(/^([-*•▪◦]|\d+[.)])\s+/, '').trim());
  const tokenFreq = tokenize(normalized);
  const lowerFull = normalized.toLowerCase();

  // 1. ATS Parsability & Structure (25%)
  const coreSections = ['experience', 'skills', 'education', 'summary'];
  const foundSections = coreSections.filter((s) => (sections.get(s)?.length || 0) > 0).length;
  const hasContact = CONTACT_REGEX.test(normalized);
  const hasDateRange = DATE_RANGE_REGEX.test(normalized);
  let parsabilityScore = 20 + foundSections * 11;
  if (hasContact) parsabilityScore += 16;
  if (hasDateRange) parsabilityScore += 10;
  if (wordCount >= 180 && wordCount <= 950) parsabilityScore += 10;
  else if (wordCount >= 100 && wordCount <= 1250) parsabilityScore += 5;
  parsabilityScore = Math.min(100, parsabilityScore);

  const atsParsability = makeCategory(
    parsabilityScore,
    foundSections >= 3
      ? `Detected ${foundSections}/4 standard ATS sections and ${wordCount} words with machine-readable structure.`
      : `Only ${foundSections}/4 standard ATS headings detected (Experience, Skills, Education, Summary); add explicit headings.`
  );

  // 2. Quantifiable Impact (25%)
  let quantifiedBullets = 0;
  let totalMetricMentions = 0;
  for (const b of bullets) {
    const matches = b.match(METRIC_REGEX);
    if (matches && matches.length > 0) {
      quantifiedBullets++;
      totalMetricMentions += matches.length;
    }
  }
  if (bullets.length === 0) {
    totalMetricMentions = (normalized.match(METRIC_REGEX) || []).length;
  }
  let impactScore: number;
  if (bullets.length > 0) {
    const ratio = quantifiedBullets / bullets.length;
    impactScore = Math.round(22 + Math.min(1, ratio / 0.75) * 58 + Math.min(20, totalMetricMentions * 2.5));
  } else {
    impactScore = Math.round(18 + Math.min(45, totalMetricMentions * 7.5));
  }
  impactScore = Math.max(15, Math.min(100, impactScore));
  const quantifiableImpact = makeCategory(
    impactScore,
    bullets.length === 0
      ? `No structured bullet points detected (${totalMetricMentions} numeric metrics found). Format achievements as quantified XYZ bullets.`
      : `${quantifiedBullets} of ${bullets.length} bullets contain quantified outcomes (${totalMetricMentions} total metric signals).`
  );

  // 3. Action Verbs & Ownership (15%)
  let strongStarts = 0;
  for (const b of bullets) {
    const firstWord = (b.toLowerCase().split(/\s+/)[0] || '').replace(/[^a-z]/g, '');
    if (STRONG_VERBS.has(firstWord)) strongStarts++;
  }
  let passiveHits = 0;
  for (const phrase of PASSIVE_PHRASES) {
    if (lowerFull.includes(phrase)) passiveHits++;
  }
  let strongAnywhere = 0;
  for (const tok of tokenFreq.keys()) {
    if (STRONG_VERBS.has(tok)) strongAnywhere++;
  }
  let verbScore: number;
  if (bullets.length > 0) {
    const strongRatio = strongStarts / bullets.length;
    verbScore = Math.round(32 + strongRatio * 56 + Math.min(12, strongAnywhere * 2) - passiveHits * 11);
  } else {
    verbScore = 28 + Math.min(35, strongAnywhere * 5) - passiveHits * 10;
  }
  verbScore = Math.max(15, Math.min(100, verbScore));
  const actionVerbs = makeCategory(
    verbScore,
    passiveHits > 0
      ? `Found ${passiveHits} passive phrases ('responsible for'/'worked on'). Start bullets with high-ownership verbs.`
      : `${strongStarts}/${Math.max(1, bullets.length)} bullets open with strong action verbs (${strongAnywhere} distinct ownership verbs).`
  );

  // 4. Keyword & Skill Alignment (20%)
  const requiredKeywords = extractRequiredKeywords(options.jobTitle, options.jobDescription);
  const matchedKeywords: string[] = [];
  const missingCrucialKeywords: string[] = [];
  for (const kw of requiredKeywords) {
    if (tokenFreq.has(kw) || lowerFull.includes(kw)) {
      matchedKeywords.push(kw);
    } else {
      missingCrucialKeywords.push(kw);
    }
  }
  const recall = requiredKeywords.length > 0 ? matchedKeywords.length / requiredKeywords.length : 0.65;
  const kwScore = Math.max(15, Math.min(100, Math.round(15 + recall * 85)));
  const keywordMatch = makeCategory(
    kwScore,
    `Matched ${matchedKeywords.length} of ${requiredKeywords.length} target keywords (${Math.round(recall * 100)}% coverage).`
  );

  // 5. Formatting & Readability (15%)
  let fmtScore = 30;
  if (bullets.length >= 6) fmtScore += 30;
  else if (bullets.length >= 3) fmtScore += 20;
  else if (bullets.length > 0) fmtScore += 10;

  if (bullets.length > 0) {
    const wellSized = bullets.filter((b) => {
      const wc = b.split(/\s+/).length;
      return wc >= 8 && wc <= 34;
    }).length;
    fmtScore += Math.round((wellSized / bullets.length) * 20);
  }
  const wallLines = lines.filter((l) => l.split(/\s+/).length > 55).length;
  fmtScore += Math.max(0, 20 - wallLines * 10);
  fmtScore = Math.max(15, Math.min(100, fmtScore));
  const formattingReadability = makeCategory(
    fmtScore,
    wallLines > 0
      ? `Detected ${wallLines} dense paragraph blocks (>55 words/line). Break dense prose into scannable 1–2 line bullets.`
      : `Clean scannable layout with ${bullets.length} structured bullets across ${lines.length} lines.`
  );

  // Weighted Composite Score (matches Java ResumeAnalyzerService weights exactly)
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        atsParsability.score * 0.25 +
          quantifiableImpact.score * 0.25 +
          actionVerbs.score * 0.15 +
          keywordMatch.score * 0.20 +
          formattingReadability.score * 0.15
      )
    )
  );

  const scoreLabel =
    overallScore >= 85
      ? 'Strong Alignment'
      : overallScore >= 70
      ? 'Competitive'
      : overallScore >= 55
      ? 'Developing'
      : 'Needs Major Revision';

  // Prioritized critical fixes
  const criticalFixes: CriticalFix[] = [];
  if (quantifiableImpact.score < 75) {
    criticalFixes.push({
      title: 'Quantify experience outcomes with Google XYZ metrics',
      section: 'Experience',
      issue: quantifiableImpact.feedback,
      recommendation: 'Add measurable percentages, throughput, latency, or cost impact to at least 70% of bullets.',
      priority: 'high',
    });
  }
  if (keywordMatch.score < 75 && missingCrucialKeywords.length > 0) {
    criticalFixes.push({
      title: 'Close critical job-description keyword gaps',
      section: 'Skills & Experience',
      issue: `Missing target role terminology: ${missingCrucialKeywords.slice(0, 6).join(', ')}`,
      recommendation: 'Integrate authentic project usage of these technologies into your Skills and Experience bullets.',
      priority: 'high',
    });
  }
  if (atsParsability.score < 75) {
    criticalFixes.push({
      title: 'Standardize ATS section headings and date formats',
      section: 'Structure',
      issue: atsParsability.feedback,
      recommendation: 'Use standard headings (Summary, Experience, Skills, Education) and consistent YYYY–YYYY date ranges.',
      priority: 'high',
    });
  }
  if (actionVerbs.score < 75) {
    criticalFixes.push({
      title: 'Replace passive responsibility phrasing with action verbs',
      section: 'Experience',
      issue: actionVerbs.feedback,
      recommendation: 'Lead bullets with verbs like Architected, Engineered, Optimized, Automated, or Reduced.',
      priority: 'medium',
    });
  }
  if (formattingReadability.score < 75) {
    criticalFixes.push({
      title: 'Improve bullet scannability and break up dense paragraphs',
      section: 'Formatting',
      issue: formattingReadability.feedback,
      recommendation: 'Keep bullets between 10 and 30 words and avoid single-line paragraphs exceeding 55 words.',
      priority: 'medium',
    });
  }
  if (criticalFixes.length === 0) {
    criticalFixes.push({
      title: 'Tailor top summary bullets to each company domain',
      section: 'Summary',
      issue: 'Resume meets all deterministic rubric baselines.',
      recommendation: 'Customize your top two summary claims to highlight domain-specific outcomes for each application.',
      priority: 'low',
    });
  }

  // Deterministic XYZ bullet enhancement suggestions for unquantified bullets
  const bulletEnhancements: BulletEnhancement[] = [];
  const candidateWeakBullets = bullets
    .filter((b) => !(b.match(METRIC_REGEX)?.length))
    .slice(0, 3);

  for (const orig of candidateWeakBullets) {
    const cleaned = orig.replace(/^(responsible for|worked on|helped with|assisted in)\s+/i, '');
    bulletEnhancements.push({
      original: orig,
      improved: `Engineered ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1).replace(/\.$/, '')}, improving throughput by [X%] and cutting manual overhead by [Y hrs/week] via automated testing and telemetry.`,
      explanation: 'Replaces passive/unmeasured phrasing with Google XYZ structure (Accomplished X, measured by Y, by doing Z).',
      impactCategory: 'Quantified XYZ Impact',
    });
  }
  if (bulletEnhancements.length === 0 && bullets.length > 0) {
    bulletEnhancements.push({
      original: bullets[0],
      improved: `${bullets[0]} (Strong baseline — verify exact scope, team size, and business KPI before submitting.)`,
      explanation: 'Bullet already contains measurable impact signals; double-check alignment with target seniority.',
      impactCategory: 'Verified Baseline',
    });
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (atsParsability.score >= 75) strengths.push(atsParsability.feedback);
  else weaknesses.push(atsParsability.feedback);
  if (quantifiableImpact.score >= 75) strengths.push(quantifiableImpact.feedback);
  else weaknesses.push(quantifiableImpact.feedback);
  if (actionVerbs.score >= 75) strengths.push(actionVerbs.feedback);
  else weaknesses.push(actionVerbs.feedback);
  if (keywordMatch.score >= 75) strengths.push(keywordMatch.feedback);
  else weaknesses.push(keywordMatch.feedback);
  if (formattingReadability.score >= 75) strengths.push(formattingReadability.feedback);
  else weaknesses.push(formattingReadability.feedback);

  const firstLineName =
    lines[0] && lines[0].length <= 45 && !lines[0].includes('@') && !lines[0].includes('[REDACTED')
      ? lines[0]
      : 'Candidate Profile (Redacted)';

  const topSkillsIdentified = matchedKeywords.length > 0
    ? matchedKeywords.slice(0, 8)
    : DOMAIN_SKILL_LEXICON.filter((s) => lowerFull.includes(s)).slice(0, 8);

  const analysisTimeMs = Math.max(1, Number((performance.now() - startHr).toFixed(2)));

  return {
    candidateName: firstLineName,
    detectedRole: options.jobTitle || 'Software / Technical Professional',
    targetRoleMatch: `${Math.round(recall * 100)}% keyword match against target role requirements`,
    overallScore,
    scoreLabel,
    executiveSummary: `Deterministic local audit scored ${overallScore}/100 (${scoreLabel}) across 5 weighted rubric dimensions in ${analysisTimeMs}ms. ${
      criticalFixes[0] ? `Primary optimization opportunity: ${criticalFixes[0].title}.` : ''
    }`,
    categoryScores: {
      atsParsability,
      quantifiableImpact,
      actionVerbs,
      keywordMatch,
      formattingReadability,
    },
    strengths: strengths.length > 0 ? strengths : ['Plain-text document successfully parsed without external API dependencies.'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No major rubric gaps detected against the supplied criteria.'],
    criticalFixes,
    bulletEnhancements,
    keywordAnalysis: {
      matchedKeywords,
      missingCrucialKeywords,
      recommendedAdditions: missingCrucialKeywords.slice(0, 5),
      jobDescriptionMatchPercentage: Math.round(recall * 100),
    },
    sectionEvaluations: [
      {
        sectionName: 'Header & Contact Details',
        rating: hasContact ? 'excellent' : 'needs_work',
        positiveNotes: hasContact ? 'Contact signal verified (including PII-redacted placeholders).' : 'Header line detected.',
        improvements: hasContact ? 'Ensure LinkedIn/GitHub URLs remain clickable in exported PDF.' : 'Add professional email, phone, or portfolio links.',
      },
      {
        sectionName: 'Work Experience & Metrics',
        rating: quantifiableImpact.score >= 75 ? 'excellent' : quantifiableImpact.score >= 55 ? 'adequate' : 'needs_work',
        positiveNotes: quantifiableImpact.feedback,
        improvements: quantifiableImpact.score >= 75 ? 'Maintain concise XYZ formatting across recent roles.' : 'Add concrete metrics (%, $, latency, scale) to experience bullets.',
      },
      {
        sectionName: 'Skills & Keyword Alignment',
        rating: keywordMatch.score >= 75 ? 'excellent' : keywordMatch.score >= 55 ? 'adequate' : 'needs_work',
        positiveNotes: `${matchedKeywords.length} target keywords matched.`,
        improvements: missingCrucialKeywords.length > 0 ? `Consider weaving in: ${missingCrucialKeywords.slice(0, 5).join(', ')}.` : 'Strong alignment with target requirements.',
      },
      {
        sectionName: 'Formatting & Readability',
        rating: formattingReadability.score >= 75 ? 'excellent' : formattingReadability.score >= 55 ? 'adequate' : 'needs_work',
        positiveNotes: formattingReadability.feedback,
        improvements: wallLines > 0 ? 'Break long paragraph blocks into scannable bullets.' : 'Clean bullet structure verified.',
      },
    ],
    atsComplianceChecklist: [
      { item: 'Standard ATS section headings present (3+ core sections)', passed: foundSections >= 3, details: `${foundSections}/4 core headings detected.` },
      { item: 'Contact details recognized (supports PII-redacted placeholders)', passed: hasContact, details: hasContact ? 'Contact metadata verified.' : 'No contact metadata detected.' },
      { item: 'Consistent chronological date ranges', passed: hasDateRange, details: hasDateRange ? 'YYYY–YYYY / Present range found.' : 'Add explicit start/end years.' },
      { item: 'Scannable bullet structure without dense walls of text', passed: wallLines === 0 && bullets.length >= 3, details: `${bullets.length} bullets, ${wallLines} dense blocks.` },
      { item: 'Zero external API dependency (Offline deterministic run)', passed: true, details: `Executed locally in ${analysisTimeMs}ms.` },
    ],
    estimatedYoe: options.targetLevel || 'Evaluated by Rubric',
    topSkillsIdentified,
    analysisTimeMs,
    detectedFormat: options.detectedFormat || 'Plain Text',
    cached: false,
    isFallbackEngine: false,
    engineMode: 'deterministic',
    modelUsed: 'CareerPulse Deterministic Core Engine (Offline)',
    piiItemsMasked: redaction.totalMaskedCount,
    piiBreakdown: redaction.categoryCounts,
    retentionPolicy: options.retentionPolicy || 'HOURS_24',
    redactedPreview: normalized.slice(0, 2000),
    disclaimer: VALIDATION_DISCLAIMER,
  };
}
