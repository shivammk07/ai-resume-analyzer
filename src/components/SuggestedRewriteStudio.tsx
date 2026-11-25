import React, { useMemo, useState } from 'react';
import { ResumeAnalysis } from '../types/resume';
import {
  ArrowRight,
  Check,
  Copy,
  FilePlus2,
  Sparkles,
  TrendingUp,
  CheckSquare,
  Square,
  KeyRound,
  AlignLeft,
} from 'lucide-react';

interface SuggestedRewriteStudioProps {
  analysis: ResumeAnalysis;
  onOpenInBuilder: (options: {
    applySummary: boolean;
    acceptedBullets: string[];
    acceptedKeywordLines: string[];
  }) => void;
}

export const SuggestedRewriteStudio: React.FC<SuggestedRewriteStudioProps> = ({
  analysis,
  onOpenInBuilder,
}) => {
  const bullets = analysis.bulletEnhancements || [];
  const keywordTemplates = analysis.keywordInsertionTemplates || [];

  const [applySummary, setApplySummary] = useState(true);
  const [selectedBullets, setSelectedBullets] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    bullets.forEach((_, idx) => {
      initial[idx] = true;
    });
    return initial;
  });
  const [selectedKeywords, setSelectedKeywords] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    keywordTemplates.slice(0, 3).forEach((_, idx) => {
      initial[idx] = true;
    });
    return initial;
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const projectedBoost = useMemo(() => {
    let gain = 0;
    if (applySummary && analysis.suggestedSummary) gain += 5;
    const bulletCount = Object.values(selectedBullets).filter(Boolean).length;
    const kwCount = Object.values(selectedKeywords).filter(Boolean).length;
    gain += Math.min(18, bulletCount * 5);
    gain += Math.min(12, kwCount * 3);
    const projected = Math.min(98, analysis.overallScore + gain);
    return {
      gain: Math.max(0, projected - analysis.overallScore),
      projected,
    };
  }, [applySummary, selectedBullets, selectedKeywords, analysis.overallScore, analysis.suggestedSummary]);

  const handleLaunchBuilder = () => {
    const acceptedBullets = bullets
      .filter((_, idx) => selectedBullets[idx])
      .map((b) => b.improved);
    const acceptedKeywordLines = keywordTemplates
      .filter((_, idx) => selectedKeywords[idx])
      .map((k) => k.suggestedLine);

    onOpenInBuilder({
      applySummary,
      acceptedBullets,
      acceptedKeywordLines,
    });
  };

  const totalSelectedCount =
    (applySummary && analysis.suggestedSummary ? 1 : 0) +
    Object.values(selectedBullets).filter(Boolean).length +
    Object.values(selectedKeywords).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Action Header: Projected Score Lift + One-Click Transfer to Resume Builder */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span>Personalized "Write This Instead" Upgrade Plan</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-300">
              {totalSelectedCount} upgrades selected
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Apply these exact rewrites to lift your ATS score from{' '}
            <span className="font-mono tabular-nums text-slate-300">{analysis.overallScore}</span>{' '}
            to{' '}
            <span className="font-mono tabular-nums text-emerald-400">
              {projectedBoost.projected}/100
            </span>
            {projectedBoost.gain > 0 && (
              <span className="text-sm font-mono tabular-nums text-emerald-400 ml-2">
                (+{projectedBoost.gain} pts)
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Review each recommended rewrite below, copy individual lines directly, or send all selected improvements straight into the CareerPulse Resume Builder to generate a polished, recruiter-ready resume.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLaunchBuilder}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Build Upgraded Resume</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Suggested Executive Summary */}
      {analysis.suggestedSummary && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <AlignLeft className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  01. Write This Professional Summary Instead
                </h3>
                <p className="text-xs text-slate-400">
                  Tailored to {analysis.detectedRole || 'your target role'} with high-signal domain skills and recruiter hook.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setApplySummary((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  applySummary
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {applySummary ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>{applySummary ? 'Included in Builder' : 'Include in Builder'}</span>
              </button>

              <button
                type="button"
                onClick={() => copyText('summary', analysis.suggestedSummary || '')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedId === 'summary' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-sm text-slate-100 leading-relaxed">
            "{analysis.suggestedSummary}"
          </div>
        </section>
      )}

      {/* 2. Before -> After Bullet Upgrades ("Instead of Writing -> Write This") */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                02. Replace Weak Bullets — Write These High-Impact Lines Instead
              </h3>
              <p className="text-xs text-slate-400">
                Upgraded with Google XYZ structure (Accomplished X, measured by Y, by doing Z).
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {bullets.length} ready-to-use rewrites
          </span>
        </div>

        <div className="space-y-4">
          {bullets.map((item, idx) => {
            const checked = !!selectedBullets[idx];
            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 sm:p-5 transition-colors ${
                  checked
                    ? 'bg-slate-950 border-slate-700'
                    : 'bg-slate-950/50 border-slate-800/70 opacity-80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="text-xs text-indigo-400 font-semibold">
                    {item.impactCategory || 'Impact Upgrade'} · Suggestion #{idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBullets((prev) => ({ ...prev, [idx]: !prev[idx] }))
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        checked
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      <span>{checked ? 'Selected' : 'Select'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyText(`bullet-${idx}`, item.improved)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedId === `bullet-${idx}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-lg bg-slate-900/80 border border-rose-500/20">
                    <div className="text-xs font-semibold text-rose-400 mb-1">
                      Instead of writing
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 font-mono leading-relaxed">
                      "{item.original}"
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-500/35">
                    <div className="text-xs font-semibold text-emerald-400 mb-1">
                      Write this instead
                    </div>
                    <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                      "{item.improved}"
                    </p>
                  </div>
                </div>

                {item.explanation && (
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    <span className="text-slate-300 font-semibold">Why recruiters respond:</span>{' '}
                    {item.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Missing Keywords — Exact Ready-to-Add Resume Lines */}
      {keywordTemplates.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  03. Missing ATS Keywords — Exact Bullets You Can Add Today
                </h3>
                <p className="text-xs text-slate-400">
                  Only include keywords that reflect your genuine hands-on project or work experience.
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {keywordTemplates.length} keyword templates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {keywordTemplates.map((tpl, idx) => {
              const checked = !!selectedKeywords[idx];
              return (
                <div
                  key={tpl.keyword}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                    checked
                      ? 'bg-slate-950 border-amber-500/35'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs mb-2">
                      <span className="font-bold text-amber-300 font-mono">
                        + {tpl.keyword}
                      </span>
                      <span className="text-slate-500">{tpl.targetSection}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      "{tpl.suggestedLine}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedKeywords((prev) => ({ ...prev, [idx]: !prev[idx] }))
                      }
                      className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                        checked ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      <span>{checked ? 'Add to Builder' : 'Include'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyText(`kw-${idx}`, tpl.suggestedLine)}
                      className="flex items-center gap-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                    >
                      {copiedId === `kw-${idx}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Line</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
