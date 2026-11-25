import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { redactResumePii } from '../src/server/piiRedactor';
import { runDeterministicAudit } from '../src/server/deterministicEngine';
import { runBenchmarkValidationSuite } from '../src/server/benchmarkSuite';
import { AuditGovernanceStore } from '../src/server/auditStore';

test('PII Redactor masks SSN, email, phone, street address, and DOB while preserving ATS metrics', () => {
  const raw = `Jane Doe
Email: jane.doe@example.org | Phone: (415) 555-0199
Address: 742 Evergreen Terrace Street
SSN: 123-45-6789 | DOB: 04/12/1996
EXPERIENCE
- Engineered Java 17 JDBC services reducing latency by 48% ($1.2M saved).`;

  const result = redactResumePii(raw);
  assert.equal(result.totalMaskedCount, 5);
  assert.ok(!result.redactedText.includes('jane.doe@example.org'));
  assert.ok(!result.redactedText.includes('123-45-6789'));
  assert.ok(!result.redactedText.includes('742 Evergreen Terrace Street'));
  assert.ok(result.redactedText.includes('[REDACTED_EMAIL]'));
  assert.ok(result.redactedText.includes('[REDACTED_PHONE]'));
  assert.ok(result.redactedText.includes('[REDACTED_SSN]'));
  assert.ok(result.redactedText.includes('[REDACTED_ADDRESS]'));
  assert.ok(result.redactedText.includes('[REDACTED_DOB]'));
  assert.ok(result.redactedText.includes('48%'));
  assert.ok(result.redactedText.includes('$1.2M'));
});

test('Deterministic ATS Engine runs offline with reproducible scores and ranks strong > weak', () => {
  const jd = 'Required: Java, JDBC, Servlets, JSP, MySQL, Maven, JUnit, REST API, Docker, SQL.';
  const strongResume = `Priya Nair
priya@example.com | 415-555-0192 | linkedin.com/in/priya

SUMMARY
Senior Java Backend Engineer specializing in Jakarta Servlets, JDBC, MySQL, and REST APIs.

EXPERIENCE
Senior Java Engineer | FinCore | 2021 - Present
- Architected Jakarta EE Servlet and JDBC DAO services on MySQL handling 40,000 requests per second.
- Optimized SQL queries and Maven CI pipelines with JUnit 5, reducing latency by 45% ($500k saved).
- Engineered Dockerized REST API microservices serving 1.2M users with 99.98% uptime.

SKILLS
Java, JDBC, Servlets, JSP, MySQL, Maven, JUnit, REST API, Docker, SQL

EDUCATION
B.S. in Computer Science (2015 - 2019)`;

  const weakResume = `John Smith
Responsible for helping with office computer work and worked on some tasks in school.
Duties included answering emails and assisted in basic reports.`;

  const run1 = runDeterministicAudit({ resumeText: strongResume, jobTitle: 'Senior Java Engineer', jobDescription: jd });
  const run2 = runDeterministicAudit({ resumeText: strongResume, jobTitle: 'Senior Java Engineer', jobDescription: jd });
  const weak = runDeterministicAudit({ resumeText: weakResume, jobTitle: 'Senior Java Engineer', jobDescription: jd });

  assert.equal(run1.overallScore, run2.overallScore, 'Deterministic scoring must be 100% reproducible');
  assert.ok(run1.overallScore >= 84, `Expected strong resume >= 84, got ${run1.overallScore}`);
  assert.ok(weak.overallScore <= 45, `Expected weak resume <= 45, got ${weak.overallScore}`);
  assert.equal(run1.piiItemsMasked, 2);
  assert.ok(run1.disclaimer?.includes('do not guarantee hiring'));
});

test('12-Resume Independently Labeled Benchmark Suite satisfies MAE, Band Accuracy, Spearman rho, and Latency', () => {
  const summary = runBenchmarkValidationSuite();
  assert.equal(summary.datasetSize, 12);
  assert.ok(summary.meanAbsoluteError <= 10.0, `MAE ${summary.meanAbsoluteError} exceeded 10.0`);
  assert.ok(summary.bandAccuracyPct >= 75.0, `Band accuracy ${summary.bandAccuracyPct}% below 75%`);
  assert.ok(summary.spearmanRho >= 0.85, `Spearman rho ${summary.spearmanRho} below 0.85`);
  assert.ok(summary.p95LatencyMs < 100.0, `p95 latency ${summary.p95LatencyMs}ms exceeded 100ms`);
});

test('AuditGovernanceStore enforces owner isolation, ephemeral non-storage, TTL expiry, and purge-all', () => {
  const tmpFile = path.join(os.tmpdir(), `careerpulse_test_${Date.now()}.json`);
  try {
    const store = new AuditGovernanceStore(tmpFile);
    const report = runDeterministicAudit({
      resumeText: 'SUMMARY\nJava Dev\nEXPERIENCE\n- Built JDBC DAOs serving 10,000 users.\nSKILLS\nJava, JDBC, MySQL',
      jobTitle: 'Java Developer',
      jobDescription: 'Java, JDBC, MySQL',
    });

    const baseTime = Date.now();
    // Ephemeral policy must NOT persist to store
    const ephemeral = store.saveAudit(
      'owner_alice_123456',
      {
        fileName: 'ephemeral.txt',
        detectedFormat: 'Text',
        targetRole: 'Java Developer',
        engineMode: 'deterministic',
        retentionPolicy: 'EPHEMERAL',
        report,
      },
      baseTime
    );
    assert.equal(ephemeral, null);
    assert.equal(store.listAuditsByOwner('owner_alice_123456', baseTime).length, 0);

    // 24h persistent save
    const saved = store.saveAudit(
      'owner_alice_123456',
      {
        fileName: 'alice.txt',
        detectedFormat: 'Text',
        targetRole: 'Java Developer',
        engineMode: 'deterministic',
        retentionPolicy: 'HOURS_24',
        report,
      },
      baseTime
    );
    assert.ok(saved !== null);

    // Ownership isolation check: Bob cannot view or delete Alice's audit
    assert.equal(store.getAuditByIdForOwner(saved.id, 'owner_bob_987654', baseTime), null);
    assert.equal(store.deleteAuditForOwner(saved.id, 'owner_bob_987654'), false);
    assert.ok(store.getAuditByIdForOwner(saved.id, 'owner_alice_123456', baseTime) !== null);

    // TTL expiration after 25 hours
    const expiredRemoved = store.purgeExpired(baseTime + 25 * 60 * 60 * 1000);
    assert.equal(expiredRemoved, 1);
    assert.equal(store.listAuditsByOwner('owner_alice_123456', baseTime + 25 * 60 * 60 * 1000).length, 0);
  } finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
});
