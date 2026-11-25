package com.careerpulse;

import com.careerpulse.engine.BenchmarkValidator;
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Automated validation and performance benchmark suite evaluating the deterministic
 * ATS engine against 12 independently labeled resumes across 4 quality tiers.
 */
class BenchmarkValidationTest {

    @Test
    void shouldMeetAccuracyRankCorrelationAndLatencyThresholds() throws Exception {
        BenchmarkValidator validator = new BenchmarkValidator();
        BenchmarkSummary summary = validator.runValidationSuite();

        assertEquals(12, summary.getDatasetSize());
        assertTrue(summary.getMeanAbsoluteError() <= 10.0,
            "Expected MAE <= 10.0, actual: " + summary.getMeanAbsoluteError());
        assertTrue(summary.getBandAccuracyPct() >= 75.0,
            "Expected band accuracy >= 75%, actual: " + summary.getBandAccuracyPct());
        assertTrue(summary.getSpearmanRho() >= 0.85,
            "Expected strong monotonic rank correlation (Spearman >= 0.85), actual: " + summary.getSpearmanRho());
        assertTrue(summary.getP95LatencyMs() < 100.0,
            "Deterministic local p95 latency should stay under 100ms, actual: " + summary.getP95LatencyMs());
    }
}
