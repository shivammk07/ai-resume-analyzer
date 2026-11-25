export interface RedactionResult {
  redactedText: string;
  totalMaskedCount: number;
  categoryCounts: Record<string, number>;
}

const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_PATTERN = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/g;
const STREET_ADDRESS_PATTERN =
  /\b\d{1,5}\s+[A-Z][a-zA-Z0-9.\s]{1,30}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way)\b/gi;
const DOB_PATTERN =
  /\b(?:DOB|Date of Birth)\s*[:-]?\s*(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/gi;

function replaceAndCount(
  text: string,
  pattern: RegExp,
  replacement: string,
  key: string,
  counts: Record<string, number>
): string {
  let matched = 0;
  const updated = text.replace(pattern, () => {
    matched++;
    return replacement;
  });
  if (matched > 0) {
    counts[key] = matched;
  }
  return updated;
}

export function redactResumePii(input: string): RedactionResult {
  if (!input) {
    return { redactedText: '', totalMaskedCount: 0, categoryCounts: {} };
  }

  const categoryCounts: Record<string, number> = {};
  let working = input;
  working = replaceAndCount(working, SSN_PATTERN, '[REDACTED_SSN]', 'ssn', categoryCounts);
  working = replaceAndCount(working, EMAIL_PATTERN, '[REDACTED_EMAIL]', 'email', categoryCounts);
  working = replaceAndCount(working, PHONE_PATTERN, '[REDACTED_PHONE]', 'phone', categoryCounts);
  working = replaceAndCount(working, STREET_ADDRESS_PATTERN, '[REDACTED_ADDRESS]', 'address', categoryCounts);
  working = replaceAndCount(working, DOB_PATTERN, '[REDACTED_DOB]', 'dob', categoryCounts);

  const totalMaskedCount = Object.values(categoryCounts).reduce((sum, n) => sum + n, 0);
  return { redactedText: working, totalMaskedCount, categoryCounts };
}
