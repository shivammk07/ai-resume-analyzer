import React, { useEffect, useState } from 'react';
import { Play, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { BenchmarkSummary } from '../server/benchmarkSuite';

export const ValidationLabView: React.FC = () => {
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<'All' | 'Strong' | 'Competitive' | 'Developing' | 'Weak'>('All');

  const fetchLatest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/benchmarks/history');
      if (!res.ok) throw new Error('Failed to fetch benchmark validation results.');
      const data = await res.json();
      setSummary(data.latest || null);
    } catch (err: any) {
      setError(err.message || 'Unable to load benchmark validation suite.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSuite = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/benchmarks/run', { method: 'POST' });
      if (!res.ok) throw new Error('Benchmark execution failed.');
      const data: BenchmarkSummary = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Unable to execute benchmark suite.');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  const visibleRows = (summary?.results || []).filter(
    (r) => tierFilter === 'All' || r.tier === tierFilter
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Independently Annotated Corpus (12 Resumes)</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic Core Engine</span>
            <span aria-hidden="true">·</span>
            <span>Reproducible Metrics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            ATS Scoring Validation &amp; Benchmark Lab
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Measures deterministic scoring accuracy, rank ordering, and execution latency across four human-labeled resume tiers with zero external API dependencies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunSuite}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{running ? 'Running 12-Resume Suite...' : 'Run Validation Suite'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Explicit Scope Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Methodological Scope Disclaimer:</strong>{' '}
          {summary?.disclaimer ||
            'Validation evaluates deterministic rubric consistency against 12 independently annotated resumes across 4 quality tiers. Scores measure ATS heuristic alignment and should not be treated as verified recruitment or hiring outcomes.'}
        </p>
      </div>

      {/* KPI Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Mean Absolute Error (MAE)</div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                {summary.meanAbsoluteError.toFixed(2)} pts
              </div>
              <div className="text-xs text-emerald-400 mt-1">Target &le; 10.0 pts</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Tolerance Band Accuracy</div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                {summary.bandAccuracyPct.toFixed(1)}%
              </div>
              <div className="text-xs text-emerald-400 mt-1">
                {summary.results.filter((r) => r.withinBand).length} / {summary.datasetSize} within band
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Spearman Rank Correlation (&rho;)</div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                {summary.spearmanRho.toFixed(3)}
              </div>
              <div className="text-xs text-emerald-400 mt-1">Monotonic tier ordering</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Local Runtime Latency (p50 / p95)</div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                {summary.p50LatencyMs} / {summary.p95LatencyMs} ms
              </div>
              <div className="text-xs text-slate-400 font-mono tabular-nums mt-1">
                Last run {new Date(summary.runTimestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Tier Filter Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold text-white">
              Per-Resume Ground Truth Comparison ({visibleRows.length} Shown)
            </h2>
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
              {(['All', 'Strong', 'Competitive', 'Developing', 'Weak'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    tierFilter === tier
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* High-Density Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/60">
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Benchmark Profile &amp; Rationale</th>
                    <th className="py-3 px-4 font-semibold">Tier</th>
                    <th className="py-3 px-4 font-semibold text-right">Human Band</th>
                    <th className="py-3 px-4 font-semibold text-right">Predicted</th>
                    <th className="py-3 px-4 font-semibold text-right">Error</th>
                    <th className="py-3 px-4 font-semibold text-right">Latency</th>
                    <th className="py-3 px-4 font-semibold">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {visibleRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-400 whitespace-nowrap">
                        {row.id}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-medium text-white">{row.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5 leading-snug">{row.rubricRationale}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">{row.tier}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-300 whitespace-nowrap">
                        {row.minBand}–{row.maxBand} ({row.expectedScore})
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-white whitespace-nowrap">
                        {row.predictedScore}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-300 whitespace-nowrap">
                        &plusmn;{row.absoluteError}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-400 whitespace-nowrap">
                        {row.latencyMs} ms
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.withinBand ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pass</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Outside Band</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
