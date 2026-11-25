package com.careerpulse.model;

import java.time.Instant;
import java.util.List;

/**
 * Models for the independently labeled ATS validation benchmark suite.
 */
public class BenchmarkModels {

    public record BenchmarkCase(
        String id,
        String label,
        String tier,
        String targetRole,
        String jobDescription,
        String resumeText,
        int expectedScore,
        int minBand,
        int maxBand,
        String rubricRationale
    ) {}

    public record BenchmarkResult(
        String id,
        String label,
        String tier,
        String targetRole,
        int expectedScore,
        int minBand,
        int maxBand,
        int predictedScore,
        int absoluteError,
        boolean withinBand,
        double latencyMs,
        String rubricRationale
    ) {}

    public static class BenchmarkSummary {
        private Long id;
        private Instant runTimestamp;
        private int datasetSize;
        private double meanAbsoluteError;
        private double bandAccuracyPct;
        private double spearmanRho;
        private double p50LatencyMs;
        private double p95LatencyMs;
        private List<BenchmarkResult> results;

        public BenchmarkSummary(
                int datasetSize,
                double meanAbsoluteError,
                double bandAccuracyPct,
                double spearmanRho,
                double p50LatencyMs,
                double p95LatencyMs,
                List<BenchmarkResult> results) {
            this.runTimestamp = Instant.now();
            this.datasetSize = datasetSize;
            this.meanAbsoluteError = meanAbsoluteError;
            this.bandAccuracyPct = bandAccuracyPct;
            this.spearmanRho = spearmanRho;
            this.p50LatencyMs = p50LatencyMs;
            this.p95LatencyMs = p95LatencyMs;
            this.results = results;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Instant getRunTimestamp() { return runTimestamp; }
        public void setRunTimestamp(Instant runTimestamp) { this.runTimestamp = runTimestamp; }
        public int getDatasetSize() { return datasetSize; }
        public double getMeanAbsoluteError() { return meanAbsoluteError; }
        public double getBandAccuracyPct() { return bandAccuracyPct; }
        public double getSpearmanRho() { return spearmanRho; }
        public double getP50LatencyMs() { return p50LatencyMs; }
        public double getP95LatencyMs() { return p95LatencyMs; }
        public List<BenchmarkResult> getResults() { return results; }
    }
}
