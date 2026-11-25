package com.careerpulse.engine;

import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.JobDescriptionDocument;
import com.careerpulse.model.ResumeDocument;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;

/**
 * Strictly optional Gemini API enricher using Java 17's built-in {@link HttpClient}.
 * Reads GEMINI_API_KEY exclusively from server environment variables and only receives
 * PII-redacted text. Never alters deterministic baseline scores.
 */
public class GeminiHttpAiEnricher implements OptionalAiEnricher {
    private static final String MODEL_NAME = "gemini-4-hydrogen";
    private final HttpClient httpClient;

    public GeminiHttpAiEnricher() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();
    }

    @Override
    public boolean isConfigured() {
        String key = System.getenv("GEMINI_API_KEY");
        return key != null && !key.isBlank() && !"MY_GEMINI_API_KEY".equals(key.trim());
    }

    @Override
    public Optional<String> generateOptionalAdvice(
            ResumeDocument redactedResume,
            JobDescriptionDocument jobDescription,
            AnalysisReport baselineReport) {
        if (!isConfigured()) {
            return Optional.empty();
        }
        String apiKey = System.getenv("GEMINI_API_KEY").trim();
        try {
            String prompt = String.format(
                "In 3 concise bullet points, suggest targeted resume improvements for role '%s' "
                    + "given deterministic ATS baseline %d/100 and missing keywords %s.\n\nREDACTED RESUME:\n%s",
                jobDescription.getTargetTitle(),
                baselineReport.getOverallScore(),
                baselineReport.getMissingKeywords(),
                redactedResume.getNormalizedContent().substring(0, Math.min(3000, redactedResume.getNormalizedContent().length()))
            );

            JsonObject textPart = new JsonObject();
            textPart.addProperty("text", prompt);
            JsonArray parts = new JsonArray();
            parts.add(textPart);
            JsonObject content = new JsonObject();
            content.add("parts", parts);
            JsonArray contents = new JsonArray();
            contents.add(content);
            JsonObject body = new JsonObject();
            body.add("contents", contents);

            URI endpoint = URI.create(
                "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent"
            );

            HttpRequest request = HttpRequest.newBuilder(endpoint)
                .timeout(Duration.ofSeconds(12))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .header("User-Agent", "aistudio-build")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return Optional.of("Optional AI enrichment unavailable (HTTP " + response.statusCode()
                    + "). Deterministic local score remains unaffected.");
            }

            JsonObject parsed = JsonParser.parseString(response.body()).getAsJsonObject();
            String text = parsed.getAsJsonArray("candidates")
                .get(0).getAsJsonObject()
                .getAsJsonObject("content")
                .getAsJsonArray("parts")
                .get(0).getAsJsonObject()
                .get("text").getAsString();

            return Optional.ofNullable(text).map(String::trim);
        } catch (Exception ex) {
            return Optional.of("Optional AI enrichment skipped (" + ex.getClass().getSimpleName()
                + "). Deterministic local audit completed cleanly.");
        }
    }
}
