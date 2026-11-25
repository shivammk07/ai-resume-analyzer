package com.careerpulse.model;

/**
 * Actionable resume fix item implementing {@link Comparable} so recommendations can be
 * prioritized using Java's {@link java.util.PriorityQueue}.
 */
public class FixRecommendation implements Comparable<FixRecommendation> {
    public enum Priority {
        HIGH(1),
        MEDIUM(2),
        LOW(3);

        private final int rank;

        Priority(int rank) {
            this.rank = rank;
        }

        public int getRank() {
            return rank;
        }
    }

    private final String title;
    private final String section;
    private final String issue;
    private final String recommendation;
    private final Priority priority;

    public FixRecommendation(String title, String section, String issue, String recommendation, Priority priority) {
        this.title = title;
        this.section = section;
        this.issue = issue;
        this.recommendation = recommendation;
        this.priority = priority != null ? priority : Priority.MEDIUM;
    }

    @Override
    public int compareTo(FixRecommendation other) {
        int rankDiff = Integer.compare(this.priority.getRank(), other.priority.getRank());
        return rankDiff != 0 ? rankDiff : this.title.compareToIgnoreCase(other.title);
    }

    public String getTitle() {
        return title;
    }

    public String getSection() {
        return section;
    }

    public String getIssue() {
        return issue;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public Priority getPriority() {
        return priority;
    }
}
