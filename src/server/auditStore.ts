import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ResumeAnalysis } from '../types/resume';
import { BenchmarkSummary } from './benchmarkSuite';

export type RetentionPolicyType = 'EPHEMERAL' | 'HOURS_24' | 'DAYS_7';

export interface StoredAuditRecord {
  id: string;
  ownerId: string;
  fileName: string;
  detectedFormat: string;
  targetRole: string;
  engineMode: 'deterministic' | 'ai';
  overallScore: number;
  scoreLabel: string;
  piiItemsMasked: number;
  retentionPolicy: RetentionPolicyType;
  expiresAt: string;
  createdAt: string;
  analysisTimeMs: number;
  report: ResumeAnalysis;
}

export interface AuditAccessLog {
  id: string;
  ownerId: string;
  action: 'ANALYZE' | 'VIEW_REPORT' | 'PURGE_RECORD' | 'PURGE_ALL' | 'TTL_CLEANUP';
  resourceId: string;
  details: string;
  createdAt: string;
}

interface PersistedState {
  audits: StoredAuditRecord[];
  benchmarks: BenchmarkSummary[];
  logs: AuditAccessLog[];
}

export class AuditGovernanceStore {
  private readonly storePath: string;
  private state: PersistedState;

  constructor(storePath?: string) {
    this.storePath = storePath || path.resolve(process.cwd(), 'data', 'careerpulse_store.json');
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): PersistedState {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          audits: Array.isArray(parsed.audits) ? parsed.audits : [],
          benchmarks: Array.isArray(parsed.benchmarks) ? parsed.benchmarks : [],
          logs: Array.isArray(parsed.logs) ? parsed.logs : [],
        };
      }
    } catch {
      // Recover gracefully with fresh empty state
    }
    return { audits: [], benchmarks: [], logs: [] };
  }

  private flushToDisk(): void {
    try {
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storePath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Unable to flush audit store to disk:', err);
    }
  }

  public computeExpiryIso(policy: RetentionPolicyType, nowMs = Date.now()): string {
    if (policy === 'DAYS_7') {
      return new Date(nowMs + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (policy === 'HOURS_24') {
      return new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
    }
    return new Date(nowMs).toISOString();
  }

  public purgeExpired(nowMs = Date.now()): number {
    const before = this.state.audits.length;
    this.state.audits = this.state.audits.filter((record) => {
      const exp = Date.parse(record.expiresAt);
      return Number.isNaN(exp) || exp > nowMs;
    });
    const removed = before - this.state.audits.length;
    if (removed > 0) {
      this.flushToDisk();
    }
    return removed;
  }

  public saveAudit(
    ownerId: string,
    params: {
      fileName: string;
      detectedFormat: string;
      targetRole: string;
      engineMode: 'deterministic' | 'ai';
      retentionPolicy: RetentionPolicyType;
      report: ResumeAnalysis;
    },
    nowMs = Date.now()
  ): StoredAuditRecord | null {
    this.purgeExpired(nowMs);
    const id = `aud_${crypto.randomBytes(6).toString('hex')}`;
    const createdAt = new Date(nowMs).toISOString();
    const expiresAt = this.computeExpiryIso(params.retentionPolicy, nowMs);

    if (params.retentionPolicy === 'EPHEMERAL') {
      this.logAccess(
        ownerId,
        'ANALYZE',
        'ephemeral',
        `Mode=${params.engineMode}, Retention=EPHEMERAL (zero storage), MaskedPII=${params.report.piiItemsMasked || 0}`
      );
      return null;
    }

    const record: StoredAuditRecord = {
      id,
      ownerId,
      fileName: params.fileName,
      detectedFormat: params.detectedFormat,
      targetRole: params.targetRole,
      engineMode: params.engineMode,
      overallScore: params.report.overallScore,
      scoreLabel: params.report.scoreLabel,
      piiItemsMasked: params.report.piiItemsMasked || 0,
      retentionPolicy: params.retentionPolicy,
      expiresAt,
      createdAt,
      analysisTimeMs: params.report.analysisTimeMs || 0,
      report: {
        ...params.report,
        reportId: id,
        retentionPolicy: params.retentionPolicy,
        expiresAt,
      },
    };

    this.state.audits.unshift(record);
    if (this.state.audits.length > 250) {
      this.state.audits = this.state.audits.slice(0, 250);
    }
    this.logAccess(
      ownerId,
      'ANALYZE',
      id,
      `Mode=${params.engineMode}, Retention=${params.retentionPolicy}, MaskedPII=${record.piiItemsMasked}`
    );
    this.flushToDisk();
    return record;
  }

  public listAuditsByOwner(ownerId: string, nowMs = Date.now()): Omit<StoredAuditRecord, 'report'>[] {
    this.purgeExpired(nowMs);
    return this.state.audits
      .filter((a) => a.ownerId === ownerId)
      .map(({ report: _ignored, ...summary }) => summary);
  }

  public getAuditByIdForOwner(id: string, ownerId: string, nowMs = Date.now()): StoredAuditRecord | null {
    this.purgeExpired(nowMs);
    const found = this.state.audits.find((a) => a.id === id && a.ownerId === ownerId);
    if (found) {
      this.logAccess(ownerId, 'VIEW_REPORT', id, `Viewed stored report (${found.targetRole})`);
    }
    return found || null;
  }

  public deleteAuditForOwner(id: string, ownerId: string): boolean {
    const idx = this.state.audits.findIndex((a) => a.id === id && a.ownerId === ownerId);
    if (idx === -1) return false;
    this.state.audits.splice(idx, 1);
    this.logAccess(ownerId, 'PURGE_RECORD', id, 'User permanently deleted stored resume audit');
    this.flushToDisk();
    return true;
  }

  public purgeAllForOwner(ownerId: string): number {
    const before = this.state.audits.length;
    this.state.audits = this.state.audits.filter((a) => a.ownerId !== ownerId);
    const removed = before - this.state.audits.length;
    this.logAccess(ownerId, 'PURGE_ALL', `owner:${ownerId.slice(0, 8)}`, `Permanently purged ${removed} stored records`);
    this.flushToDisk();
    return removed;
  }

  public saveBenchmarkRun(summary: BenchmarkSummary): BenchmarkSummary {
    this.state.benchmarks.unshift(summary);
    if (this.state.benchmarks.length > 20) {
      this.state.benchmarks = this.state.benchmarks.slice(0, 20);
    }
    this.flushToDisk();
    return summary;
  }

  public listBenchmarkRuns(): BenchmarkSummary[] {
    return this.state.benchmarks;
  }

  public logAccess(
    ownerId: string,
    action: AuditAccessLog['action'],
    resourceId: string,
    details: string
  ): void {
    this.state.logs.unshift({
      id: `log_${crypto.randomBytes(5).toString('hex')}`,
      ownerId,
      action,
      resourceId,
      details,
      createdAt: new Date().toISOString(),
    });
    if (this.state.logs.length > 500) {
      this.state.logs = this.state.logs.slice(0, 500);
    }
    this.flushToDisk();
  }

  public listLogsForOwner(ownerId: string): AuditAccessLog[] {
    return this.state.logs.filter((l) => l.ownerId === ownerId).slice(0, 50);
  }
}
