import { ResumeAnalysis } from '../types/resume';

export interface ResumeExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface ResumeProjectItem {
  id: string;
  name: string;
  techStack: string;
  description: string;
}

export interface ResumeEducationItem {
  id: string;
  degree: string;
  school: string;
  period: string;
  details: string;
}

export interface ResumeCertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface ResumeBioDataDetails {
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  fatherName: string;
  permanentAddress: string;
  hobbies: string;
  declaration: string;
  place: string;
  declarationDate: string;
}

export type PhotoShape = 'circle' | 'rounded' | 'square';

export interface ResumeDraft {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  photoUrl: string;
  showPhoto: boolean;
  photoShape: PhotoShape;
  includeBioData: boolean;
  summary: string;
  skills: string[];
  languages: string[];
  experiences: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  education: ResumeEducationItem[];
  certifications: ResumeCertificationItem[];
  bioData: ResumeBioDataDetails;
}

export type BuilderTemplateId = 'executive' | 'sidebar' | 'classic' | 'biodata';
export type BuilderAccentId = 'indigo' | 'emerald' | 'slate' | 'crimson';

export const DEFAULT_DECLARATION =
  'I hereby declare that all the information furnished above is true, complete, and accurate to the best of my knowledge and belief.';

export const AVATAR_AARAV = '/src/assets/images/avatar_aarav_sharma_1795607286085.jpg';
export const AVATAR_MAYA = '/src/assets/images/avatar_maya_lin_1795607289896.jpg';
export const AVATAR_ROHAN = '/src/assets/images/avatar_rohan_verma_1795607287251.jpg';

export function createDefaultBioData(place = 'Bengaluru, India'): ResumeBioDataDetails {
  return {
    dateOfBirth: '14 August 1998',
    gender: 'Male',
    maritalStatus: 'Single',
    nationality: 'Indian',
    fatherName: 'Rajesh Sharma',
    permanentAddress: '42 Indiranagar 2nd Stage, Bengaluru, Karnataka 560038',
    hobbies: 'Open-Source Java Tooling, Chess, Technical Writing',
    declaration: DEFAULT_DECLARATION,
    place,
    declarationDate: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  };
}

export const STARTER_PRESETS: Array<{
  id: string;
  label: string;
  recommendedTemplate: BuilderTemplateId;
  draft: ResumeDraft;
}> = [
  {
    id: 'java-backend',
    label: 'Java Backend Engineer',
    recommendedTemplate: 'executive',
    draft: {
      fullName: 'Aarav Sharma',
      headline: 'Senior Java Backend & Distributed Systems Engineer',
      email: 'aarav.sharma@example.com',
      phone: '+91 98765 43210',
      location: 'Bengaluru / Remote',
      linkedin: 'linkedin.com/in/aarav-sharma-java',
      github: 'github.com/aaravsharma-dev',
      photoUrl: AVATAR_AARAV,
      showPhoto: true,
      photoShape: 'rounded',
      includeBioData: false,
      summary:
        'Java 17 & Spring Boot Backend Engineer with 5+ years of experience designing fault-tolerant microservices, high-throughput JDBC/PostgreSQL pipelines, and Jakarta EE APIs. Proven track record of cutting tail latency by 58%, boosting throughput to 35K+ RPS, and driving 99.98% uptime.',
      skills: [
        'Java 17',
        'Spring Boot',
        'Jakarta EE',
        'JDBC & SQL',
        'PostgreSQL',
        'Apache Kafka',
        'Docker',
        'Kubernetes',
        'JUnit 5',
        'Maven',
        'REST APIs',
        'Redis',
      ],
      languages: ['English (Fluent)', 'Hindi (Native)', 'Kannada (Conversational)'],
      experiences: [
        {
          id: 'exp-1',
          role: 'Senior Backend Software Engineer',
          company: 'FinScale Cloud Systems',
          location: 'Remote',
          period: '2022 – Present',
          bullets: [
            'Architected event-driven Java 17 payment microservices processing 35,000+ transactions per second at 99.98% SLA uptime.',
            'Optimized PostgreSQL query plans and HikariCP connection pools, reducing p99 API response latency from 240ms to 68ms.',
            'Automated CI/CD build pipelines with Maven, Checkstyle, and JUnit 5, cutting production regression defects by 47%.',
          ],
        },
        {
          id: 'exp-2',
          role: 'Software Engineer',
          company: 'NexaData Enterprise Solutions',
          location: 'Bengaluru, IN',
          period: '2020 – 2022',
          bullets: [
            'Engineered RESTful Jakarta EE & JDBC ingestion APIs handling 1.8M daily document scans with automated PII redaction.',
            'Spearheaded Redis caching layer across analytics dashboards, slashing database CPU utilization by 42% and saving $48K/year.',
          ],
        },
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'CareerPulse — Offline Deterministic ATS Analyzer',
          techStack: 'Java 17 · Maven · JDBC · H2 · Jakarta EE · Swing',
          description:
            'Built a zero-API-key deterministic resume scoring engine with multi-format document extraction, PII masking, and a 12-resume labeled validation suite achieving sub-10ms audit latency.',
        },
      ],
      education: [
        {
          id: 'edu-1',
          degree: 'B.Tech in Computer Science & Engineering',
          school: 'National Institute of Technology',
          period: '2016 – 2020',
          details: 'CGPA: 8.9/10 · Distributed Systems, Database Internals, Software Engineering',
        },
      ],
      certifications: [
        {
          id: 'cert-1',
          name: 'Oracle Certified Professional: Java SE 17 Developer',
          issuer: 'Oracle University',
          year: '2023',
        },
        {
          id: 'cert-2',
          name: 'AWS Certified Developer — Associate',
          issuer: 'Amazon Web Services',
          year: '2022',
        },
      ],
      bioData: createDefaultBioData('Bengaluru, India'),
    },
  },
  {
    id: 'formal-biodata',
    label: 'Job Bio-Data (Formal)',
    recommendedTemplate: 'biodata',
    draft: {
      fullName: 'Aarav Sharma',
      headline: 'Software Engineer (Java 17 · Jakarta EE · SQL) — Formal Job Bio-Data',
      email: 'aarav.sharma@example.com',
      phone: '+91 98765 43210',
      location: 'Bengaluru, Karnataka, India',
      linkedin: 'linkedin.com/in/aarav-sharma-java',
      github: 'github.com/aaravsharma-dev',
      photoUrl: AVATAR_AARAV,
      showPhoto: true,
      photoShape: 'square',
      includeBioData: true,
      summary:
        'Seeking a challenging Software Engineering role where I can leverage 5+ years of Core Java 17, JDBC, Jakarta EE, and enterprise database design experience to build dependable, secure software products.',
      skills: [
        'Core Java 17',
        'JDBC & MySQL',
        'Jakarta EE Servlets & JSP',
        'Java Swing GUI',
        'Spring Boot',
        'Maven & JUnit 5',
        'REST APIs',
        'Git & CI/CD',
      ],
      languages: ['English (Read, Write, Speak)', 'Hindi (Native)', 'Kannada (Speak)'],
      experiences: [
        {
          id: 'exp-bd-1',
          role: 'Senior Backend Software Engineer',
          company: 'FinScale Cloud Systems Pvt. Ltd.',
          location: 'Bengaluru',
          period: '2022 – Present',
          bullets: [
            'Led core Java 17 and MySQL payment settlement APIs serving 35,000+ transactions/sec with 99.98% uptime.',
            'Reduced production database latency by 58% through indexed SQL query refactoring and connection pool tuning.',
          ],
        },
      ],
      projects: [
        {
          id: 'proj-bd-1',
          name: 'CareerPulse — Java Enterprise Resume Analyzer & Bio-Data Studio',
          techStack: 'Java 17 · JDBC · MySQL/H2 · Jakarta EE 10 · Swing',
          description:
            'Developed an offline deterministic ATS audit engine, PII redactor, and structured Resume/Bio-Data generator with JUnit 5 verification.',
        },
      ],
      education: [
        {
          id: 'edu-bd-1',
          degree: 'B.Tech — Computer Science & Engineering',
          school: 'National Institute of Technology, Surathkal',
          period: '2016 – 2020',
          details: '8.9 / 10 CGPA (First Class with Distinction)',
        },
        {
          id: 'edu-bd-2',
          degree: 'Senior Secondary (Class XII — CBSE)',
          school: 'Delhi Public School, Bengaluru',
          period: '2014 – 2016',
          details: '94.6% Aggregate (Physics, Chemistry, Mathematics, CS)',
        },
      ],
      certifications: [
        {
          id: 'cert-bd-1',
          name: 'Oracle Certified Professional: Java SE 17 Developer',
          issuer: 'Oracle',
          year: '2023',
        },
      ],
      bioData: createDefaultBioData('Bengaluru, Karnataka'),
    },
  },
  {
    id: 'fullstack',
    label: 'Full-Stack Developer',
    recommendedTemplate: 'sidebar',
    draft: {
      fullName: 'Maya Lin',
      headline: 'Full-Stack Software Engineer (TypeScript · React · Node · SQL)',
      email: 'maya.lin@example.com',
      phone: '+1 (628) 555-0192',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/mayalin-eng',
      github: 'github.com/mayalin-dev',
      photoUrl: AVATAR_MAYA,
      showPhoto: true,
      photoShape: 'circle',
      includeBioData: false,
      summary:
        'Full-Stack Engineer with 4+ years building responsive web platforms and resilient backend APIs. Delivered 3x faster page loads, scaled customer-facing SaaS workflows to 180K+ monthly active users, and reduced cloud infrastructure spend by 31%.',
      skills: [
        'TypeScript',
        'React 19',
        'Node.js',
        'Express',
        'PostgreSQL',
        'Tailwind CSS',
        'REST & GraphQL',
        'Docker',
        'AWS',
        'CI/CD',
        'Playwright',
      ],
      languages: ['English (Native)', 'Mandarin (Fluent)'],
      experiences: [
        {
          id: 'exp-fs-1',
          role: 'Full-Stack Engineer',
          company: 'OrbitFlow Analytics',
          location: 'San Francisco, CA',
          period: '2022 – Present',
          bullets: [
            'Built real-time workflow analytics workspace in React and TypeScript serving 180,000+ monthly active users with 99.95% availability.',
            'Refactored Node.js & PostgreSQL reporting endpoints, cutting median query time by 64% and lowering RDS spend by $36K annually.',
            'Established end-to-end automated testing across 120+ critical user flows, reducing release rollbacks by 52%.',
          ],
        },
      ],
      projects: [
        {
          id: 'proj-fs-1',
          name: 'PulseBoard — Real-Time Team Sprint Tracker',
          techStack: 'React · TypeScript · Node.js · PostgreSQL',
          description:
            'Designed and shipped a zero-latency sprint velocity dashboard with keyboard shortcuts, CSV exports, and RBAC team workspaces.',
        },
      ],
      education: [
        {
          id: 'edu-fs-1',
          degree: 'B.S. in Computer Science',
          school: 'University of California, San Diego',
          period: '2017 – 2021',
          details: 'Dean’s Honors List · Web Systems & Human-Computer Interaction',
        },
      ],
      certifications: [
        {
          id: 'cert-fs-1',
          name: 'AWS Certified Solutions Architect — Associate',
          issuer: 'Amazon Web Services',
          year: '2023',
        },
      ],
      bioData: {
        ...createDefaultBioData('San Francisco, CA'),
        gender: 'Female',
        nationality: 'American',
        fatherName: 'David Lin',
        permanentAddress: 'San Francisco, California, USA',
        hobbies: 'UI Typography, Bouldering, Open-Source Design Systems',
      },
    },
  },
  {
    id: 'data-ai',
    label: 'Data & ML Engineer',
    recommendedTemplate: 'sidebar',
    draft: {
      fullName: 'Rohan Verma',
      headline: 'Data & Machine Learning Engineer (Python · SQL · Spark)',
      email: 'rohan.verma@example.com',
      phone: '+1 (312) 555-0174',
      location: 'Austin, TX',
      linkedin: 'linkedin.com/in/rohanverma-ml',
      github: 'github.com/rohanverma-ai',
      photoUrl: AVATAR_ROHAN,
      showPhoto: true,
      photoShape: 'circle',
      includeBioData: false,
      summary:
        'Data & ML Engineer specializing in scalable ETL pipelines, feature engineering, and production model evaluation. Improved demand forecasting accuracy by 19% and automated 40TB/month data ingestion with 99.9% pipeline SLA.',
      skills: [
        'Python',
        'SQL',
        'Apache Spark',
        'Airflow',
        'PyTorch',
        'Scikit-Learn',
        'dbt',
        'Snowflake',
        'Docker',
        'AWS S3',
        'Tableau',
      ],
      languages: ['English (Fluent)', 'Hindi (Native)'],
      experiences: [
        {
          id: 'exp-ml-1',
          role: 'Machine Learning Data Engineer',
          company: 'StrataPulse Logistics',
          location: 'Austin, TX',
          period: '2021 – Present',
          bullets: [
            'Architected Apache Spark and Airflow ETL pipelines processing 40TB+ monthly telemetry with 99.9% on-time SLA delivery.',
            'Trained and deployed gradient-boosted demand forecasting models, improving inventory accuracy by 19% and saving $1.2M/year.',
          ],
        },
      ],
      projects: [
        {
          id: 'proj-ml-1',
          name: 'AutoEval — Deterministic Model Benchmark Suite',
          techStack: 'Python · SQL · DuckDB · FastAPI',
          description:
            'Created reproducible MAE, Spearman correlation, and latency benchmarking pipelines for automated regression gating in CI.',
        },
      ],
      education: [
        {
          id: 'edu-ml-1',
          degree: 'M.S. in Data Science',
          school: 'University of Texas at Austin',
          period: '2019 – 2021',
          details: 'Applied Machine Learning & Statistical Modeling',
        },
      ],
      certifications: [
        {
          id: 'cert-ml-1',
          name: 'Databricks Certified Data Engineer Professional',
          issuer: 'Databricks',
          year: '2024',
        },
      ],
      bioData: {
        ...createDefaultBioData('Austin, TX'),
        dateOfBirth: '03 March 1996',
        fatherName: 'Suresh Verma',
        permanentAddress: 'Austin, Texas, USA',
        hobbies: 'Kaggle Competitions, Distance Running, Chess',
      },
    },
  },
];

export function buildDraftFromAnalysis(
  analysis: ResumeAnalysis,
  acceptedSummary: boolean,
  acceptedBullets: string[],
  acceptedKeywordLines: string[]
): ResumeDraft {
  const rawText = analysis.extractedResumeText || analysis.redactedPreview || '';
  const emailMatch = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = rawText.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[a-z0-9_-]+/i);
  const githubMatch = rawText.match(/github\.com\/[a-z0-9_-]+/i);

  const cleanName =
    analysis.candidateName && !analysis.candidateName.includes('Redacted')
      ? analysis.candidateName
      : 'Your Full Name';

  const existingBullets = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^([-*•▪◦]|\d+[.)])\s+/.test(l))
    .map((l) => l.replace(/^([-*•▪◦]|\d+[.)])\s+/, '').trim());

  const upgradeMap = new Map<string, string>();
  for (const item of analysis.bulletEnhancements || []) {
    if (acceptedBullets.includes(item.improved)) {
      upgradeMap.set(item.original.trim(), item.improved.trim());
    }
  }

  const mergedBullets: string[] = [];
  for (const b of existingBullets) {
    const replacement = upgradeMap.get(b);
    if (replacement) {
      mergedBullets.push(replacement);
      upgradeMap.delete(b);
    } else {
      mergedBullets.push(b);
    }
  }

  for (const upgraded of upgradeMap.values()) {
    mergedBullets.push(upgraded);
  }
  for (const kwLine of acceptedKeywordLines) {
    if (!mergedBullets.includes(kwLine)) {
      mergedBullets.push(kwLine);
    }
  }

  const finalBullets =
    mergedBullets.length > 0
      ? mergedBullets.slice(0, 8)
      : [
          'Architected core production services aligned with modern ATS engineering benchmarks, cutting latency by 38%.',
          'Spearheaded automated quality testing and continuous delivery workflows, accelerating sprint velocity by 30%.',
        ];

  const allSkills = Array.from(
    new Set([
      ...(analysis.topSkillsIdentified || []),
      ...(analysis.keywordAnalysis?.matchedKeywords || []),
      ...(analysis.keywordAnalysis?.missingCrucialKeywords || []).slice(0, 4),
    ])
  )
    .map((s) => (s.length <= 4 ? s.toUpperCase() : s.charAt(0).toUpperCase() + s.slice(1)))
    .slice(0, 14);

  const roleTitle = analysis.detectedRole || 'Software Engineer';

  return {
    fullName: cleanName,
    headline: roleTitle,
    email: emailMatch ? emailMatch[0] : 'you@example.com',
    phone: phoneMatch ? phoneMatch[0] : '+1 (555) 010-2040',
    location: 'Remote / Open to Relocation',
    linkedin: linkedinMatch ? linkedinMatch[0] : 'linkedin.com/in/your-profile',
    github: githubMatch ? githubMatch[0] : 'github.com/your-handle',
    photoUrl: AVATAR_AARAV,
    showPhoto: true,
    photoShape: 'rounded',
    includeBioData: false,
    summary:
      acceptedSummary && analysis.suggestedSummary
        ? analysis.suggestedSummary
        : analysis.suggestedSummary ||
          `Results-driven ${roleTitle} focused on measurable delivery, clean system architecture, and high-reliability production execution.`,
    skills: allSkills.length > 0 ? allSkills : ['Java 17', 'SQL', 'REST APIs', 'Git', 'Docker', 'CI/CD'],
    languages: ['English (Fluent)'],
    experiences: [
      {
        id: 'exp-imported-1',
        role: roleTitle,
        company: 'Current / Recent Organization',
        location: 'Remote',
        period: '2022 – Present',
        bullets: finalBullets.slice(0, 5),
      },
      ...(finalBullets.length > 5
        ? [
            {
              id: 'exp-imported-2',
              role: 'Software Engineer',
              company: 'Previous Organization',
              location: 'Hybrid',
              period: '2020 – 2022',
              bullets: finalBullets.slice(5),
            },
          ]
        : []),
    ],
    projects: [
      {
        id: 'proj-imported-1',
        name: `${roleTitle.split(' ')[0]} Portfolio Initiative`,
        techStack: allSkills.slice(0, 4).join(' · ') || 'Java · SQL · REST',
        description:
          'Delivered end-to-end production architecture with automated testing, structured documentation, and quantified performance benchmarks.',
      },
    ],
    education: [
      {
        id: 'edu-imported-1',
        degree: 'Bachelor of Science / Technology in Computer Science',
        school: 'Your University Name',
        period: '2016 – 2020',
        details: 'Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering',
      },
    ],
    certifications: [
      {
        id: 'cert-imported-1',
        name: 'Verified Technical Certification',
        issuer: 'Accredited Provider',
        year: '2024',
      },
    ],
    bioData: createDefaultBioData('Remote'),
  };
}

export function serializeDraftToPlainText(draft: ResumeDraft): string {
  const lines: string[] = [];
  lines.push(draft.fullName.trim() || 'Candidate Name');
  if (draft.headline.trim()) lines.push(draft.headline.trim());
  const contacts = [draft.email, draft.phone, draft.location, draft.linkedin, draft.github]
    .map((c) => c.trim())
    .filter(Boolean);
  if (contacts.length > 0) lines.push(contacts.join(' | '));
  lines.push('');

  if (draft.summary.trim()) {
    lines.push('SUMMARY');
    lines.push(draft.summary.trim());
    lines.push('');
  }

  if (draft.skills.length > 0) {
    lines.push('TECHNICAL SKILLS');
    lines.push(draft.skills.filter(Boolean).join(', '));
    lines.push('');
  }

  if (draft.experiences.length > 0) {
    lines.push('WORK EXPERIENCE');
    for (const exp of draft.experiences) {
      lines.push(`${exp.role} — ${exp.company} | ${exp.location} | ${exp.period}`);
      for (const b of exp.bullets.filter((x) => x.trim().length > 0)) {
        lines.push(`- ${b.trim()}`);
      }
      lines.push('');
    }
  }

  if (draft.projects.length > 0) {
    lines.push('PROJECTS');
    for (const proj of draft.projects) {
      lines.push(`${proj.name}${proj.techStack ? ` (${proj.techStack})` : ''}`);
      if (proj.description.trim()) lines.push(`- ${proj.description.trim()}`);
      lines.push('');
    }
  }

  if (draft.education.length > 0) {
    lines.push('EDUCATION');
    for (const edu of draft.education) {
      lines.push(`${edu.degree} — ${edu.school} | ${edu.period}`);
      if (edu.details.trim()) lines.push(edu.details.trim());
    }
    lines.push('');
  }

  if (draft.certifications && draft.certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    for (const cert of draft.certifications) {
      lines.push(`- ${cert.name} — ${cert.issuer} (${cert.year})`);
    }
    lines.push('');
  }

  if (draft.languages && draft.languages.length > 0) {
    lines.push('LANGUAGES');
    lines.push(draft.languages.join(', '));
    lines.push('');
  }

  if (draft.includeBioData && draft.bioData) {
    lines.push('PERSONAL DETAILS (BIO-DATA)');
    if (draft.bioData.dateOfBirth) lines.push(`Date of Birth: ${draft.bioData.dateOfBirth}`);
    if (draft.bioData.gender) lines.push(`Gender: ${draft.bioData.gender}`);
    if (draft.bioData.maritalStatus) lines.push(`Marital Status: ${draft.bioData.maritalStatus}`);
    if (draft.bioData.nationality) lines.push(`Nationality: ${draft.bioData.nationality}`);
    if (draft.bioData.fatherName) lines.push(`Father / Guardian Name: ${draft.bioData.fatherName}`);
    if (draft.bioData.permanentAddress) lines.push(`Permanent Address: ${draft.bioData.permanentAddress}`);
    if (draft.bioData.hobbies) lines.push(`Hobbies & Interests: ${draft.bioData.hobbies}`);
    lines.push('');
    if (draft.bioData.declaration) {
      lines.push('DECLARATION');
      lines.push(draft.bioData.declaration);
      lines.push(`Place: ${draft.bioData.place} | Date: ${draft.bioData.declarationDate}`);
      lines.push(`Signature: ${draft.fullName}`);
    }
  }

  return lines.join('\n').trim();
}

export function computeLiveDraftAtsStats(draft: ResumeDraft) {
  const text = serializeDraftToPlainText(draft);
  const words = text.split(/\s+/).filter(Boolean).length;
  const bullets = draft.experiences.flatMap((e) => e.bullets).filter((b) => b.trim().length > 0);
  const metricRegex =
    /(\$\d+[\d,.]*[kmb]?|\b\d+(?:\.\d+)?\s*(%|x|ms|s|hrs|hours|k|m|b|million|users|rps|tps|tb|gb)\b)/i;
  const strongVerbs = new Set([
    'architected',
    'engineered',
    'designed',
    'implemented',
    'built',
    'led',
    'spearheaded',
    'optimized',
    'reduced',
    'increased',
    'accelerated',
    'automated',
    'migrated',
    'scaled',
    'delivered',
    'launched',
    'developed',
    'refactored',
    'established',
    'mentored',
    'streamlined',
    'eliminated',
    'secured',
    'deployed',
    'integrated',
    'created',
    'improved',
    'trained',
  ]);

  const quantifiedCount = bullets.filter((b) => metricRegex.test(b)).length;
  const strongStartCount = bullets.filter((b) => {
    const first = (b.trim().toLowerCase().split(/\s+/)[0] || '').replace(/[^a-z]/g, '');
    return strongVerbs.has(first);
  }).length;

  let score = 20;
  if (draft.fullName.trim() && draft.email.trim()) score += 12;
  if (draft.summary.trim().length >= 60) score += 12;
  if (draft.skills.length >= 6) score += 12;
  if (draft.education.length > 0) score += 8;
  if (bullets.length >= 4) score += 10;
  else if (bullets.length >= 2) score += 6;
  if (bullets.length > 0) {
    score += Math.round((quantifiedCount / bullets.length) * 16);
    score += Math.round((strongStartCount / bullets.length) * 10);
  }
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    words,
    bulletCount: bullets.length,
    quantifiedCount,
    strongStartCount,
    skillCount: draft.skills.filter(Boolean).length,
  };
}
