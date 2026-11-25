package com.careerpulse.model;

import java.util.List;
import java.util.Map;

/**
 * Core contract implemented by all text-bearing documents evaluated by the CareerPulse engine.
 */
public interface Analyzable {
    String getRawContent();

    String getNormalizedContent();

    int getWordCount();

    List<String> getLines();

    Map<String, Integer> getTokenFrequencies();
}
