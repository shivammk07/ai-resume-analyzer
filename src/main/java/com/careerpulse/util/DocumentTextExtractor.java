package com.careerpulse.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Pure Java 17 offline multi-format document text extractor requiring zero external API keys.
 * Supports DOCX, ODT, PPTX (via standard {@link ZipInputStream}), RTF, HTML, XML, JSON,
 * LaTeX, CSV, Markdown, plain text, and printable PDF text stream fallback.
 */
public final class DocumentTextExtractor {
    private static final Pattern XML_TAG = Pattern.compile("<[^>]+>");
    private static final Pattern HTML_SCRIPT_STYLE = Pattern.compile(
        "<(script|style)[^>]*>[\\s\\S]*?</\\1>",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PDF_TEXT_LITERAL = Pattern.compile("\\(([^()\\\\]{3,200})\\)");

    private DocumentTextExtractor() {
    }

    /**
     * Extraction result pairing normalized plain text with the detected ingestion method.
     *
     * @param text extracted UTF-8 plain text
     * @param detectedFormat human-readable source format description
     */
    public record ExtractionResult(String text, String detectedFormat) {
    }

    /**
     * Extracts plain text from uploaded resume bytes using the file extension and magic header.
     *
     * @param bytes raw file bytes
     * @param fileName submitted filename (used for extension hints)
     * @return extracted text and format label
     * @throws IOException if ZIP container extraction encounters corrupted input
     */
    public static ExtractionResult extract(byte[] bytes, String fileName) throws IOException {
        if (bytes == null || bytes.length == 0) {
            return new ExtractionResult("", "Empty Document");
        }
        String lower = fileName != null ? fileName.toLowerCase(Locale.ROOT) : "";

        if (lower.endsWith(".docx") || (isZipHeader(bytes) && !lower.endsWith(".odt") && !lower.endsWith(".pptx"))) {
            String xmlText = extractFromZipXml(bytes, "word/document.xml");
            if (!xmlText.isBlank()) {
                return new ExtractionResult(xmlText, "DOCX Word Document (Offline ZIP XML)");
            }
        }

        if (lower.endsWith(".odt")) {
            String xmlText = extractFromZipXml(bytes, "content.xml");
            if (!xmlText.isBlank()) {
                return new ExtractionResult(xmlText, "ODT OpenDocument (Offline ZIP XML)");
            }
        }

        if (lower.endsWith(".pptx")) {
            String slides = extractPptxSlides(bytes);
            if (!slides.isBlank()) {
                return new ExtractionResult(slides, "PPTX Presentation (Offline ZIP XML)");
            }
        }

        if (lower.endsWith(".pdf") || isPdfHeader(bytes)) {
            String pdfText = extractPdfPrintableText(bytes);
            return new ExtractionResult(pdfText, "PDF Document (Offline Stream Parser)");
        }

        String rawUtf8 = new String(bytes, StandardCharsets.UTF_8);

        if (lower.endsWith(".rtf") || rawUtf8.trim().startsWith("{\\rtf")) {
            return new ExtractionResult(stripRtf(rawUtf8), "RTF Rich Text (Offline)");
        }

        if (lower.endsWith(".html") || lower.endsWith(".htm") || lower.endsWith(".xml")) {
            return new ExtractionResult(stripHtml(rawUtf8), "HTML / XML Document (Offline)");
        }

        if (lower.endsWith(".json")) {
            String flattened = rawUtf8
                .replaceAll("[{}\\[\\]\"]", " ")
                .replaceAll("\\s*,\\s*", "\n")
                .replaceAll("[ \\t]{2,}", " ")
                .trim();
            return new ExtractionResult(flattened, "JSON Resume (Offline)");
        }

        return new ExtractionResult(rawUtf8.replace("\r\n", "\n").trim(), "Plain / Structured Text (UTF-8)");
    }

    private static boolean isZipHeader(byte[] bytes) {
        return bytes.length >= 4 && bytes[0] == 'P' && bytes[1] == 'K' && bytes[2] == 3 && bytes[3] == 4;
    }

    private static boolean isPdfHeader(byte[] bytes) {
        return bytes.length >= 4 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }

    private static String extractFromZipXml(byte[] zipBytes, String targetEntryName) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (targetEntryName.equalsIgnoreCase(entry.getName())) {
                    String xml = readEntryUtf8(zis);
                    return cleanXmlText(xml);
                }
            }
        }
        return "";
    }

    private static String extractPptxSlides(byte[] zipBytes) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName().toLowerCase(Locale.ROOT);
                if (name.startsWith("ppt/slides/slide") && name.endsWith(".xml")) {
                    sb.append(cleanXmlText(readEntryUtf8(zis))).append("\n\n");
                }
            }
        }
        return sb.toString().trim();
    }

    private static String readEntryUtf8(ZipInputStream zis) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int read;
        while ((read = zis.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
        return out.toString(StandardCharsets.UTF_8);
    }

    private static String cleanXmlText(String xml) {
        String withBreaks = xml
            .replaceAll("</(w:p|text:p|a:p|p|div|li|tr|h[1-6])>", "\n")
            .replaceAll("<(w:br|text:line-break|br)\\s*/?>", "\n");
        String stripped = XML_TAG.matcher(withBreaks).replaceAll(" ");
        return decodeXmlEntities(stripped)
            .replaceAll("[ \\t]{2,}", " ")
            .replaceAll("\\n{3,}", "\n\n")
            .trim();
    }

    private static String stripHtml(String html) {
        String withoutScripts = HTML_SCRIPT_STYLE.matcher(html).replaceAll(" ");
        return cleanXmlText(withoutScripts);
    }

    private static String stripRtf(String rtf) {
        String cleaned = rtf
            .replaceAll("\\\\par[d]?\\b", "\n")
            .replaceAll("\\\\line\\b", "\n")
            .replaceAll("\\\\tab\\b", " ")
            .replaceAll("\\\\'[0-9a-fA-F]{2}", " ")
            .replaceAll("\\\\[a-zA-Z]+-?\\d* ?", "")
            .replace("{", "")
            .replace("}", "");
        return cleaned
            .replaceAll("[ \\t]{2,}", " ")
            .replaceAll("\\n{3,}", "\n\n")
            .trim();
    }

    private static String extractPdfPrintableText(byte[] bytes) {
        String latin = new String(bytes, StandardCharsets.ISO_8859_1);
        StringBuilder sb = new StringBuilder();
        Matcher matcher = PDF_TEXT_LITERAL.matcher(latin);
        while (matcher.find()) {
            String fragment = matcher.group(1).trim();
            if (fragment.matches(".*[A-Za-z]{2,}.*")) {
                sb.append(fragment).append(' ');
            }
        }
        String extracted = sb.toString().replaceAll("\\s{2,}", " ").trim();
        if (extracted.length() >= 20) {
            return extracted;
        }
        // Fallback: printable ASCII runs
        return latin
            .replaceAll("[^\\x20-\\x7E\\r\\n]", " ")
            .replaceAll("[ \\t]{2,}", " ")
            .trim();
    }

    private static String decodeXmlEntities(String input) {
        return input
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&apos;", "'")
            .replace("&nbsp;", " ");
    }
}
