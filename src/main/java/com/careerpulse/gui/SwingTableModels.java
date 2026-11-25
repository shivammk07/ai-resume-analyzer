package com.careerpulse.gui;

import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.BenchmarkModels.BenchmarkResult;
import com.careerpulse.model.FixRecommendation;

import javax.swing.table.AbstractTableModel;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Reusable, headless-safe Swing {@link AbstractTableModel} implementations powering
 * the Prioritized Fixes, JDBC Audit History, and 12-Resume Benchmark Validation tables.
 *
 * @author Shivam Kumar (Team Moshdi)
 */
public final class SwingTableModels {
    private static final DateTimeFormatter TIME_FMT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.systemDefault());

    private SwingTableModels() {
        // Utility holder class
    }

    /**
     * Table model displaying prioritized {@link FixRecommendation} items pulled from
     * the scoring engine's {@link java.util.PriorityQueue}.
     */
    public static class FixRecommendationTableModel extends AbstractTableModel {
        private static final String[] COLUMNS = {
            "Priority", "Section", "Action Item", "Recommended Fix"
        };
        private final List<FixRecommendation> rows = new ArrayList<>();

        /**
         * Replaces all table rows and notifies Swing listeners.
         *
         * @param items ordered list of fix recommendations
         */
        public void setItems(List<FixRecommendation> items) {
            rows.clear();
            if (items != null) {
                rows.addAll(items);
            }
            fireTableDataChanged();
        }

        @Override
        public int getRowCount() {
            return rows.size();
        }

        @Override
        public int getColumnCount() {
            return COLUMNS.length;
        }

        @Override
        public String getColumnName(int column) {
            return COLUMNS[column];
        }

        @Override
        public Object getValueAt(int rowIndex, int columnIndex) {
            FixRecommendation item = rows.get(rowIndex);
            return switch (columnIndex) {
                case 0 -> item.getPriority().name();
                case 1 -> item.getSection();
                case 2 -> item.getTitle();
                case 3 -> item.getRecommendation();
                default -> "";
            };
        }
    }

    /**
     * Table model displaying owner-scoped {@link AnalysisReport} rows loaded from JDBC.
     */
    public static class AuditHistoryTableModel extends AbstractTableModel {
        private static final String[] COLUMNS = {
            "Report ID", "File Name", "Target Role", "Score", "Band",
            "PII Masked", "Retention TTL", "Latency (ms)", "Created"
        };
        private final List<AnalysisReport> rows = new ArrayList<>();

        /**
         * Replaces all history rows and triggers a UI table refresh.
         *
         * @param reports persisted analysis reports
         */
        public void setReports(List<AnalysisReport> reports) {
            rows.clear();
            if (reports != null) {
                rows.addAll(reports);
            }
            fireTableDataChanged();
        }

        /**
         * Returns the {@link AnalysisReport} backing the requested view row.
         *
         * @param rowIndex zero-based row index
         * @return matching analysis report
         */
        public AnalysisReport getReportAt(int rowIndex) {
            return rows.get(rowIndex);
        }

        @Override
        public int getRowCount() {
            return rows.size();
        }

        @Override
        public int getColumnCount() {
            return COLUMNS.length;
        }

        @Override
        public String getColumnName(int column) {
            return COLUMNS[column];
        }

        @Override
        public Object getValueAt(int rowIndex, int columnIndex) {
            AnalysisReport report = rows.get(rowIndex);
            return switch (columnIndex) {
                case 0 -> report.getId();
                case 1 -> report.getFileName();
                case 2 -> report.getTargetRole();
                case 3 -> report.getOverallScore();
                case 4 -> report.getScoreLabel();
                case 5 -> report.getPiiItemsMasked();
                case 6 -> report.getRetentionPolicy() != null ? report.getRetentionPolicy().name() : "HOURS_24";
                case 7 -> report.getAnalysisTimeMs();
                case 8 -> report.getCreatedAt() != null ? TIME_FMT.format(report.getCreatedAt()) : "";
                default -> "";
            };
        }
    }

    /**
     * Table model displaying per-resume accuracy and latency results from the
     * 12-resume independently annotated {@link com.careerpulse.engine.BenchmarkValidator}.
     */
    public static class BenchmarkResultTableModel extends AbstractTableModel {
        private static final String[] COLUMNS = {
            "Case ID", "Tier", "Profile Label", "Expected", "Band Range",
            "Predicted", "Abs Error", "In Band", "Latency (ms)"
        };
        private final List<BenchmarkResult> rows = new ArrayList<>();

        /**
         * Replaces benchmark rows and notifies table listeners.
         *
         * @param results benchmark case evaluation rows
         */
        public void setResults(List<BenchmarkResult> results) {
            rows.clear();
            if (results != null) {
                rows.addAll(results);
            }
            fireTableDataChanged();
        }

        @Override
        public int getRowCount() {
            return rows.size();
        }

        @Override
        public int getColumnCount() {
            return COLUMNS.length;
        }

        @Override
        public String getColumnName(int column) {
            return COLUMNS[column];
        }

        @Override
        public Object getValueAt(int rowIndex, int columnIndex) {
            BenchmarkResult result = rows.get(rowIndex);
            return switch (columnIndex) {
                case 0 -> result.id();
                case 1 -> result.tier();
                case 2 -> result.label();
                case 3 -> result.expectedScore();
                case 4 -> result.minBand() + "-" + result.maxBand();
                case 5 -> result.predictedScore();
                case 6 -> result.absoluteError();
                case 7 -> result.withinBand() ? "PASS" : "OUT";
                case 8 -> result.latencyMs();
                default -> "";
            };
        }
    }
}
