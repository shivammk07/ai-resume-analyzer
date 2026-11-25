package com.careerpulse.engine;

import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Deterministic offline career advisor providing "Write This Instead" upgrades in Core Java 17:
 * tailored professional summaries, Google XYZ bullet transformations, missing-keyword insertion
 * lines, tailored cover letters, and role-specific interview preparation prompts.
 */
public class ResumeRewriteAdvisor {
    private static final Pattern PASSIVE_PREFIX = Pattern.compile(
        "^(worked on|responsible for|helped with|helped|assisted with|assisted in|involved in|"
            + "handled|tasked with|participated in|was responsible for|did)\\s+",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern METRIC_PATTERN = Pattern.compile(
        "(\\$\\d+|\\b\\d+(?:\\.\\d+)?\\s*(%|x|ms|hrs|hours|k|m|users|rps|tps)\\b)",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Represents a single Before -> After bullet improvement suggestion.
     *
     * @param original original bullet line
     * @param improved rewritten Google XYZ bullet
     * @param rationale concise explanation of the upgrade
     */
    public record BulletUpgrade(String original, String improved, String rationale) {
    }

    /**
     * Represents an actionable sentence starter for a missing ATS keyword.
     *
     * @param keyword missing target skill or keyword
     * @param targetSection recommended resume section
     * @param readyLine copy-paste ready resume bullet
     */
    public record KeywordSuggestion(String keyword, String targetSection, String readyLine) {
    }

    /**
     * Represents a role-specific interview question with STAR preparation guidance.
     *
     * @param category interview track (Technical, System Design, Behavioral)
     * @param question interview question prompt
     * @param starFocus recommended STAR / engineering proof focus
     */
    public record InterviewQuestion(String category, String question, String starFocus) {
    }

    /**
     * Builds a role-aligned professional summary incorporating matched skills and closing top gaps.
     *
     * @param resume parsed resume document
     * @param jd target job description
     * @param matchedSkills skills already detected in the resume
     * @param missingSkills top missing target skills
     * @return copy-ready professional summary
     */
    public String generateSuggestedSummary(
            ResumeDocument resume,
            JobDescriptionDocument jd,
            List<String> matchedSkills,
            List<String> missingSkills) {
        String role = jd != null && jd.getTargetTitle() != null && !jd.getTargetTitle().isBlank()
            ? jd.getTargetTitle()
            : "Software Engineer";
        List<String> core = new ArrayList<>();
        if (matchedSkills != null) {
            for (int i = 0; i < Math.min(4, matchedSkills.size()); i++) {
                core.add(matchedSkills.get(i));
            }
        }
        String skillPhrase = core.isEmpty()
            ? "Java 17, SQL, REST APIs, and automated testing"
            : String.join(", ", core);
        String gapNote = (missingSkills != null && !missingSkills.isEmpty())
            ? " Actively applying " + missingSkills.get(0) + " and modern CI/CD practices."
            : " Proven record of delivering reliable, low-latency systems at scale.";
        int wordCount = resume != null ? resume.getWordCount() : 0;
        String depth = wordCount > 350 ? "Results-driven" : "Impact-focused";
        return depth + " " + role + " specializing in " + skillPhrase
            + ", with demonstrated ownership of measurable performance gains and production reliability."
            + gapNote;
    }

    /**
     * Identifies weak or unquantified resume bullets and rewrites them using the Google XYZ formula.
     *
     * @param resume parsed resume document
     * @param targetRole target role title
     * @return list of concrete Before -> After bullet upgrades
     */
    public List<BulletUpgrade> suggestBulletUpgrades(ResumeDocument resume, String targetRole) {
        List<BulletUpgrade> upgrades = new ArrayList<>();
        if (resume == null) {
            return upgrades;
        }
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole : "Software Engineer";
        for (String bullet : resume.getBulletLines()) {
            String trimmed = bullet.trim();
            if (trimmed.length() < 12) {
                continue;
            }
            boolean isPassive = PASSIVE_PREFIX.matcher(trimmed).find();
            boolean lacksMetric = !METRIC_PATTERN.matcher(trimmed).find();
            if (isPassive || lacksMetric) {
                upgrades.add(rewriteSingleBullet(trimmed, role, isPassive));
                if (upgrades.size() >= 6) {
                    break;
                }
            }
        }
        if (upgrades.isEmpty()) {
            upgrades.add(new BulletUpgrade(
                "Maintained backend application modules and assisted with bug fixes.",
                "Architected resilient " + role + " modules and automated regression suites, reducing p95 latency by 34% and production defects by 45%.",
                "Demonstrates ownership verb + quantifiable reliability and latency outcome."
            ));
        }
        return upgrades;
    }

    /**
     * Rewrites a single resume bullet into a Google XYZ achievement statement.
     *
     * @param rawBullet original bullet text
     * @param targetRole target role context
     * @param hadPassiveLead whether passive phrasing was detected
     * @return upgraded bullet recommendation
     */
    public BulletUpgrade rewriteSingleBullet(String rawBullet, String targetRole, boolean hadPassiveLead) {
        String core = PASSIVE_PREFIX.matcher(rawBullet.trim()).replaceFirst("").trim();
        if (core.endsWith(".")) {
            core = core.substring(0, core.length() - 1);
        }
        if (core.isEmpty()) {
            core = "core " + targetRole.toLowerCase(Locale.ROOT) + " workflows";
        }
        String loweredFirst = Character.toLowerCase(core.charAt(0)) + core.substring(1);
        String improved = "Engineered " + loweredFirst
            + ", improving throughput by 35% and reducing operational overhead by 10+ hrs/week through automated validation.";
        String rationale = hadPassiveLead
            ? "Replaced passive phrasing with strong ownership verb and quantifiable XYZ outcome."
            : "Added measurable throughput and efficiency metrics to strengthen recruiter impact.";
        return new BulletUpgrade(rawBullet, improved, rationale);
    }

    /**
     * Generates ready-to-insert resume bullets for missing crucial JD keywords.
     *
     * @param missingKeywords keywords absent from the resume
     * @param targetRole target job title
     * @return actionable insertion templates
     */
    public List<KeywordSuggestion> generateKeywordInsertionLines(List<String> missingKeywords, String targetRole) {
        List<KeywordSuggestion> results = new ArrayList<>();
        if (missingKeywords == null) {
            return results;
        }
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole : "Engineering";
        int limit = Math.min(6, missingKeywords.size());
        for (int i = 0; i < limit; i++) {
            String kw = missingKeywords.get(i);
            String section = (i % 2 == 0) ? "Work Experience" : "Projects & Technical Skills";
            String line = "Implemented production " + role + " workflows leveraging " + kw
                + ", cutting deployment friction by 30% and sustaining 99.9% reliability.";
            results.add(new KeywordSuggestion(kw, section, line));
        }
        return results;
    }

    /**
     * Generates a structured, deterministic offline cover letter aligned with matched resume skills.
     *
     * @param candidateName applicant full name
     * @param targetRole target role title
     * @param companyName target organization
     * @param matchedSkills verified skills from resume analysis
     * @param tone desired tone (Professional, Enthusiastic, Executive)
     * @return formatted cover letter text
     */
    public String generateCoverLetter(
            String candidateName,
            String targetRole,
            String companyName,
            List<String> matchedSkills,
            String tone) {
        String name = (candidateName != null && !candidateName.isBlank()) ? candidateName : "Candidate";
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole : "Software Engineer";
        String company = (companyName != null && !companyName.isBlank()) ? companyName : "your engineering team";
        String skillsText = (matchedSkills != null && !matchedSkills.isEmpty())
            ? String.join(", ", matchedSkills.subList(0, Math.min(5, matchedSkills.size())))
            : "Java 17, JDBC, SQL, REST APIs, and automated testing";
        String opening = "Executive".equalsIgnoreCase(tone)
            ? "I am writing to present my candidacy for the " + role + " position at " + company + "."
            : "I am excited to apply for the " + role + " role at " + company + ".";

        return "Dear Hiring Manager,\n\n"
            + opening + " With hands-on expertise across " + skillsText
            + ", I focus on building maintainable systems that deliver measurable latency, reliability, and cost gains.\n\n"
            + "In my recent projects, I designed modular architectures, enforced automated test coverage, "
            + "and partnered across engineering stakeholders to ship production capabilities ahead of schedule. "
            + "I would welcome the opportunity to bring this disciplined, metric-driven approach to " + company + ".\n\n"
            + "Thank you for your time and consideration.\n\n"
            + "Sincerely,\n"
            + name;
    }

    /**
     * Generates role-targeted interview preparation questions based on matched strengths and skill gaps.
     *
     * @param targetRole target job title
     * @param matchedSkills skills present on the resume
     * @param missingSkills target skills to prepare for
     * @return list of interview prep questions
     */
    public List<InterviewQuestion> generateInterviewPrep(
            String targetRole,
            List<String> matchedSkills,
            List<String> missingSkills) {
        List<InterviewQuestion> questions = new ArrayList<>();
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole : "Software Engineer";
        String topMatched = (matchedSkills != null && !matchedSkills.isEmpty()) ? matchedSkills.get(0) : "Java 17";
        String topGap = (missingSkills != null && !missingSkills.isEmpty()) ? missingSkills.get(0) : "System Scaling";

        questions.add(new InterviewQuestion(
            "Technical Deep-Dive",
            "Walk through a production system you built using " + topMatched + ". How did you measure and optimize performance?",
            "State baseline latency/throughput, profiling evidence, architectural change, and exact percentage improvement."
        ));
        questions.add(new InterviewQuestion(
            "Gap Readiness",
            "How would you apply " + topGap + " in a " + role + " architecture to prevent bottlenecks or regressions?",
            "Demonstrate practical fundamentals, failure-mode tradeoffs, and a concrete migration or testing plan."
        ));
        questions.add(new InterviewQuestion(
            "System Design & Reliability",
            "Design an end-to-end " + role + " workflow with PII protection, transactional persistence, and sub-100ms response SLAs.",
            "Cover parameterized persistence, failure rollback semantics, PII masking before storage, and observability."
        ));
        questions.add(new InterviewQuestion(
            "Behavioral (STAR)",
            "Describe a time you inherited a messy codebase or failing build pipeline and turned it into a reliable release process.",
            "Highlight Situation, your personal Task, specific technical Actions taken, and quantified defect reduction."
        ));
        return questions;
    }
}
