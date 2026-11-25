package com.careerpulse.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;

import java.io.IOException;
import java.time.Instant;

/**
 * Centralized Gson factory configured with a null-safe ISO-8601 {@link Instant}
 * {@link TypeAdapter}. Prevents Java 17 strong encapsulation
 * ({@code InaccessibleObjectException}) when serializing or deserializing domain
 * models containing {@code java.time.Instant} fields.
 *
 * @author Shivam Kumar (Team Moshdi)
 */
public final class JsonSupport {
    private static final TypeAdapter<Instant> INSTANT_ADAPTER = new TypeAdapter<>() {
        @Override
        public void write(JsonWriter out, Instant value) throws IOException {
            if (value == null) {
                out.nullValue();
            } else {
                out.value(value.toString());
            }
        }

        @Override
        public Instant read(JsonReader in) throws IOException {
            if (in.peek() == JsonToken.NULL) {
                in.nextNull();
                return null;
            }
            String text = in.nextString();
            return text == null || text.isBlank() ? null : Instant.parse(text);
        }
    };

    private static final Gson SHARED_GSON = new GsonBuilder()
        .registerTypeAdapter(Instant.class, INSTANT_ADAPTER)
        .create();

    private JsonSupport() {
        // Utility class
    }

    /**
     * Returns the shared Java 17-safe {@link Gson} instance.
     *
     * @return configured thread-safe {@link Gson} instance
     */
    public static Gson gson() {
        return SHARED_GSON;
    }
}
