package com.careerpulse;

import com.careerpulse.engine.ResumeDocumentBuilder;
import com.careerpulse.engine.ResumeRewriteAdvisor;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeBuilderProfile;
import com.careerpulse.model.ResumeBuilderProfile.EducationEntry;
import com.careerpulse.model.ResumeBuilderProfile.ExperienceEntry;
import com.careerpulse.model.ResumeBuilderProfile.TemplateStyle;
import com.careerpulse.model.ResumeDocument;
import com.careerpulse.util.DocumentTextExtractor;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * JUnit 5 test suite verifying pure Java 17 offline multi-format extraction,
 * Write-This-Instead rewrites, Cover Letter &amp; Interview Prep generation,
 * and Resume / Formal Bio-Data Builder with optional embedded person photos.
 */
class ResumeBuilderAndRewriteTest {

    @Test
    void extractsDocxOdtRtfAndHtmlOffline() throws Exception {
        byte[] docxBytes = createSingleEntryZip(
            "word/document.xml",
            "<w:document><w:body><w:p><w:r><w:t>Priya Nair Java 17 Backend Engineer</w:t></w:r></w:p></w:body></w:document>"
        );
        DocumentTextExtractor.ExtractionResult docx = DocumentTextExtractor.extract(docxBytes, "resume.docx");
        assertTrue(docx.text().contains("Priya Nair"));
        assertTrue(docx.detectedFormat().contains("DOCX"));

        byte[] odtBytes = createSingleEntryZip(
            "content.xml",
            "<office:text><text:p>Aarav Sharma Senior JDBC Architect</text:p></office:text>"
        );
        DocumentTextExtractor.ExtractionResult odt = DocumentTextExtractor.extract(odtBytes, "resume.odt");
        assertTrue(odt.text().contains("Aarav Sharma"));
        assertTrue(odt.detectedFormat().contains("ODT"));

        String rtf = "{\\rtf1\\ansi \\b Rohan Verma\\b0 \\par Experienced in Java 17 and SQL.}";
        DocumentTextExtractor.ExtractionResult rtfRes = DocumentTextExtractor.extract(
            rtf.getBytes(StandardCharsets.UTF_8), "cv.rtf"
        );
        assertTrue(rtfRes.text().contains("Rohan Verma"));
        assertTrue(rtfRes.text().contains("Java 17"));

        String html = "<html><head><script>alert(1)</script></head><body><h1>Maya Lin</h1><p>React &amp; Java</p></body></html>";
        DocumentTextExtractor.ExtractionResult htmlRes = DocumentTextExtractor.extract(
            html.getBytes(StandardCharsets.UTF_8), "cv.html"
        );
        assertTrue(htmlRes.text().contains("Maya Lin"));
        assertFalse(htmlRes.text().contains("alert(1)"));
    }

    @Test
    void generatesWriteThisInsteadUpgradesCoverLetterAndInterviewPrep() {
        ResumeRewriteAdvisor advisor = new ResumeRewriteAdvisor();
        ResumeDocument resume = new ResumeDocument(
            "SUMMARY\nJava developer.\nEXPERIENCE\n- Worked on backend APIs and helped with SQL bugs.",
            "draft.txt",
            "Plain Text"
        );
        JobDescriptionDocument jd = new JobDescriptionDocument(
            "Senior Java Engineer",
            "Required: Java, JDBC, Docker, Kubernetes, Maven",
            "Senior"
        );

        String summary = advisor.generateSuggestedSummary(resume, jd, List.of("java", "sql"), List.of("docker", "kubernetes"));
        assertTrue(summary.contains("Senior Java Engineer"));
        assertTrue(summary.contains("docker"));

        List<ResumeRewriteAdvisor.BulletUpgrade> upgrades = advisor.suggestBulletUpgrades(resume, "Senior Java Engineer");
        assertFalse(upgrades.isEmpty());
        assertTrue(upgrades.get(0).improved().startsWith("Engineered "));
        assertTrue(upgrades.get(0).improved().contains("%"));

        List<ResumeRewriteAdvisor.KeywordSuggestion> kwLines = advisor.generateKeywordInsertionLines(
            List.of("kubernetes", "docker"), "Senior Java Engineer"
        );
        assertEquals(2, kwLines.size());
        assertTrue(kwLines.get(0).readyLine().contains("kubernetes"));

        String coverLetter = advisor.generateCoverLetter("Aarav Sharma", "Senior Java Engineer", "FinScale", List.of("Java 17", "JDBC"), "Professional");
        assertTrue(coverLetter.contains("FinScale"));
        assertTrue(coverLetter.contains("Aarav Sharma"));

        List<ResumeRewriteAdvisor.InterviewQuestion> questions = advisor.generateInterviewPrep(
            "Senior Java Engineer", List.of("Java 17"), List.of("Kubernetes")
        );
        assertEquals(4, questions.size());
    }

    @Test
    void buildsFormalBioDataAndResumeWithEmbeddedPhotoAndXssEscaping() {
        ResumeDocumentBuilder builder = new ResumeDocumentBuilder();
        ResumeBuilderProfile profile = new ResumeBuilderProfile();
        profile.setFullName("Aarav <script>alert(1)</script> Sharma");
        profile.setHeadline("Senior Java Backend Engineer");
        profile.setEmail("aarav@example.com");
        profile.setSummary("Java 17 & JDBC Backend Engineer with 5+ years delivering resilient services and cutting p99 latency by 58%.");
        profile.setTemplateStyle(TemplateStyle.FORMAL_BIODATA);
        profile.setIncludeBioData(true);
        profile.setDateOfBirth("14 August 1998");
        profile.setNationality("Indian");
        profile.setFatherName("Rajesh Sharma");
        profile.setDeclarationPlace("Bengaluru");
        profile.setDeclarationDate("25 Nov 2026");
        profile.setSkills(List.of("Java 17", "JDBC", "MySQL", "Jakarta EE", "Maven", "JUnit 5"));
        profile.setExperiences(List.of(new ExperienceEntry(
            "Senior Backend Engineer",
            "FinScale Systems",
            "2022 - Present",
            List.of(
                "Architected Java 17 payment microservices processing 35,000+ TPS at 99.98% uptime.",
                "Optimized SQL queries reducing p99 latency by 58%."
            )
        )));
        profile.setEducation(List.of(new EducationEntry("B.Tech CS", "NIT", "2016 - 2020", "8.9 CGPA")));
        profile.setPhotoDataUrl(builder.encodePhotoToDataUrl(new byte[]{1, 2, 3, 4}, "image/png"));
        profile.setShowPhoto(true);

        String html = builder.renderHtmlDocument(profile);
        assertTrue(html.contains("CURRICULUM VITAE / BIO-DATA"));
        assertTrue(html.contains("data:image/png;base64,"));
        assertTrue(html.contains("Personal Details (Bio-Data)"));
        assertTrue(html.contains("Declaration"));
        assertFalse(html.contains("<script>alert(1)</script>"));

        String plain = builder.renderPlainText(profile);
        assertTrue(plain.contains("PERSONAL DETAILS (BIO-DATA)"));
        assertTrue(plain.contains("DECLARATION"));

        int score = builder.computeLiveAtsReadinessScore(profile);
        assertTrue(score >= 85, "Expected strong ATS readiness score, got " + score);
    }

    private static byte[] createSingleEntryZip(String entryName, String xmlContent) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry(entryName));
            zos.write(xmlContent.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        return baos.toByteArray();
    }
}
