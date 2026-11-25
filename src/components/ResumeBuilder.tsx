import React, { useMemo, useRef, useState } from 'react';
import {
  BuilderAccentId,
  BuilderTemplateId,
  PhotoShape,
  ResumeDraft,
  STARTER_PRESETS,
  computeLiveDraftAtsStats,
  serializeDraftToPlainText,
} from '../utils/resumeBuilderHelpers';
import {
  Plus,
  Trash2,
  Printer,
  Download,
  Sparkles,
  FileText,
  Wand2,
  Check,
  Briefcase,
  GraduationCap,
  Code2,
  User,
  FolderGit2,
  ScanSearch,
  RefreshCw,
  Upload,
  Eye,
  EyeOff,
  Award,
  IdCard,
  Globe,
} from 'lucide-react';

interface ResumeBuilderProps {
  draft: ResumeDraft;
  onChangeDraft: (next: ResumeDraft) => void;
  onAnalyzeCreatedResume: (resumeText: string, targetRole: string) => void;
}

const ACCENT_THEMES: Record<
  BuilderAccentId,
  {
    label: string;
    swatch: string;
    primaryHex: string;
    softBgHex: string;
    sidebarBgHex: string;
    borderHex: string;
  }
> = {
  indigo: {
    label: 'Indigo',
    swatch: 'bg-indigo-600',
    primaryHex: '#3730a3',
    softBgHex: '#eef2ff',
    sidebarBgHex: '#1e1b4b',
    borderHex: '#c7d2fe',
  },
  emerald: {
    label: 'Emerald',
    swatch: 'bg-emerald-600',
    primaryHex: '#047857',
    softBgHex: '#ecfdf5',
    sidebarBgHex: '#064e3b',
    borderHex: '#a7f3d0',
  },
  slate: {
    label: 'Executive Slate',
    swatch: 'bg-slate-800',
    primaryHex: '#0f172a',
    softBgHex: '#f1f5f9',
    sidebarBgHex: '#0f172a',
    borderHex: '#cbd5e1',
  },
  crimson: {
    label: 'Crimson',
    swatch: 'bg-rose-700',
    primaryHex: '#9f1239',
    softBgHex: '#fff1f2',
    sidebarBgHex: '#4c0519',
    borderHex: '#fecdd3',
  },
};

function getInitials(name: string): string {
  const parts = (name || 'CP').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({
  draft,
  onChangeDraft,
  onAnalyzeCreatedResume,
}) => {
  const [editorSection, setEditorSection] = useState<
    'profile' | 'experience' | 'skills' | 'projects' | 'biodata'
  >('profile');
  const [template, setTemplate] = useState<BuilderTemplateId>('executive');
  const [accent, setAccent] = useState<BuilderAccentId>('indigo');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newLanguageInput, setNewLanguageInput] = useState('');
  const [upgradingKey, setUpgradingKey] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const stats = useMemo(() => computeLiveDraftAtsStats(draft), [draft]);
  const theme = ACCENT_THEMES[accent];

  const notifyExport = (msg: string) => {
    setExportMessage(msg);
    setTimeout(() => setExportMessage(null), 2600);
  };

  const updateField = <K extends keyof ResumeDraft>(key: K, value: ResumeDraft[K]) => {
    onChangeDraft({ ...draft, [key]: value });
  };

  const updateBioField = <K extends keyof ResumeDraft['bioData']>(
    key: K,
    value: ResumeDraft['bioData'][K]
  ) => {
    onChangeDraft({
      ...draft,
      bioData: {
        ...draft.bioData,
        [key]: value,
      },
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notifyExport('Please select a valid image file (.jpg, .png, .webp).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoLoadError(false);
        onChangeDraft({
          ...draft,
          photoUrl: reader.result,
          showPhoto: true,
        });
        notifyExport('Profile photo updated locally (100% offline).');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: (typeof STARTER_PRESETS)[number]) => {
    setPhotoLoadError(false);
    onChangeDraft(structuredClone(preset.draft));
    setTemplate(preset.recommendedTemplate);
    if (preset.draft.includeBioData) {
      setEditorSection('biodata');
    }
  };

  const handleTemplateSwitch = (nextTemplate: BuilderTemplateId) => {
    setTemplate(nextTemplate);
    if (nextTemplate === 'biodata' && !draft.includeBioData) {
      onChangeDraft({ ...draft, includeBioData: true, showPhoto: true, photoShape: 'square' });
    }
  };

  const addSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parts = newSkillInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    updateField('skills', Array.from(new Set([...draft.skills, ...parts])));
    setNewSkillInput('');
  };

  const removeSkill = (skill: string) => {
    updateField(
      'skills',
      draft.skills.filter((s) => s !== skill)
    );
  };

  const addLanguage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parts = newLanguageInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    updateField('languages', Array.from(new Set([...(draft.languages || []), ...parts])));
    setNewLanguageInput('');
  };

  const removeLanguage = (lang: string) => {
    updateField(
      'languages',
      (draft.languages || []).filter((l) => l !== lang)
    );
  };

  const addExperience = () => {
    updateField('experiences', [
      ...draft.experiences,
      {
        id: `exp-${Date.now()}`,
        role: 'Software Engineer',
        company: 'Company Name',
        location: 'Remote',
        period: '2023 – Present',
        bullets: [
          'Architected scalable backend services reducing API response latency by 35% across 20K+ daily requests.',
        ],
      },
    ]);
  };

  const updateExperience = (id: string, patch: Partial<ResumeDraft['experiences'][number]>) => {
    updateField(
      'experiences',
      draft.experiences.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeExperience = (id: string) => {
    updateField(
      'experiences',
      draft.experiences.filter((item) => item.id !== id)
    );
  };

  const updateBullet = (expId: string, bulletIdx: number, value: string) => {
    updateField(
      'experiences',
      draft.experiences.map((item) => {
        if (item.id !== expId) return item;
        const nextBullets = [...item.bullets];
        nextBullets[bulletIdx] = value;
        return { ...item, bullets: nextBullets };
      })
    );
  };

  const addBullet = (expId: string) => {
    updateField(
      'experiences',
      draft.experiences.map((item) =>
        item.id === expId ? { ...item, bullets: [...item.bullets, ''] } : item
      )
    );
  };

  const removeBullet = (expId: string, bulletIdx: number) => {
    updateField(
      'experiences',
      draft.experiences.map((item) => {
        if (item.id !== expId) return item;
        return { ...item, bullets: item.bullets.filter((_, idx) => idx !== bulletIdx) };
      })
    );
  };

  const upgradeBulletWithXyz = async (expId: string, bulletIdx: number, currentText: string) => {
    if (!currentText.trim()) return;
    const key = `${expId}-${bulletIdx}`;
    setUpgradingKey(key);
    try {
      const res = await fetch('/api/rewrite-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet: currentText,
          targetRole: draft.headline || 'Software Engineer',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const best = data?.options?.[0]?.rewritten;
        if (best) {
          updateBullet(expId, bulletIdx, best);
        }
      }
    } catch {
      // keep existing text on error
    } finally {
      setUpgradingKey(null);
    }
  };

  const addProject = () => {
    updateField('projects', [
      ...draft.projects,
      {
        id: `proj-${Date.now()}`,
        name: 'Featured Project Name',
        techStack: 'Java 17 · SQL · REST API',
        description:
          'Built an end-to-end production system improving reliability and reducing latency by 40%.',
      },
    ]);
  };

  const updateProject = (id: string, patch: Partial<ResumeDraft['projects'][number]>) => {
    updateField(
      'projects',
      draft.projects.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const removeProject = (id: string) => {
    updateField(
      'projects',
      draft.projects.filter((p) => p.id !== id)
    );
  };

  const addEducation = () => {
    updateField('education', [
      ...draft.education,
      {
        id: `edu-${Date.now()}`,
        degree: 'B.S. in Computer Science',
        school: 'University Name',
        period: '2018 – 2022',
        details: 'GPA: 3.8/4.0 · Core Systems & Software Engineering',
      },
    ]);
  };

  const updateEducation = (id: string, patch: Partial<ResumeDraft['education'][number]>) => {
    updateField(
      'education',
      draft.education.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const removeEducation = (id: string) => {
    updateField(
      'education',
      draft.education.filter((e) => e.id !== id)
    );
  };

  const addCertification = () => {
    updateField('certifications', [
      ...(draft.certifications || []),
      {
        id: `cert-${Date.now()}`,
        name: 'New Certification',
        issuer: 'Issuing Organization',
        year: '2025',
      },
    ]);
  };

  const updateCertification = (
    id: string,
    patch: Partial<ResumeDraft['certifications'][number]>
  ) => {
    updateField(
      'certifications',
      (draft.certifications || []).map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const removeCertification = (id: string) => {
    updateField(
      'certifications',
      (draft.certifications || []).filter((c) => c.id !== id)
    );
  };

  const handleDownloadWordDoc = () => {
    const fileSlug = (draft.fullName || 'resume').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const isBio = template === 'biodata' || draft.includeBioData;
    const contactLine = [draft.email, draft.phone, draft.location, draft.linkedin, draft.github]
      .filter(Boolean)
      .join('  •  ');
    const photoRadius =
      draft.photoShape === 'circle' ? '50%' : draft.photoShape === 'rounded' ? '10px' : '2px';

    const photoHtml =
      draft.showPhoto && draft.photoUrl && draft.photoUrl.startsWith('data:image/')
        ? `<img src="${draft.photoUrl}" alt="${draft.fullName}" style="width:92px;height:92px;object-fit:cover;border-radius:${photoRadius};border:2px solid ${theme.primaryHex};" />`
        : '';

    const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${draft.fullName} — ${isBio ? 'Bio-Data & Resume' : 'Resume'}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 34px; line-height: 1.45; font-size: 10.5pt; }
    .header-table { width: 100%; border-collapse: collapse; border-bottom: 2px solid ${theme.primaryHex}; padding-bottom: 10px; margin-bottom: 14px; }
    h1 { margin: 0; font-size: 21pt; color: ${theme.primaryHex}; }
    .headline { font-size: 11pt; font-weight: 600; color: #334155; margin-top: 3px; }
    .contact { font-size: 9.2pt; color: #475569; margin-top: 6px; }
    h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.08em; color: ${theme.primaryHex}; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-top: 15px; margin-bottom: 8px; }
    .item-header { font-weight: 700; color: #0f172a; }
    .item-sub { font-size: 9.3pt; color: #475569; margin-bottom: 4px; }
    ul { margin: 4px 0 10px 18px; padding: 0; }
    li { margin-bottom: 4px; }
    table.bio { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9.8pt; }
    table.bio td, table.bio th { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
    table.bio th { background: #f8fafc; color: #334155; width: 30%; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="vertical-align:top;">
        ${template === 'biodata' ? '<div style="font-size:9pt;font-weight:700;letter-spacing:0.12em;color:#475569;margin-bottom:4px;">CURRICULUM VITAE / BIO-DATA</div>' : ''}
        <h1>${draft.fullName}</h1>
        <div class="headline">${draft.headline}</div>
        <div class="contact">${contactLine}</div>
      </td>
      ${photoHtml ? `<td style="width:105px;text-align:right;vertical-align:top;">${photoHtml}</td>` : ''}
    </tr>
  </table>

  ${draft.summary ? `<h2>${template === 'biodata' ? 'Career Objective' : 'Professional Summary'}</h2><p>${draft.summary}</p>` : ''}

  ${draft.skills.length > 0 ? `<h2>Technical Skills</h2><p>${draft.skills.join(' · ')}</p>` : ''}

  ${
    draft.experiences.length > 0
      ? `<h2>Work Experience</h2>${draft.experiences
          .map(
            (exp) => `
        <div class="item-header">${exp.role} — ${exp.company} (${exp.period})</div>
        <div class="item-sub">${exp.location}</div>
        <ul>${exp.bullets
          .filter(Boolean)
          .map((b) => `<li>${b}</li>`)
          .join('')}</ul>`
          )
          .join('')}`
      : ''
  }

  ${
    draft.projects.length > 0
      ? `<h2>Projects</h2>${draft.projects
          .map(
            (p) => `
        <div class="item-header">${p.name} — ${p.techStack}</div>
        <p style="margin-top:3px;">${p.description}</p>`
          )
          .join('')}`
      : ''
  }

  ${
    draft.education.length > 0
      ? `<h2>Academic Qualifications</h2>
         <table class="bio">
           <tr><th>Degree / Qualification</th><th>Institution</th><th>Period</th><th>Score / Details</th></tr>
           ${draft.education
             .map(
               (ed) =>
                 `<tr><td>${ed.degree}</td><td>${ed.school}</td><td>${ed.period}</td><td>${ed.details}</td></tr>`
             )
             .join('')}
         </table>`
      : ''
  }

  ${
    draft.certifications && draft.certifications.length > 0
      ? `<h2>Certifications</h2><ul>${draft.certifications
          .map((c) => `<li><strong>${c.name}</strong> — ${c.issuer} (${c.year})</li>`)
          .join('')}</ul>`
      : ''
  }

  ${
    draft.languages && draft.languages.length > 0
      ? `<h2>Languages Known</h2><p>${draft.languages.join(' · ')}</p>`
      : ''
  }

  ${
    isBio && draft.bioData
      ? `<h2>Personal Details (Bio-Data)</h2>
         <table class="bio">
           <tr><th>Date of Birth</th><td>${draft.bioData.dateOfBirth}</td></tr>
           <tr><th>Gender / Marital Status</th><td>${draft.bioData.gender} · ${draft.bioData.maritalStatus}</td></tr>
           <tr><th>Nationality</th><td>${draft.bioData.nationality}</td></tr>
           <tr><th>Father's / Guardian's Name</th><td>${draft.bioData.fatherName}</td></tr>
           <tr><th>Permanent Address</th><td>${draft.bioData.permanentAddress}</td></tr>
           <tr><th>Hobbies & Interests</th><td>${draft.bioData.hobbies}</td></tr>
         </table>
         <h2>Declaration</h2>
         <p>${draft.bioData.declaration}</p>
         <p style="margin-top:14px;"><strong>Place:</strong> ${draft.bioData.place} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; <strong>Date:</strong> ${draft.bioData.declarationDate} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; <strong>Signature:</strong> ${draft.fullName}</p>`
      : ''
  }
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileSlug}_${isBio ? 'BioData' : 'ATS_Resume'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    notifyExport(`Downloaded Word-ready ${isBio ? 'Bio-Data' : 'Resume'} (.doc)`);
  };

  const handleDownloadPlainText = () => {
    const fileSlug = (draft.fullName || 'resume').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const txt = serializeDraftToPlainText(draft);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileSlug}_ATS_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notifyExport('Downloaded ATS plain-text resume (.txt)');
  };

  const handleRunAudit = () => {
    const plain = serializeDraftToPlainText(draft);
    onAnalyzeCreatedResume(plain, draft.headline || 'Software Engineer');
  };

  const scoreColor =
    stats.score >= 85
      ? 'text-emerald-400'
      : stats.score >= 70
      ? 'text-cyan-400'
      : 'text-amber-400';

  const photoShapeClass =
    draft.photoShape === 'circle'
      ? 'rounded-full'
      : draft.photoShape === 'rounded'
      ? 'rounded-xl'
      : 'rounded-sm';

  const renderPortrait = (sizeClass = 'w-20 h-20', borderStyle?: string) => {
    if (!draft.showPhoto) return null;
    const hasValidImage = Boolean(draft.photoUrl) && !photoLoadError;
    return (
      <div
        className={`${sizeClass} ${photoShapeClass} overflow-hidden shrink-0 border-2 shadow-sm bg-slate-200 flex items-center justify-center`}
        style={{ borderColor: borderStyle || theme.primaryHex }}
      >
        {hasValidImage ? (
          <img
            src={draft.photoUrl}
            alt={`${draft.fullName || 'Candidate'} profile portrait`}
            referrerPolicy="no-referrer"
            onError={() => setPhotoLoadError(true)}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-bold text-xl tracking-wide"
            style={{ backgroundColor: theme.primaryHex }}
          >
            {getInitials(draft.fullName)}
          </div>
        )}
      </div>
    );
  };

  const showBioDataSection = template === 'biodata' || draft.includeBioData;

  return (
    <div className="space-y-6">
      {/* Top Studio Header & Starter Role / Bio-Data Presets */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 no-print">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-indigo-400 font-semibold">Resume & Bio-Data Studio</span>
            <span aria-hidden="true">·</span>
            <span>4 Templates + Photo Support</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">100% Offline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Your ATS Resume or Formal Bio-Data
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Add your profile photo, switch between Modern CV, Sidebar Pro, Classic ATS, or Formal
            Bio-Data with personal details &amp; declaration, upgrade bullets to Google XYZ, and
            export to PDF, Word, or TXT.
          </p>
        </div>

        {/* Starter Role & Bio-Data Presets */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 mr-1">Starter presets:</span>
          {STARTER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live ATS Readiness Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 no-print">
        <div className="col-span-2 lg:col-span-1 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Live ATS Score</span>
            <span className={`text-2xl font-extrabold font-mono tabular-nums ${scoreColor}`}>
              {stats.score}/100
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Quantified Bullets</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums">
            {stats.quantifiedCount} / {stats.bulletCount}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Strong Action Verbs</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums">
            {stats.strongStartCount} / {stats.bulletCount}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Indexed Skills</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums">
            {stats.skillCount} skills
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Length</span>
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {stats.words} words
            </span>
          </div>
          <button
            type="button"
            onClick={handleRunAudit}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Run full 5-dimension ATS Audit on this resume"
          >
            <ScanSearch className="w-3.5 h-3.5" />
            <span>Audit Now</span>
          </button>
        </div>
      </div>

      {/* Main Split-Screen Workspace: Left Guided Editor | Right Live Paper Resume */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Guided Editor */}
        <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden no-print">
          {/* Editor Section Switcher */}
          <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto">
            {[
              { id: 'profile', label: 'Profile & Photo', icon: User },
              { id: 'experience', label: 'Experience', icon: Briefcase },
              { id: 'skills', label: 'Skills', icon: Code2 },
              { id: 'projects', label: 'Projects & Edu', icon: GraduationCap },
              { id: 'biodata', label: 'Bio-Data & Certs', icon: IdCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = editorSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditorSection(tab.id as typeof editorSection)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 space-y-5 max-h-[820px] overflow-y-auto">
            {/* Section 1: Profile Photo, Contact & Executive Summary */}
            {editorSection === 'profile' && (
              <div className="space-y-4">
                {/* Profile Photo / Person Image Controls */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      Profile Photo / Person Image
                    </span>
                    <button
                      type="button"
                      onClick={() => updateField('showPhoto', !draft.showPhoto)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        draft.showPhoto
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {draft.showPhoto ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Shown on Resume</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hidden (US ATS Mode)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {draft.photoUrl && !photoLoadError ? (
                        <img
                          src={draft.photoUrl}
                          alt="Profile preview"
                          referrerPolicy="no-referrer"
                          onError={() => setPhotoLoadError(true)}
                          className={`w-16 h-16 ${photoShapeClass} object-cover object-top border border-slate-700`}
                        />
                      ) : (
                        <div
                          className={`w-16 h-16 ${photoShapeClass} bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-base`}
                        >
                          {getInitials(draft.fullName)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Your Photo</span>
                        </button>
                        {draft.photoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoLoadError(false);
                              updateField('photoUrl', '');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 cursor-pointer"
                          >
                            Use Initials
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 mr-1">Frame:</span>
                        {(['circle', 'rounded', 'square'] as PhotoShape[]).map((shape) => (
                          <button
                            key={shape}
                            type="button"
                            onClick={() => updateField('photoShape', shape)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize cursor-pointer ${
                              draft.photoShape === shape
                                ? 'bg-slate-800 text-white border border-slate-600'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {shape}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Processed locally in your browser (zero server upload, zero camera access). Tip:
                    Toggle photo off for US/Canada strict text-only ATS, or keep on for Bio-Data &amp;
                    International CVs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={draft.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Target Headline / Role
                    </label>
                    <input
                      type="text"
                      value={draft.headline}
                      onChange={(e) => updateField('headline', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                    <input
                      type="text"
                      value={draft.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={draft.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">LinkedIn</label>
                    <input
                      type="text"
                      value={draft.linkedin}
                      onChange={(e) => updateField('linkedin', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      GitHub / Portfolio
                    </label>
                    <input
                      type="text"
                      value={draft.github}
                      onChange={(e) => updateField('github', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {template === 'biodata'
                      ? 'Career Objective'
                      : 'Professional Summary (2–3 concise sentences with measurable results)'}
                  </label>
                  <textarea
                    rows={4}
                    value={draft.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Section 2: Work Experience & One-Click XYZ Bullet Enhancer */}
            {editorSection === 'experience' && (
              <div className="space-y-5">
                {draft.experiences.map((exp, expIndex) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-400">
                        Role #{expIndex + 1}
                      </span>
                      {draft.experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExperience(exp.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="Job Title"
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Period (e.g. 2022 – Present)"
                        value={exp.period}
                        onChange={(e) => updateExperience(exp.id, { period: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-semibold text-slate-400">
                        Achievement Bullets (click Upgrade to apply Google XYZ metrics)
                      </div>
                      {exp.bullets.map((bullet, bIdx) => {
                        const key = `${exp.id}-${bIdx}`;
                        const isUpgrading = upgradingKey === key;
                        return (
                          <div key={bIdx} className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => updateBullet(exp.id, bIdx, e.target.value)}
                              placeholder="Describe what you built, the measurable impact (%, $, latency), and how..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                            />
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                disabled={isUpgrading || !bullet.trim()}
                                onClick={() => upgradeBulletWithXyz(exp.id, bIdx, bullet)}
                                className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 disabled:text-slate-600 cursor-pointer"
                              >
                                {isUpgrading ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Wand2 className="w-3 h-3" />
                                )}
                                <span>
                                  {isUpgrading ? 'Upgrading...' : 'Suggest Better Bullet (XYZ)'}
                                </span>
                              </button>
                              {exp.bullets.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeBullet(exp.id, bIdx)}
                                  className="text-[11px] text-slate-500 hover:text-rose-400 cursor-pointer"
                                >
                                  Delete bullet
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => addBullet(exp.id)}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Bullet Point</span>
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addExperience}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Experience Role</span>
                </button>
              </div>
            )}

            {/* Section 3: Technical Skills & Languages */}
            {editorSection === 'skills' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-400">Technical & Core Skills</h3>
                  <form onSubmit={addSkill} className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      placeholder="Add skills (comma-separated, e.g. Docker, Kafka, Spring Boot)"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </form>

                  <div className="text-xs text-slate-400">
                    Active Skills ({draft.skills.length}) — click any skill to remove
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-xs text-slate-200 hover:text-rose-200 transition-colors cursor-pointer"
                        title="Click to remove skill"
                      >
                        {skill} ×
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Languages Known</span>
                  </h3>
                  <form onSubmit={addLanguage} className="flex gap-2">
                    <input
                      type="text"
                      value={newLanguageInput}
                      onChange={(e) => setNewLanguageInput(e.target.value)}
                      placeholder="e.g. English (Fluent), Hindi (Native)"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {(draft.languages || []).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => removeLanguage(lang)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 border border-slate-700 text-xs text-slate-200 cursor-pointer"
                      >
                        {lang} ×
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Projects & Education */}
            {editorSection === 'projects' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5" />
                      <span>Featured Projects</span>
                    </h3>
                    <button
                      type="button"
                      onClick={addProject}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Project</span>
                    </button>
                  </div>

                  {draft.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                          placeholder="Project Title"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeProject(proj.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={proj.techStack}
                        onChange={(e) => updateProject(proj.id, { techStack: e.target.value })}
                        placeholder="Tech Stack (e.g. Java 17 · SQL · Docker)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => updateProject(proj.id, { description: e.target.value })}
                        placeholder="Impact & architectural highlights..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Education / Academic Qualifications</span>
                    </h3>
                    <button
                      type="button"
                      onClick={addEducation}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Education</span>
                    </button>
                  </div>

                  {draft.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                          placeholder="Degree"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        {draft.education.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEducation(edu.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                          placeholder="University / Institution"
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={edu.period}
                          onChange={(e) => updateEducation(edu.id, { period: e.target.value })}
                          placeholder="2016 – 2020"
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={edu.details}
                        onChange={(e) => updateEducation(edu.id, { details: e.target.value })}
                        placeholder="GPA, Honors, or Relevant Coursework"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Bio-Data Personal Details, Declaration & Certifications */}
            {editorSection === 'biodata' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        Include Bio-Data Personal Details &amp; Declaration
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Adds standard DOB, Father&apos;s Name, Nationality, Address &amp; signed
                        Declaration (standard for Indian / formal job bio-data).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.includeBioData}
                      onChange={(e) => updateField('includeBioData', e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Date of Birth</label>
                      <input
                        type="text"
                        value={draft.bioData.dateOfBirth}
                        onChange={(e) => updateBioField('dateOfBirth', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Gender</label>
                      <input
                        type="text"
                        value={draft.bioData.gender}
                        onChange={(e) => updateBioField('gender', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Marital Status
                      </label>
                      <input
                        type="text"
                        value={draft.bioData.maritalStatus}
                        onChange={(e) => updateBioField('maritalStatus', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nationality</label>
                      <input
                        type="text"
                        value={draft.bioData.nationality}
                        onChange={(e) => updateBioField('nationality', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Father&apos;s / Guardian&apos;s Name
                      </label>
                      <input
                        type="text"
                        value={draft.bioData.fatherName}
                        onChange={(e) => updateBioField('fatherName', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Permanent Address
                      </label>
                      <input
                        type="text"
                        value={draft.bioData.permanentAddress}
                        onChange={(e) => updateBioField('permanentAddress', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Hobbies &amp; Interests
                      </label>
                      <input
                        type="text"
                        value={draft.bioData.hobbies}
                        onChange={(e) => updateBioField('hobbies', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Formal Declaration Text
                      </label>
                      <textarea
                        rows={2}
                        value={draft.bioData.declaration}
                        onChange={(e) => updateBioField('declaration', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Place</label>
                      <input
                        type="text"
                        value={draft.bioData.place}
                        onChange={(e) => updateBioField('place', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                      <input
                        type="text"
                        value={draft.bioData.declarationDate}
                        onChange={(e) => updateBioField('declarationDate', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Certifications */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Certifications &amp; Licenses</span>
                    </h3>
                    <button
                      type="button"
                      onClick={addCertification}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Certification</span>
                    </button>
                  </div>

                  {(draft.certifications || []).map((cert) => (
                    <div
                      key={cert.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                          placeholder="Certification Name"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeCertification(cert.id)}
                          className="text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                          placeholder="Issuer"
                          className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                        />
                        <input
                          type="text"
                          value={cert.year}
                          onChange={(e) => updateCertification(cert.id, { year: e.target.value })}
                          placeholder="Year"
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Template Controls + Crisp Live Paper Resume / Bio-Data Preview */}
        <div className="xl:col-span-7 space-y-4">
          {/* Style & Export Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 no-print">
            {/* Template Switcher + Accent Swatches */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
                {(
                  [
                    { id: 'executive', label: 'Executive Modern' },
                    { id: 'sidebar', label: 'Sidebar Pro' },
                    { id: 'classic', label: 'Classic ATS' },
                    { id: 'biodata', label: 'Formal Bio-Data' },
                  ] as Array<{ id: BuilderTemplateId; label: string }>
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateSwitch(t.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      template === t.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5" aria-label="Accent color">
                {(Object.keys(ACCENT_THEMES) as BuilderAccentId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAccent(id)}
                    title={ACCENT_THEMES[id].label}
                    className={`w-6 h-6 rounded-full ${ACCENT_THEMES[id].swatch} transition-transform cursor-pointer flex items-center justify-center ${
                      accent === id
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {accent === id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadWordDoc}
                className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPlainText}
                className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>.TXT</span>
              </button>
            </div>
          </div>

          {exportMessage && (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 no-print">
              <Check className="w-4 h-4" />
              <span>{exportMessage}</span>
            </div>
          )}

          {/* LIVE CRISP WHITE PAPER RESUME / BIO-DATA SHEET (Printable Area) */}
          <article
            id="printable-resume-sheet"
            className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {template === 'sidebar' ? (
              /* TEMPLATE 2: SIDEBAR PRO (Modern 2-Column Online CV with Headshot) */
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[820px]">
                <aside
                  className="md:col-span-4 text-white p-7 space-y-6"
                  style={{ backgroundColor: theme.sidebarBgHex }}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    {renderPortrait('w-28 h-28', '#ffffff')}
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-white">
                        {draft.fullName || 'Your Full Name'}
                      </h2>
                      <p className="text-xs font-medium text-white/80 mt-1">
                        {draft.headline || 'Target Role / Title'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-white/15 text-[11.5px] text-white/85">
                    <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                      Contact
                    </h3>
                    {draft.email && <div className="break-all">{draft.email}</div>}
                    {draft.phone && <div>{draft.phone}</div>}
                    {draft.location && <div>{draft.location}</div>}
                    {draft.linkedin && <div className="break-all">{draft.linkedin}</div>}
                    {draft.github && <div className="break-all">{draft.github}</div>}
                  </div>

                  {draft.skills.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-white/15">
                      <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                        Core Skills
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {draft.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded bg-white/12 text-[11px] font-medium text-white"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {draft.languages && draft.languages.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-white/15 text-[11.5px] text-white/85">
                      <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                        Languages
                      </h3>
                      {draft.languages.map((lang) => (
                        <div key={lang}>{lang}</div>
                      ))}
                    </div>
                  )}

                  {showBioDataSection && (
                    <div className="space-y-1.5 pt-3 border-t border-white/15 text-[11px] text-white/80">
                      <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                        Personal Bio-Data
                      </h3>
                      {draft.bioData.dateOfBirth && <div>DOB: {draft.bioData.dateOfBirth}</div>}
                      {draft.bioData.nationality && (
                        <div>Nationality: {draft.bioData.nationality}</div>
                      )}
                      {draft.bioData.maritalStatus && (
                        <div>Status: {draft.bioData.maritalStatus}</div>
                      )}
                      {draft.bioData.hobbies && <div>Interests: {draft.bioData.hobbies}</div>}
                    </div>
                  )}
                </aside>

                <div className="md:col-span-8 p-7 sm:p-8 space-y-5 text-[13px] leading-relaxed text-slate-800">
                  {draft.summary.trim() && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b"
                        style={{ color: theme.primaryHex, borderBottomColor: theme.borderHex }}
                      >
                        Professional Summary
                      </h3>
                      <p className="text-slate-700">{draft.summary}</p>
                    </section>
                  )}

                  {draft.experiences.length > 0 && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-3 border-b"
                        style={{ color: theme.primaryHex, borderBottomColor: theme.borderHex }}
                      >
                        Work Experience
                      </h3>
                      <div className="space-y-4">
                        {draft.experiences.map((exp) => (
                          <div key={exp.id}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h4 className="font-bold text-slate-900">
                                {exp.role}
                                {exp.company ? ` — ${exp.company}` : ''}
                              </h4>
                              <span className="text-[11px] font-mono text-slate-500">
                                {exp.period}
                              </span>
                            </div>
                            {exp.location && (
                              <div className="text-[11.5px] text-slate-500 mb-1">
                                {exp.location}
                              </div>
                            )}
                            <ul className="list-disc pl-4 space-y-1 text-slate-700">
                              {exp.bullets
                                .filter((b) => b.trim().length > 0)
                                .map((b, idx) => (
                                  <li key={idx}>{b}</li>
                                ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {draft.projects.length > 0 && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2.5 border-b"
                        style={{ color: theme.primaryHex, borderBottomColor: theme.borderHex }}
                      >
                        Selected Projects
                      </h3>
                      <div className="space-y-2.5">
                        {draft.projects.map((p) => (
                          <div key={p.id}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h4 className="font-bold text-slate-900">{p.name}</h4>
                              <span className="text-[11px] font-mono text-slate-500">
                                {p.techStack}
                              </span>
                            </div>
                            <p className="text-slate-700 mt-0.5">{p.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {draft.education.length > 0 && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b"
                        style={{ color: theme.primaryHex, borderBottomColor: theme.borderHex }}
                      >
                        Education
                      </h3>
                      <div className="space-y-2">
                        {draft.education.map((edu) => (
                          <div key={edu.id}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h4 className="font-bold text-slate-900">
                                {edu.degree} — {edu.school}
                              </h4>
                              <span className="text-[11px] font-mono text-slate-500">
                                {edu.period}
                              </span>
                            </div>
                            {edu.details && (
                              <p className="text-xs text-slate-600 mt-0.5">{edu.details}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {draft.certifications && draft.certifications.length > 0 && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b"
                        style={{ color: theme.primaryHex, borderBottomColor: theme.borderHex }}
                      >
                        Certifications
                      </h3>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {draft.certifications.map((c) => (
                          <li key={c.id}>
                            <strong className="text-slate-900">{c.name}</strong> — {c.issuer} (
                            {c.year})
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {showBioDataSection && draft.bioData.declaration && (
                    <section className="pt-2 border-t border-slate-200 text-xs text-slate-700">
                      <p className="italic">{draft.bioData.declaration}</p>
                      <div className="flex justify-between mt-3 font-semibold text-slate-900">
                        <span>
                          {draft.bioData.place} · {draft.bioData.declarationDate}
                        </span>
                        <span>{draft.fullName}</span>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            ) : (
              /* TEMPLATES 1, 3, 4: EXECUTIVE MODERN, CLASSIC ATS, & FORMAL BIO-DATA */
              <>
                <header
                  className={`px-8 sm:px-10 pt-8 pb-6 ${
                    template === 'executive'
                      ? 'border-b-4'
                      : template === 'biodata'
                      ? 'border-b-2'
                      : 'text-center border-b-2 border-slate-900'
                  }`}
                  style={{
                    borderBottomColor:
                      template === 'executive' || template === 'biodata'
                        ? theme.primaryHex
                        : undefined,
                    backgroundColor: template === 'executive' ? theme.softBgHex : '#ffffff',
                  }}
                >
                  {template === 'biodata' && (
                    <div
                      className="text-[11px] font-extrabold uppercase tracking-[0.18em] mb-2"
                      style={{ color: theme.primaryHex }}
                    >
                      Curriculum Vitae / Formal Bio-Data
                    </div>
                  )}

                  <div
                    className={`flex gap-5 items-center ${
                      template === 'classic'
                        ? 'flex-col justify-center'
                        : template === 'biodata'
                        ? 'flex-row justify-between'
                        : 'flex-row justify-between'
                    }`}
                  >
                    {template === 'executive' && renderPortrait('w-20 h-20')}

                    <div className="flex-1 min-w-0">
                      <h2
                        className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                        style={{ color: template === 'classic' ? '#0f172a' : theme.primaryHex }}
                      >
                        {draft.fullName || 'Your Full Name'}
                      </h2>
                      <p className="text-sm sm:text-base font-semibold text-slate-700 mt-1">
                        {draft.headline || 'Target Role / Title'}
                      </p>
                      <div
                        className={`flex flex-wrap gap-x-2.5 gap-y-1 text-xs text-slate-600 mt-2.5 ${
                          template === 'classic' ? 'justify-center' : 'justify-start'
                        }`}
                      >
                        {[draft.email, draft.phone, draft.location, draft.linkedin, draft.github]
                          .filter(Boolean)
                          .map((item, idx, arr) => (
                            <React.Fragment key={idx}>
                              <span>{item}</span>
                              {idx < arr.length - 1 && (
                                <span className="text-slate-400" aria-hidden="true">
                                  ·
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                      </div>
                    </div>

                    {template === 'biodata' && renderPortrait('w-24 h-28')}
                    {template === 'classic' && draft.showPhoto && renderPortrait('w-16 h-16')}
                  </div>
                </header>

                <div className="px-8 sm:px-10 py-7 space-y-6 text-[13px] leading-relaxed text-slate-800">
                  {/* Summary / Career Objective */}
                  {draft.summary.trim() && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1.5 mb-2.5 border-b"
                        style={{
                          color: template === 'classic' ? '#0f172a' : theme.primaryHex,
                          borderBottomColor: template === 'classic' ? '#cbd5e1' : theme.borderHex,
                        }}
                      >
                        {template === 'biodata' ? 'Career Objective' : 'Professional Summary'}
                      </h3>
                      <p className="text-slate-700">{draft.summary}</p>
                    </section>
                  )}

                  {/* Skills */}
                  {draft.skills.length > 0 && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1.5 mb-2.5 border-b"
                        style={{
                          color: template === 'classic' ? '#0f172a' : theme.primaryHex,
                          borderBottomColor: template === 'classic' ? '#cbd5e1' : theme.borderHex,
                        }}
                      >
                        Technical Skills
                      </h3>
                      <p className="text-slate-800 font-medium">{draft.skills.join('  ·  ')}</p>
                    </section>
                  )}

                  {/* Work Experience */}
                  {draft.experiences.length > 0 && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1.5 mb-3 border-b"
                        style={{
                          color: template === 'classic' ? '#0f172a' : theme.primaryHex,
                          borderBottomColor: template === 'classic' ? '#cbd5e1' : theme.borderHex,
                        }}
                      >
                        Work Experience
                      </h3>
                      <div className="space-y-4">
                        {draft.experiences.map((exp) => (
                          <div key={exp.id}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h4 className="font-bold text-slate-900">
                                {exp.role}
                                {exp.company ? ` — ${exp.company}` : ''}
                              </h4>
                              <span className="text-xs font-mono text-slate-500">{exp.period}</span>
                            </div>
                            {exp.location && (
                              <div className="text-xs text-slate-500 mb-1.5">{exp.location}</div>
                            )}
                            <ul className="list-disc pl-5 space-y-1 text-slate-700">
                              {exp.bullets
                                .filter((b) => b.trim().length > 0)
                                .map((b, idx) => (
                                  <li key={idx}>{b}</li>
                                ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Projects */}
                  {draft.projects.length > 0 && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1.5 mb-2.5 border-b"
                        style={{
                          color: template === 'classic' ? '#0f172a' : theme.primaryHex,
                          borderBottomColor: template === 'classic' ? '#cbd5e1' : theme.borderHex,
                        }}
                      >
                        Selected Projects
                      </h3>
                      <div className="space-y-2.5">
                        {draft.projects.map((p) => (
                          <div key={p.id}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h4 className="font-bold text-slate-900">{p.name}</h4>
                              <span className="text-xs font-mono text-slate-500">
                                {p.techStack}
                              </span>
                            </div>
                            <p className="text-slate-700 mt-0.5">{p.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Education — Tabular for Formal Bio-Data, clean list for Resume */}
                  {draft.education.length > 0 && (
                    <section>
                      <h3
                        className="text-xs font-extrabold uppercase tracking-wider pb-1.5 mb-2.5 border-b"
                        style={{
                          color: template === 'classic' ? '#0f172a' : theme.primaryHex,
                          borderBottomColor: template === 'classic' ? '#cbd5e1' : theme.borderHex,
                        }}
                      >
                        {template === 'biodata' ? 'Academic Qualifications' : 'Education'}
                      </h3>
                      {template === 'biodata' ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border border-slate-300">
                            <thead>
                              <tr style={{ backgroundColor: theme.softBgHex }}>
                                <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-800">
                                  Qualification / Degree
                                </th>
                                <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-800">
                                  Institution / Board
                                </th>
                                <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-800">
                                  Year
                                </th>
                                <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-800">
                                  Score / Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {draft.education.map((edu) => (
                                <tr key={edu.id}>
                                  <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">
                                    {edu.degree}
                                  </td>
                                  <td className="border border-slate-300 px-3 py-2 text-slate-700">
                                    {edu.school}
                                  </td>
                                  <td className="border border-slate-300 px-3 py-2 font-mono text-slate-600 whitespace-nowrap">
                                    {edu.period}
                                  </td>
                                  <td className="border border-slate-300 px-3 py-2 text-slate-700">
                                    {edu.details}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {draft.education.map((edu) => (
                            <div key={edu.id}>
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h4 className="font-bold text-slate-900">
                                  {edu.degree} — {edu.school}
                                </h4>
                                <span className="text-xs font-mono text-slate-500">
                                  {edu.period}
                                </span>
                              </div>
                              {edu.details && (
                                <p className="text-xs text-slate-600 mt-0.5">{edu.details}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {/* Certifications & Languages */}
                  {((draft.certifications && draft.certifications.length > 0) ||
                    (draft.languages && draft.languages.length > 0)) && (
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {draft.certifications && draft.certifications.length > 0 && (
                        <div>
                          <h3
                            className="text-xs font-extrabold uppercase tracking-wider pb-1.5 mb-2 border-b"
                            style={{
                              color: template === 'classic' ? '#0f172a' : theme.primaryHex,
                              borderBottomColor:
                                template === 'classic' ? '#cbd5e1' : theme.borderHex,
                            }}
                          >
                            Certifications
                          </h3>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {draft.certifications.map((c) => (
                              <li key={c.id}>
                                <strong className="text-slate-900">{c.name}</strong> — {c.issuer} (
                                {c.year})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {draft.languages && draft.languages.length > 0 && (
                        <div>
                          <h3
                            className="text-xs font-extrabold uppercase tracking-wider pb-1.5 mb-2 border-b"
                            style={{
                              color: template === 'classic' ? '#0f172a' : theme.primaryHex,
                              borderBottomColor:
                                template === 'classic' ? '#cbd5e1' : theme.borderHex,
                            }}
                          >
                            Languages Known
                          </h3>
                          <p className="text-xs text-slate-700 font-medium">
                            {draft.languages.join('  ·  ')}
                          </p>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Formal Bio-Data Personal Details Table & Declaration */}
                  {showBioDataSection && (
                    <>
                      <section>
                        <h3
                          className="text-xs font-extrabold uppercase tracking-wider pb-1.5 mb-2.5 border-b"
                          style={{
                            color: template === 'classic' ? '#0f172a' : theme.primaryHex,
                            borderBottomColor: template === 'classic' ? '#cbd5e1' : theme.borderHex,
                          }}
                        >
                          Personal Details (Bio-Data)
                        </h3>
                        <table className="w-full text-xs border-collapse border border-slate-300">
                          <tbody>
                            <tr>
                              <th className="border border-slate-300 bg-slate-50 px-3 py-1.5 text-left font-semibold text-slate-700 w-1/3">
                                Date of Birth
                              </th>
                              <td className="border border-slate-300 px-3 py-1.5 text-slate-800">
                                {draft.bioData.dateOfBirth}
                              </td>
                            </tr>
                            <tr>
                              <th className="border border-slate-300 bg-slate-50 px-3 py-1.5 text-left font-semibold text-slate-700">
                                Gender / Marital Status
                              </th>
                              <td className="border border-slate-300 px-3 py-1.5 text-slate-800">
                                {draft.bioData.gender} · {draft.bioData.maritalStatus}
                              </td>
                            </tr>
                            <tr>
                              <th className="border border-slate-300 bg-slate-50 px-3 py-1.5 text-left font-semibold text-slate-700">
                                Nationality
                              </th>
                              <td className="border border-slate-300 px-3 py-1.5 text-slate-800">
                                {draft.bioData.nationality}
                              </td>
                            </tr>
                            <tr>
                              <th className="border border-slate-300 bg-slate-50 px-3 py-1.5 text-left font-semibold text-slate-700">
                                Father&apos;s / Guardian&apos;s Name
                              </th>
                              <td className="border border-slate-300 px-3 py-1.5 text-slate-800">
                                {draft.bioData.fatherName}
                              </td>
                            </tr>
                            <tr>
                              <th className="border border-slate-300 bg-slate-50 px-3 py-1.5 text-left font-semibold text-slate-700">
                                Permanent Address
                              </th>
                              <td className="border border-slate-300 px-3 py-1.5 text-slate-800">
                                {draft.bioData.permanentAddress}
                              </td>
                            </tr>
                            <tr>
                              <th className="border border-slate-300 bg-slate-50 px-3 py-1.5 text-left font-semibold text-slate-700">
                                Hobbies &amp; Interests
                              </th>
                              <td className="border border-slate-300 px-3 py-1.5 text-slate-800">
                                {draft.bioData.hobbies}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </section>

                      <section className="pt-2">
                        <h3
                          className="text-xs font-extrabold uppercase tracking-wider pb-1.5 mb-2 border-b"
                          style={{
                            color: template === 'classic' ? '#0f172a' : theme.primaryHex,
                            borderBottomColor: template === 'classic' ? '#cbd5e1' : theme.borderHex,
                          }}
                        >
                          Declaration
                        </h3>
                        <p className="text-xs text-slate-700 italic">{draft.bioData.declaration}</p>
                        <div className="flex flex-wrap items-end justify-between gap-4 mt-5 text-xs text-slate-800">
                          <div>
                            <div>
                              <strong>Place:</strong> {draft.bioData.place}
                            </div>
                            <div>
                              <strong>Date:</strong> {draft.bioData.declarationDate}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="border-t border-slate-400 pt-1 px-6 font-bold text-slate-900">
                              {draft.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">Signature</div>
                          </div>
                        </div>
                      </section>
                    </>
                  )}
                </div>
              </>
            )}
          </article>
        </div>
      </div>
    </div>
  );
};
