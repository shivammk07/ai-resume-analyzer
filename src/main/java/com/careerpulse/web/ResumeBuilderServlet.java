package com.careerpulse.web;

import com.careerpulse.engine.ResumeDocumentBuilder;
import com.careerpulse.model.ResumeBuilderProfile;
import com.careerpulse.model.ResumeBuilderProfile.EducationEntry;
import com.careerpulse.model.ResumeBuilderProfile.ExperienceEntry;
import com.careerpulse.model.ResumeBuilderProfile.TemplateStyle;
import com.careerpulse.util.JsonSupport;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Jakarta EE 10 Servlet providing the offline Resume &amp; Formal Bio-Data Creator
 * with optional profile photo upload, 4 templates, Word (.doc) / HTML / TXT export,
 * and live ATS readiness scoring.
 */
@WebServlet(urlPatterns = {"/builder", "/api/java/builder"})
@MultipartConfig(maxFileSize = 3 * 1024 * 1024, maxRequestSize = 5 * 1024 * 1024)
public class ResumeBuilderServlet extends HttpServlet {
    private final ResumeDocumentBuilder builder;

    public ResumeBuilderServlet() {
        this(new ResumeDocumentBuilder());
    }

    public ResumeBuilderServlet(ResumeDocumentBuilder builder) {
        this.builder = builder;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setAttribute("templates", TemplateStyle.values());
        req.getRequestDispatcher("/WEB-INF/views/builder.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        ResumeBuilderProfile profile = parseProfileFromRequest(req);
        String exportFormat = req.getParameter("exportFormat");
        String fileSlug = profile.getFullName().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_");
        if (fileSlug.isBlank()) {
            fileSlug = "careerpulse_resume";
        }

        if ("doc".equalsIgnoreCase(exportFormat) || "html".equalsIgnoreCase(exportFormat)) {
            String html = builder.renderHtmlDocument(profile);
            boolean isWord = "doc".equalsIgnoreCase(exportFormat);
            resp.setContentType(isWord ? "application/msword; charset=UTF-8" : "text/html; charset=UTF-8");
            resp.setHeader(
                "Content-Disposition",
                "attachment; filename=\"" + fileSlug + (isWord ? "_BioData_Resume.doc\"" : "_Resume.html\"")
            );
            resp.getWriter().write(html);
            return;
        }

        if ("txt".equalsIgnoreCase(exportFormat)) {
            String txt = builder.renderPlainText(profile);
            resp.setContentType("text/plain; charset=UTF-8");
            resp.setHeader("Content-Disposition", "attachment; filename=\"" + fileSlug + "_ATS_Resume.txt\"");
            resp.getWriter().write(txt);
            return;
        }

        String renderedHtml = builder.renderHtmlDocument(profile);
        String renderedTxt = builder.renderPlainText(profile);
        int atsScore = builder.computeLiveAtsReadinessScore(profile);

        if (isJsonRequest(req)) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("atsReadinessScore", atsScore);
            payload.put("plainText", renderedTxt);
            payload.put("htmlDocument", renderedHtml);
            resp.setContentType("application/json; charset=UTF-8");
            resp.getWriter().write(JsonSupport.gson().toJson(payload));
            return;
        }

        req.setAttribute("profile", profile);
        req.setAttribute("atsScore", atsScore);
        req.setAttribute("renderedText", renderedTxt);
        req.setAttribute("templates", TemplateStyle.values());
        req.getRequestDispatcher("/WEB-INF/views/builder.jsp").forward(req, resp);
    }

    private ResumeBuilderProfile parseProfileFromRequest(HttpServletRequest req) throws IOException, ServletException {
        ResumeBuilderProfile p = new ResumeBuilderProfile();
        p.setFullName(orDefault(req.getParameter("fullName"), "Aarav Sharma"));
        p.setHeadline(orDefault(req.getParameter("headline"), "Senior Java Backend Engineer"));
        p.setEmail(orDefault(req.getParameter("email"), "aarav.sharma@example.com"));
        p.setPhone(orDefault(req.getParameter("phone"), "+91 98765 43210"));
        p.setLocation(orDefault(req.getParameter("location"), "Bengaluru, India"));
        p.setLinkedin(orDefault(req.getParameter("linkedin"), ""));
        p.setGithub(orDefault(req.getParameter("github"), ""));
        p.setSummary(orDefault(req.getParameter("summary"), ""));
        p.setAccentHex(orDefault(req.getParameter("accentHex"), "#3730a3"));
        p.setShowPhoto(!"false".equalsIgnoreCase(req.getParameter("showPhoto")));
        p.setIncludeBioData("true".equalsIgnoreCase(req.getParameter("includeBioData")));

        String templateRaw = req.getParameter("templateStyle");
        if (templateRaw != null && !templateRaw.isBlank()) {
            try {
                p.setTemplateStyle(TemplateStyle.valueOf(templateRaw.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ignored) {
                p.setTemplateStyle(TemplateStyle.EXECUTIVE_MODERN);
            }
        }

        p.setSkills(splitCommaList(req.getParameter("skills")));
        p.setLanguages(splitCommaList(req.getParameter("languages")));
        p.setCertifications(splitLineList(req.getParameter("certifications")));

        String role = orDefault(req.getParameter("expRole"), "Software Engineer");
        String company = orDefault(req.getParameter("expCompany"), "Enterprise Tech");
        String period = orDefault(req.getParameter("expPeriod"), "2022 - Present");
        List<String> bullets = splitLineList(req.getParameter("expBullets"));
        if (!bullets.isEmpty()) {
            p.setExperiences(List.of(new ExperienceEntry(role, company, period, bullets)));
        }

        String degree = req.getParameter("eduDegree");
        if (degree != null && !degree.isBlank()) {
            p.setEducation(List.of(new EducationEntry(
                degree.trim(),
                orDefault(req.getParameter("eduInstitution"), "University"),
                orDefault(req.getParameter("eduPeriod"), "2016 - 2020"),
                orDefault(req.getParameter("eduDetails"), "")
            )));
        }

        p.setDateOfBirth(orDefault(req.getParameter("dateOfBirth"), ""));
        p.setGender(orDefault(req.getParameter("gender"), ""));
        p.setMaritalStatus(orDefault(req.getParameter("maritalStatus"), ""));
        p.setNationality(orDefault(req.getParameter("nationality"), ""));
        p.setFatherName(orDefault(req.getParameter("fatherName"), ""));
        p.setPermanentAddress(orDefault(req.getParameter("permanentAddress"), ""));
        p.setHobbies(orDefault(req.getParameter("hobbies"), ""));
        p.setDeclarationPlace(orDefault(req.getParameter("declarationPlace"), p.getLocation()));
        p.setDeclarationDate(orDefault(req.getParameter("declarationDate"), ""));

        if (req.getContentType() != null && req.getContentType().toLowerCase(Locale.ROOT).startsWith("multipart/")) {
            Part photoPart = req.getPart("photoFile");
            if (photoPart != null && photoPart.getSize() > 0) {
                try (InputStream is = photoPart.getInputStream()) {
                    p.setPhotoDataUrl(builder.encodePhotoToDataUrl(is.readAllBytes(), photoPart.getContentType()));
                }
            }
        }
        return p;
    }

    private static List<String> splitCommaList(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .toList();
    }

    private static List<String> splitLineList(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split("\\r?\\n"))
            .map(s -> s.replaceFirst("^[-*•]\\s*", "").trim())
            .filter(s -> !s.isBlank())
            .toList();
    }

    private static String orDefault(String val, String fallback) {
        return (val != null && !val.isBlank()) ? val.trim() : fallback;
    }

    private static boolean isJsonRequest(HttpServletRequest req) {
        String path = req.getServletPath();
        String accept = req.getHeader("Accept");
        return (path != null && path.startsWith("/api/"))
            || (accept != null && accept.contains("application/json"));
    }
}
