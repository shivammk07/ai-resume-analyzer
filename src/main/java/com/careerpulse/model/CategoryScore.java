package com.careerpulse.model;

/**
 * Value object representing a single weighted ATS scoring criterion outcome.
 */
public class CategoryScore {
    private final String criterionName;
    private final int score;
    private final double weight;
    private final String status;
    private final String feedback;

    public CategoryScore(String criterionName, int score, double weight, String feedback) {
        this.criterionName = criterionName;
        this.score = Math.max(0, Math.min(100, score));
        this.weight = weight;
        this.status = this.score >= 80 ? "good" : (this.score >= 60 ? "warning" : "critical");
        this.feedback = feedback;
    }

    public String getCriterionName() {
        return criterionName;
    }

    public int getScore() {
        return score;
    }

    public double getWeight() {
        return weight;
    }

    public String getStatus() {
        return status;
    }

    public String getFeedback() {
        return feedback;
    }
}
