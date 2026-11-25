import React, { useEffect, useState } from 'react';
import { Trash2, Eye, Search, ShieldAlert, FileText, RefreshCw } from 'lucide-react';
import { ResumeAnalysis } from '../types/resume';

export interface StoredAuditSummary {
  id: string;
  fileName: string;
  detectedFormat: string;
  targetRole: string;
  engineMode: 'deterministic' | 'ai';
  overallScore: number;
  scoreLabel: string;
  piiItemsMasked: number;
  retentionPolicy: 'EPHEMERAL' | 'HOURS_24' | 'DAYS_7';
  expiresAt: string;
  createdAt: string;
  analysisTimeMs: number;
}

interface AuditHistoryViewProps {
  sessionToken: string;
  onOpenReport: (report: ResumeAnalysis, targetRole: string) => void;
  onStartNewScan: () => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({
  sessionToken,
  onOpenReport,
  onStartNewScan,
}) => {
  const [audits, setAudits] = useState<StoredAuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [engineFilter, setEngineFilter] = useState<'all' | 'deterministic' | 'ai'>('all');
  const [confirmPurgeAll, setConfirmPurgeAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAudits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/audits', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        throw new Error('Unable to load persisted audit history.');
      }
      const data = await res.json();
      setAudits(data.audits || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, [sessionToken]);

  const handleView = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/audits/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        throw new Error('Record not found or expired.');
      }
      const data = await res.json();
      if (data.report) {
        onOpenReport(data.report, data.targetRole);
      }
    } catch (err: any) {
      setError(err.message || 'Could not open report.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/audits/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        throw new Error('Unable to delete record.');
      }
      setAudits((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message || 'Deletion failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePurgeAll = async () => {
    setBusyId('all');
    setError(null);
    try {
      const res = await fetch('/api/privacy/purge-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        throw new Error('Purge request failed.');
      }
      setAudits([]);
      setConfirmPurgeAll(false);
    } catch (err: any) {
      setError(err.message || 'Failed to purge data.');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = audits.filter((a) => {
    const matchesEngine = engineFilter === 'all' || a.engineMode === engineFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      a.fileName.toLowerCase().includes(q) ||
      a.targetRole.toLowerCase().includes(q) ||
      a.scoreLabel.toLowerCase().includes(q);
    return matchesEngine && matchesQuery;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Owner-Scoped Persistence</span>
            <span aria-hidden="true">·</span>
            <span>Automated TTL Expiry</span>
            <span aria-hidden="true">·</span>
            <span>Redacted Storage Only</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Persisted Audit History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review previously analyzed resumes stored under your current session token, or permanently delete individual or all records.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadAudits}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {audits.length > 0 && !confirmPurgeAll && (
            <button
              type="button"
              onClick={() => setConfirmPurgeAll(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All Data</span>
            </button>
          )}
        </div>
      </div>

      {confirmPurgeAll && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Permanently delete all {audits.length} stored resume audit records for this session? This cannot be undone.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePurgeAll}
              disabled={busyId === 'all'}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
            >
              {busyId === 'all' ? 'Purging...' : 'Confirm Permanent Purge'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmPurgeAll(false)}
              className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Search & Segmented Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by role, filename, or verdict..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start">
          {(['all', 'deterministic', 'ai'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setEngineFilter(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                engineFilter === mode
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'all' ? 'All Modes' : mode === 'deterministic' ? 'Deterministic Local' : 'AI-Assisted'}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Empty / Loading States */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-10 bg-slate-800/60 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white">
              {audits.length === 0 ? 'No Stored Resume Audits Yet' : 'No Matching Records'}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {audits.length === 0
                ? 'Run an analysis with 24-Hour or 7-Day retention selected to store PII-redacted reports here. Ephemeral scans are never written to storage.'
                : 'Try adjusting your search query or engine mode filter.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onStartNewScan}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
              >
                Analyze a Resume
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/60">
                  <th className="py-3 px-4 font-semibold">Document</th>
                  <th className="py-3 px-4 font-semibold">Target Role</th>
                  <th className="py-3 px-4 font-semibold">Engine</th>
                  <th className="py-3 px-4 font-semibold text-right">ATS Score</th>
                  <th className="py-3 px-4 font-semibold text-right">PII Masked</th>
                  <th className="py-3 px-4 font-semibold">Retention / Expiry</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white truncate max-w-[200px]">{item.fileName}</div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[200px]">{item.targetRole}</td>
                    <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">
                      {item.engineMode === 'deterministic' ? 'Deterministic Local' : 'AI-Assisted'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          item.overallScore >= 80
                            ? 'text-emerald-400'
                            : item.overallScore >= 60
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.overallScore}/100
                      </span>
                      <span className="block text-[11px] text-slate-500 font-sans">{item.scoreLabel}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                      {item.piiItemsMasked}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      <div>{item.retentionPolicy === 'DAYS_7' ? '7-Day TTL' : '24-Hour TTL'}</div>
                      <div className="font-mono tabular-nums text-[11px] text-slate-500">
                        Exp {new Date(item.expiresAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleView(item.id)}
                          disabled={busyId === item.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={busyId === item.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-md transition-colors cursor-pointer"
                          title="Permanently delete this stored audit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
