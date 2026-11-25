import React, { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, RefreshCw, EyeOff, Database, Code2, Server, FileDown } from 'lucide-react';

interface AuditAccessLog {
  id: string;
  action: string;
  resourceId: string;
  details: string;
  createdAt: string;
}

interface PrivacyGovernanceViewProps {
  sessionToken: string;
}

const SAMPLE_PII_TEXT = `Jane Doe
Email: jane.doe@example.org | Phone: (415) 555-0199
Address: 742 Evergreen Terrace Street | SSN: 123-45-6789 | DOB: 04/12/1996

EXPERIENCE
Senior Java Developer | FinCore Systems | 2021 - Present
- Architected JDBC DAO services on MySQL serving 42,000 requests/sec with 99.98% uptime.`;

export const PrivacyGovernanceView: React.FC<PrivacyGovernanceViewProps> = ({ sessionToken }) => {
  const [sampleInput, setSampleInput] = useState(SAMPLE_PII_TEXT);
  const [redactedOutput, setRedactedOutput] = useState('');
  const [maskedSummary, setMaskedSummary] = useState<{ total: number; counts: Record<string, number> } | null>(null);
  const [logs, setLogs] = useState<AuditAccessLog[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const runRedactionTest = async (textToMask: string) => {
    try {
      const res = await fetch('/api/privacy/test-redaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToMask }),
      });
      if (res.ok) {
        const data = await res.json();
        setRedactedOutput(data.redactedText || '');
        setMaskedSummary({ total: data.totalMaskedCount || 0, counts: data.categoryCounts || {} });
      }
    } catch {
      // ignore transient error
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/privacy/audit-logs', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    runRedactionTest(sampleInput);
    fetchLogs();
  }, [sessionToken]);

  const handleCleanupExpired = async () => {
    const res = await fetch('/api/privacy/cleanup-expired', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setStatusMessage(`Expired TTL cleanup completed. Removed ${data.expiredRemoved ?? 0} expired records.`);
      fetchLogs();
    }
  };

  const handlePurgeAll = async () => {
    const res = await fetch('/api/privacy/purge-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setStatusMessage(`Permanent purge completed. Deleted ${data.purgedCount ?? 0} stored resume records.`);
      fetchLogs();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Data Protection &amp; Retention Governance</span>
            <span aria-hidden="true">·</span>
            <span>Core Java 17 / JDBC / Jakarta EE 10 Reference</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Privacy Safeguards &amp; Java Architecture
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Inspect live PII redaction, manage retention TTL cleanup, audit session access logs, and download the updated 13-slide presentation deck in PDF format.
          </p>
        </div>

        <a
          href="/api/download-presentation-pdf"
          download="CareerPulse_Java_Enterprise_Presentation.pdf"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <FileDown className="w-4 h-4" />
          <span>Download 13-Slide Presentation (.pdf)</span>
        </a>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs text-emerald-200 flex items-center justify-between gap-4">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive PII Redaction Tester */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-indigo-400" />
              <span>Interactive PII Redaction Pipeline Verification</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal identifiers (SSN, email, phone, street address, DOB) are automatically masked before database persistence or optional AI enrichment while preserving technical metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => runRedactionTest(sampleInput)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Run Redaction Check
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Raw Resume Input (Contains PII)
            </label>
            <textarea
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              rows={7}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-400">Redacted Output Sent to Storage / Engine</span>
              {maskedSummary && (
                <span className="font-mono tabular-nums text-emerald-400">
                  {maskedSummary.total} PII items masked
                </span>
              )}
            </div>
            <pre className="w-full h-[158px] overflow-auto bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300 whitespace-pre-wrap">
              {redactedOutput}
            </pre>
          </div>
        </div>
      </section>

      {/* Java / JDBC / Jakarta EE Architecture Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Core Java 17 OOP Engine</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Implements <code className="text-slate-200">Analyzable</code> and <code className="text-slate-200">ScoringCriterion</code> interfaces, abstract inheritance (<code className="text-slate-200">AbstractDocument</code> &rarr; <code className="text-slate-200">ResumeDocument</code> / <code className="text-slate-200">JobDescriptionDocument</code>), 5 polymorphic scorers, <code className="text-slate-200">PriorityQueue</code> fix ranking, and custom checked/unchecked exceptions.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>JDBC DAO &amp; Relational SQL</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Normalized 5-table schema (<code className="text-slate-200">users</code>, <code className="text-slate-200">resumes</code>, <code className="text-slate-200">analysis_reports</code>, <code className="text-slate-200">benchmark_runs</code>, <code className="text-slate-200">audit_access_logs</code>) with <code className="text-slate-200">GenericDao&lt;T, ID&gt;</code>, parameterized <code className="text-slate-200">PreparedStatement</code>, atomic JDBC transactions, MySQL 8 primary + H2 fallback.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Jakarta EE 10 Servlets &amp; JSP</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Full Maven WAR packaging for Apache Tomcat 10+ featuring 5 MVC Servlets (<code className="text-slate-200">/analyze</code>, <code className="text-slate-200">/history</code>, <code className="text-slate-200">/benchmark</code>, <code className="text-slate-200">/privacy</code>, <code className="text-slate-200">/auth</code>), CSRF/TTL <code className="text-slate-200">@WebFilter</code>, JSTL-escaped JSP views, and JUnit 5 + Mockito tests.
          </p>
        </div>
      </section>

      {/* Retention Governance Controls & Access Audit Log */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Retention Cleanup &amp; Session Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every analysis, report inspection, TTL sweep, and permanent deletion is logged under your isolated session owner token.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCleanupExpired}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sweep Expired TTL</span>
            </button>
            <button
              type="button"
              onClick={handlePurgeAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All My Data</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Action</th>
                <th className="py-2.5 px-3 font-semibold">Resource</th>
                <th className="py-2.5 px-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loadingLogs ? (
                <tr>
                  <td colSpan={4} className="py-6 px-3 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 px-3 text-center text-slate-500">
                    No privacy events logged in this session yet. Analyze a resume or run a TTL sweep to populate the audit trail.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-indigo-300 whitespace-nowrap">{entry.action}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">{entry.resourceId}</td>
                    <td className="py-2.5 px-3 text-slate-300">{entry.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
