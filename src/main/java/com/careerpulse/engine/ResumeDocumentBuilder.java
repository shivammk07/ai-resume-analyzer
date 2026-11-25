package com.careerpulse.engine;

import com.careerpulse.model.ResumeBuilderProfile;
import com.careerpulse.model.ResumeBuilderProfile.EducationEntry;
import com.careerpulse.model.ResumeBuilderProfile.ExperienceEntry;
import com.careerpulse.model.ResumeBuilderProfile.TemplateStyle;

import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Pure Java 17 offline Resume &amp; Formal Bio-Data builder engine.
 * Renders XSS-safe printable HTML / Word (.doc) documents with optional embedded person photos,
 * clean ATS plain text, and real-time ATS readiness scores.
 */
public class ResumeDocumentBuilder {
    private static final Pattern METRIC_PATTERN = Pattern.compile(
        "(\\$\\d+|\\b\\d+(?:\\.\\d+)?\\s*(%|x|ms|hrs|hours|k|m|users|rps|tps)\\b)",
        Pattern.CASE_INSENSITIVE
    );
    private static final Set<String> STRONG_VERBS = Set.of(
        "architected", "engineered", "designed", "implemented", "built", "led",
        "spearheaded", "optimized", "reduced", "increased", "accelerated",
        "automated", "migrated", "scaled", "delivered", "launched", "developed"
    );

    /**
     * Encodes raw image bytes into a safe offline Base64 Data URL for embedding inside HTML/Word resumes.
     *
     * @param imageBytes image file bytes
     * @param mimeType image MIME type (e.g. image/jpeg, image/png)
     * @return Data URL string or empty string if invalid
     */
    public String encodePhotoToDataUrl(byte[] imageBytes, String mimeType) {
        if (imageBytes == null || imageBytes.length == 0) {
            return "";
        }
        String safeMime = (mimeType != null && mimeType.startsWith("image/"))
            ? mimeType.replaceAll("[^a-zA-Z0-9/+.-]", "")
            : "image/jpeg";
        return "data:" + safeMime + ";base64," + Base64.getEncoder().encodeToString(imageBytes);
    }

    /**
     * Serializes a profile into clean single-column ATS plain text ready for scoring or TXT export.
     *
     * @param profile resume or bio-data profile
     * @return formatted plain-text resume
     */
    public String renderPlainText(ResumeBuilderProfile profile) {
        StringBuilder sb = new StringBuilder();
        sb.append(profile.getFullName()).append('\n');
        if (!profile.getHeadline().isBlank()) {
            sb.append(profile.getHeadline()).append('\n');
        }
        List<String> contacts = List.of(
            profile.getEmail(), profile.getPhone(), profile.getLocation(),
            profile.getLinkedin(), profile.getGithub()
        ).stream().filter(s -> s != null && !s.isBlank()).toList();
        if (!contacts.isEmpty()) {
            sb.append(String.join(" | ", contacts)).append('\n');
        }
        sb.append('\n');

        if (!profile.getSummary().isBlank()) {
            sb.append(profile.getTemplateStyle() == TemplateStyle.FORMAL_BIODATA ? "CAREER OBJECTIVE\n" : "SUMMARY\n");
            sb.append(profile.getSummary()).append("\n\n");
        }
        if (!profile.getSkills().isEmpty()) {
            sb.append("TECHNICAL SKILLS\n");
            sb.append(String.join(", ", profile.getSkills())).append("\n\n");
        }
        if (!profile.getExperiences().isEmpty()) {
            sb.append("WORK EXPERIENCE\n");
            for (ExperienceEntry exp : profile.getExperiences()) {
                sb.append(exp.role()).append(" — ").append(exp.company())
                    .append(" | ").append(exp.period()).append('\n');
                for (String b : exp.bullets()) {
                    if (b != null && !b.isBlank()) {
                        sb.append("- ").append(b.trim()).append('\n');
                    }
                }
                sb.append('\n');
            }
        }
        if (!profile.getEducation().isEmpty()) {
            sb.append("EDUCATION\n");
            for (EducationEntry edu : profile.getEducation()) {
                sb.append(edu.degree()).append(" — ").append(edu.institution())
                    .append(" (").append(edu.period()).append(")\n");
                if (edu.details() != null && !edu.details().isBlank()) {
                    sb.append(edu.details()).append('\n');
                }
            }
            sb.append('\n');
        }
        if (!profile.getCertifications().isEmpty()) {
            sb.append("CERTIFICATIONS\n");
            for (String cert : profile.getCertifications()) {
                sb.append("- ").append(cert).append('\n');
            }
            sb.append('\n');
        }
        if (!profile.getLanguages().isEmpty()) {
            sb.append("LANGUAGES\n").append(String.join(", ", profile.getLanguages())).append("\n\n");
        }
        if (profile.isIncludeBioData() || profile.getTemplateStyle() == TemplateStyle.FORMAL_BIODATA) {
            sb.append("PERSONAL DETAILS (BIO-DATA)\n");
            appendIfPresent(sb, "Date of Birth", profile.getDateOfBirth());
            appendIfPresent(sb, "Gender", profile.getGender());
            appendIfPresent(sb, "Marital Status", profile.getMaritalStatus());
            appendIfPresent(sb, "Nationality", profile.getNationality());
            appendIfPresent(sb, "Father / Guardian Name", profile.getFatherName());
            appendIfPresent(sb, "Permanent Address", profile.getPermanentAddress());
            appendIfPresent(sb, "Hobbies", profile.getHobbies());
            sb.append("\nDECLARATION\n").append(profile.getDeclaration()).append('\n');
            sb.append("Place: ").append(profile.getDeclarationPlace())
                .append(" | Date: ").append(profile.getDeclarationDate())
                .append(" | Signature: ").append(profile.getFullName()).append('\n');
        }
        return sb.toString().trim();
    }

    /**
     * Renders an XSS-safe, printable HTML / Microsoft Word (.doc) Resume or Formal Bio-Data sheet.
     *
     * @param profile resume or bio-data profile
     * @return complete HTML5 document string
     */
    public String renderHtmlDocument(ResumeBuilderProfile profile) {
        String accent = profile.getAccentHex();
        boolean isBioData = profile.isIncludeBioData() || profile.getTemplateStyle() == TemplateStyle.FORMAL_BIODATA;
        boolean isSidebar = profile.getTemplateStyle() == TemplateStyle.SIDEBAR_PRO;
        String safeName = escapeHtml(profile.getFullName());

        String photoBlock = buildSafePhotoHtml(profile, accent);
        String contacts = List.of(
            profile.getEmail(), profile.getPhone(), profile.getLocation(),
            profile.getLinkedin(), profile.getGithub()
        ).stream().filter(s -> s != null && !s.isBlank()).map(ResumeDocumentBuilder::escapeHtml)
            .reduce((a, b) -> a + " &middot; " + b).orElse("");

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"/>");
        html.append("<title>").append(safeName).append(isBioData ? " — Bio-Data" : " — Resume").append("</title>");
        html.append("<style>");
        html.append("body{font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;margin:32px;line-height:1.48;font-size:10.5pt;}");
        html.append("h1{margin:0;font-size:21pt;color:").append(accent).append(";}");
        html.append("h2{font-size:10pt;text-transform:uppercase;letter-spacing:0.08em;color:").append(accent)
            .append(";border-bottom:1px solid #cbd5e1;padding-bottom:3px;margin:16px 0 8px;}");
        html.append(".layout{width:100%;border-collapse:collapse;}");
        html.append(".sidebar{width:210px;vertical-align:top;background:#0f172a;color:#f8fafc;padding:18px;}");
        html.append(".main{vertical-align:top;padding:0 0 0 20px;}");
        html.append("table.bio{width:100%;border-collapse:collapse;font-size:9.8pt;margin-top:6px;}");
        html.append("table.bio th,table.bio td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left;}");
        html.append("table.bio th{background:#f8fafc;width:30%;}");
        html.append("</style></head><body>");

        if (isSidebar) {
            html.append("<table class=\"layout\"><tr><td class=\"sidebar\">");
            html.append(photoBlock);
            html.append("<h1 style=\"color:#ffffff;font-size:16pt;margin-top:10px;\">").append(safeName).append("</h1>");
            html.append("<p style=\"font-size:9.5pt;color:#cbd5e1;\">").append(escapeHtml(profile.getHeadline())).append("</p>");
            html.append("<p style=\"font-size:8.8pt;color:#e2e8f0;\">").append(contacts).append("</p>");
            if (!profile.getSkills().isEmpty()) {
                html.append("<h2 style=\"color:#93c5fd;border-color:#334155;\">Skills</h2><p style=\"font-size:9pt;\">")
                    .append(escapeHtml(String.join(" · ", profile.getSkills()))).append("</p>");
            }
            if (!profile.getLanguages().isEmpty()) {
                html.append("<h2 style=\"color:#93c5fd;border-color:#334155;\">Languages</h2><p style=\"font-size:9pt;\">")
                    .append(escapeHtml(String.join(" · ", profile.getLanguages()))).append("</p>");
            }
            html.append("</td><td class=\"main\">");
            appendBodySections(html, profile, isBioData, true);
            html.append("</td></tr></table>");
        } else {
            html.append("<table class=\"layout\" style=\"border-bottom:2px solid ").append(accent)
                .append(";padding-bottom:10px;margin-bottom:12px;\"><tr><td style=\"vertical-align:top;\">");
            if (profile.getTemplateStyle() == TemplateStyle.FORMAL_BIODATA) {
                html.append("<div style=\"font-size:9pt;font-weight:700;letter-spacing:0.14em;color:#475569;\">")
                    .append("CURRICULUM VITAE / BIO-DATA</div>");
            }
            html.append("<h1>").append(safeName).append("</h1>");
            html.append("<div style=\"font-weight:600;color:#334155;margin-top:2px;\">")
                .append(escapeHtml(profile.getHeadline())).append("</div>");
            html.append("<div style=\"font-size:9.2pt;color:#475569;margin-top:6px;\">").append(contacts).append("</div>");
            html.append("</td>");
            if (!photoBlock.isEmpty()) {
                html.append("<td style=\"width:105px;text-align:right;vertical-align:top;\">").append(photoBlock).append("</td>");
            }
            html.append("</tr></table>");
            appendBodySections(html, profile, isBioData, false);
        }

        html.append("</body></html>");
        return html.toString();
    }

    /**
     * Computes a deterministic 0-100 ATS readiness score for live feedback while drafting.
     *
     * @param profile resume or bio-data profile
     * @return integer score clamped to 0..100
     */
    public int computeLiveAtsReadinessScore(ResumeBuilderProfile profile) {
        int score = 20;
        if (!profile.getFullName().isBlank() && !profile.getEmail().isBlank()) {
            score += 12;
        }
        if (profile.getSummary().trim().length() >= 60) {
            score += 12;
        }
        if (profile.getSkills().size() >= 6) {
            score += 12;
        }
        if (!profile.getEducation().isEmpty()) {
            score += 8;
        }
        List<String> bullets = profile.getExperiences().stream()
            .flatMap(e -> e.bullets().stream())
            .filter(b -> b != null && !b.isBlank())
            .toList();
        if (bullets.size() >= 4) {
            score += 10;
        } else if (bullets.size() >= 2) {
            score += 6;
        }
        if (!bullets.isEmpty()) {
            long quantified = bullets.stream().filter(b -> METRIC_PATTERN.matcher(b).find()).count();
            long strongStarts = bullets.stream().filter(b -> {
                String first = b.trim().toLowerCase(Locale.ROOT).split("\\s+")[0].replaceAll("[^a-z]", "");
                return STRONG_VERBS.contains(first);
            }).count();
            score += (int) Math.round((quantified * 16.0) / bullets.size());
            score += (int) Math.round((strongStarts * 10.0) / bullets.size());
        }
        return Math.max(0, Math.min(100, score));
    }

    private void appendBodySections(
            StringBuilder html,
            ResumeBuilderProfile profile,
            boolean isBioData,
            boolean skillsInSidebar) {
        if (!profile.getSummary().isBlank()) {
            html.append("<h2>").append(isBioData ? "Career Objective" : "Professional Summary").append("</h2>");
            html.append("<p>").append(escapeHtml(profile.getSummary())).append("</p>");
        }
        if (!skillsInSidebar && !profile.getSkills().isEmpty()) {
            html.append("<h2>Technical Skills</h2><p>")
                .append(escapeHtml(String.join(" · ", profile.getSkills()))).append("</p>");
        }
        if (!profile.getExperiences().isEmpty()) {
            html.append("<h2>Work Experience</h2>");
            for (ExperienceEntry exp : profile.getExperiences()) {
                html.append("<div><strong>").append(escapeHtml(exp.role())).append(" — ")
                    .append(escapeHtml(exp.company())).append("</strong> (")
                    .append(escapeHtml(exp.period())).append(")</div><ul>");
                for (String b : exp.bullets()) {
                    if (b != null && !b.isBlank()) {
                        html.append("<li>").append(escapeHtml(b)).append("</li>");
                    }
                }
                html.append("</ul>");
            }
        }
        if (!profile.getEducation().isEmpty()) {
            html.append("<h2>").append(isBioData ? "Academic Qualifications" : "Education").append("</h2>");
            html.append("<table class=\"bio\"><tr><th>Degree</th><th>Institution</th><th>Period</th><th>Details</th></tr>");
            for (EducationEntry edu : profile.getEducation()) {
                html.append("<tr><td>").append(escapeHtml(edu.degree())).append("</td><td>")
                    .append(escapeHtml(edu.institution())).append("</td><td>")
                    .append(escapeHtml(edu.period())).append("</td><td>")
                    .append(escapeHtml(edu.details())).append("</td></tr>");
            }
            html.append("</table>");
        }
        if (!profile.getCertifications().isEmpty()) {
            html.append("<h2>Certifications</h2><ul>");
            for (String c : profile.getCertifications()) {
                html.append("<li>").append(escapeHtml(c)).append("</li>");
            }
            html.append("</ul>");
        }
        if (isBioData) {
            html.append("<h2>Personal Details (Bio-Data)</h2><table class=\"bio\">");
            appendBioRow(html, "Date of Birth", profile.getDateOfBirth());
            appendBioRow(html, "Gender", profile.getGender());
            appendBioRow(html, "Marital Status", profile.getMaritalStatus());
            appendBioRow(html, "Nationality", profile.getNationality());
            appendBioRow(html, "Father's / Guardian's Name", profile.getFatherName());
            appendBioRow(html, "Permanent Address", profile.getPermanentAddress());
            appendBioRow(html, "Hobbies & Interests", profile.getHobbies());
            html.append("</table>");
            html.append("<h2>Declaration</h2><p><em>").append(escapeHtml(profile.getDeclaration())).append("</em></p>");
            html.append("<p><strong>Place:</strong> ").append(escapeHtml(profile.getDeclarationPlace()))
                .append(" &nbsp;|&nbsp; <strong>Date:</strong> ").append(escapeHtml(profile.getDeclarationDate()))
                .append(" &nbsp;|&nbsp; <strong>Signature:</strong> ").append(escapeHtml(profile.getFullName()))
                .append("</p>");
        }
    }

    private String buildSafePhotoHtml(ResumeBuilderProfile profile, String accent) {
        if (!profile.isShowPhoto()) {
            return "";
        }
        String photo = profile.getPhotoDataUrl();
        if (photo == null || !photo.startsWith("data:image/")) {
            return "";
        }
        String radius = profile.getTemplateStyle() == TemplateStyle.FORMAL_BIODATA ? "4px" : "10px";
        return "<img src=\"" + escapeHtml(photo) + "\" alt=\"" + escapeHtml(profile.getFullName())
            + "\" style=\"width:90px;height:90px;object-fit:cover;border-radius:" + radius
            + ";border:2px solid " + accent + ";\"/>";
    }

    private static void appendBioRow(StringBuilder html, String label, String value) {
        if (value != null && !value.isBlank()) {
            html.append("<tr><th>").append(escapeHtml(label)).append("</th><td>")
                .append(escapeHtml(value)).append("</td></tr>");
        }
    }

    private static void appendIfPresent(StringBuilder sb, String label, String value) {
        if (value != null && !value.isBlank()) {
            sb.append(label).append(": ").append(value).append('\n');
        }
    }

    /**
     * Escapes HTML special characters to prevent XSS in generated HTML/Word resumes.
     *
     * @param input raw string
     * @return HTML-escaped string
     */
    public static String escapeHtml(String input) {
        if (input == null) {
            return "";
        }
        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
