import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import { extractText } from 'unpdf';

export interface ParsedDocumentResult {
  extractedText: string;
  detectedFormat: string;
  extractionMethod: string;
  warnings?: string[];
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&bull;/gi, '•')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)));
}

function cleanRtfText(raw: string): string {
  let text = raw
    .replace(/\{\\\*\\[^}]+\}/g, ' ')
    .replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|pict|object|header|footer)[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, ' ')
    .replace(/\\par[d]?\b/gi, '\n')
    .replace(/\\line\b/gi, '\n')
    .replace(/\\tab\b/gi, '  ')
    .replace(/\\bullet\b/gi, '• ')
    .replace(/\\'([0-9a-fA-F]{2})/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u(-?\d+)\??/g, (_m, num) => {
      const code = Number(num);
      return String.fromCharCode(code < 0 ? code + 65536 : code);
    })
    .replace(/\\[a-zA-Z]+-?\d*\s?/g, ' ')
    .replace(/[{}]/g, ' ');

  return normalizeExtractedText(text);
}

function cleanHtmlOrXmlText(raw: string): string {
  const withoutScripts = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|br|section|article|header|footer|w:p|text:p|text:h|a:p)>/gi, '\n')
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, ' ');
  return normalizeExtractedText(decodeHtmlEntities(withoutScripts));
}

function cleanLatexText(raw: string): string {
  const cleaned = raw
    .replace(/%[^\n]*/g, '')
    .replace(/\\(?:documentclass|usepackage|pagestyle|geometry|definecolor|hypersetup|setlength)[^\n]*/g, '')
    .replace(/\\(?:item)\b/g, '\n• ')
    .replace(/\\(?:section|subsection|subsubsection)\*?\{([^}]*)\}/g, '\n$1\n')
    .replace(/\\(?:textbf|textit|emph|underline|href\{[^}]*\})\{([^}]*)\}/g, '$1')
    .replace(/\\\\/g, '\n')
    .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?/g, ' ')
    .replace(/[{}]/g, ' ');
  return normalizeExtractedText(cleaned);
}

function cleanJsonResume(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    const lines: string[] = [];
    const walk = (node: unknown, prefix = '') => {
      if (node === null || node === undefined) return;
      if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
        const str = String(node).trim();
        if (str) lines.push(prefix ? `${prefix}: ${str}` : str);
      } else if (Array.isArray(node)) {
        for (const item of node) {
          if (typeof item === 'string') {
            lines.push(`• ${item.trim()}`);
          } else {
            walk(item);
          }
        }
      } else if (typeof node === 'object') {
        for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
          if (typeof val === 'object' && val !== null) {
            lines.push(key.replace(/([A-Z])/g, ' $1').trim());
            walk(val);
          } else {
            walk(val, key);
          }
        }
      }
    };
    walk(parsed);
    return normalizeExtractedText(lines.join('\n'));
  } catch {
    return normalizeExtractedText(raw);
  }
}

export function normalizeExtractedText(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractReadableRunsFromBinary(buffer: Buffer): string {
  // Attempt UTF-16LE extraction (common in legacy Microsoft Word .doc files)
  const utf16Runs: string[] = [];
  const utf16Str = buffer.toString('utf16le');
  const utf16Matches = utf16Str.match(/[A-Za-z0-9@.,:;!?()\-/'"+%$#&*\n\r\t ]{12,}/g) || [];
  for (const m of utf16Matches) {
    const trimmed = m.trim();
    if (trimmed.length >= 12 && /[a-zA-Z]{3,}/.test(trimmed)) {
      utf16Runs.push(trimmed);
    }
  }

  // Attempt Latin-1 / ASCII extraction
  const asciiStr = buffer.toString('latin1');
  const asciiMatches = asciiStr.match(/[A-Za-z0-9@.,:;!?()\-/'"+%$#&*\n\r\t ]{12,}/g) || [];
  const asciiRuns: string[] = [];
  for (const m of asciiMatches) {
    const trimmed = m.trim();
    if (
      trimmed.length >= 12 &&
      /[a-zA-Z]{3,}/.test(trimmed) &&
      !trimmed.includes('Microsoft Word') &&
      !trimmed.includes('Root Entry') &&
      !trimmed.includes('WordDocument')
    ) {
      asciiRuns.push(trimmed);
    }
  }

  const best = utf16Runs.join('\n').length > asciiRuns.join('\n').length ? utf16Runs : asciiRuns;
  return normalizeExtractedText(best.join('\n'));
}

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    const text = Array.isArray(result.text) ? result.text.join('\n') : String(result.text || '');
    const normalized = normalizeExtractedText(text);
    if (normalized.length >= 15) {
      return normalized;
    }
  } catch (err) {
    console.warn('unpdf extraction warning:', err);
  }

  // Fallback: extract text tokens from uncompressed PDF streams (BT ... ET / Tj / TJ)
  try {
    const latin = buffer.toString('latin1');
    const chunks: string[] = [];
    const literalRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
    let match: RegExpExecArray | null;
    while ((match = literalRegex.exec(latin)) !== null) {
      const piece = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\n')
        .replace(/\\t/g, ' ')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      if (piece.trim()) chunks.push(piece);
    }
    const joined = normalizeExtractedText(chunks.join(' '));
    if (joined.length >= 15) return joined;
  } catch {
    // ignore fallback failure
  }

  return '';
}

function extractTextFromZipContainer(buffer: Buffer, ext: string): string {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const collected: string[] = [];

    // Prioritize standard XML document payloads (.docx, .odt, .pptx, .epub)
    const prioritized = entries.filter((e) => {
      const name = e.entryName.toLowerCase();
      return (
        name === 'word/document.xml' ||
        name === 'content.xml' ||
        /^ppt\/slides\/slide\d+\.xml$/.test(name) ||
        name.endsWith('.xhtml') ||
        name.endsWith('.html') ||
        name.endsWith('.txt') ||
        name.endsWith('.md')
      );
    });

    const targets = prioritized.length > 0 ? prioritized : entries.filter((e) => e.entryName.endsWith('.xml'));
    for (const entry of targets.slice(0, 25)) {
      if (entry.isDirectory) continue;
      const raw = entry.getData().toString('utf-8');
      const cleaned =
        entry.entryName.endsWith('.txt') || entry.entryName.endsWith('.md')
          ? normalizeExtractedText(raw)
          : cleanHtmlOrXmlText(raw);
      if (cleaned.length > 5) {
        collected.push(cleaned);
      }
    }

    if (collected.length > 0) {
      return normalizeExtractedText(collected.join('\n\n'));
    }
  } catch (err) {
    console.warn(`ZIP container extraction (${ext}) warning:`, err);
  }
  return '';
}

async function runOfflineImageOcr(buffer: Buffer): Promise<string> {
  try {
    const Tesseract = await import('tesseract.js');
    const ocrPromise = Tesseract.recognize(buffer, 'eng');
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 22000));
    const result = await Promise.race([ocrPromise, timeoutPromise]);
    if (result && typeof result === 'object' && 'data' in result && result.data?.text) {
      return normalizeExtractedText(result.data.text);
    }
  } catch (err) {
    console.warn('Offline Tesseract OCR warning:', err);
  }
  return '';
}

export async function extractResumeFromAnyFormat(options: {
  resumeText?: string;
  resumeBase64?: string;
  resumeMimeType?: string;
  fileName?: string;
}): Promise<ParsedDocumentResult> {
  const { resumeText, resumeBase64, resumeMimeType, fileName } = options;
  const ext = (fileName?.split('.').pop() || '').toLowerCase();
  const mime = (resumeMimeType || '').toLowerCase();

  // Direct plain text (when no binary file uploaded or text already extracted client-side)
  if (resumeText && resumeText.trim().length > 0 && !resumeBase64) {
    return {
      extractedText: normalizeExtractedText(resumeText).slice(0, 40000),
      detectedFormat: fileName ? `Text Document (${ext.toUpperCase() || 'TXT'})` : 'Direct Text Input',
      extractionMethod: 'Direct Text Layer',
    };
  }

  if (!resumeBase64) {
    return {
      extractedText: normalizeExtractedText(resumeText || ''),
      detectedFormat: 'Text Input',
      extractionMethod: 'Direct Input',
    };
  }

  const buffer = Buffer.from(resumeBase64, 'base64');
  const isPdfMagic = buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF';
  const isZipMagic = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;

  // 1. PDF Documents (.pdf or %PDF magic bytes)
  if (ext === 'pdf' || mime === 'application/pdf' || isPdfMagic) {
    const pdfText = await extractTextFromPdfBuffer(buffer);
    if (pdfText.length >= 15) {
      return {
        extractedText: pdfText.slice(0, 40000),
        detectedFormat: 'PDF Document (.pdf)',
        extractionMethod: 'Offline PDF Text Parser (unpdf)',
      };
    }
    if (resumeText && resumeText.trim().length >= 15) {
      return {
        extractedText: normalizeExtractedText(resumeText).slice(0, 40000),
        detectedFormat: 'PDF Document (.pdf)',
        extractionMethod: 'Fallback Text Layer',
      };
    }
    return {
      extractedText: '',
      detectedFormat: 'Scanned PDF (Image-Only)',
      extractionMethod: 'Offline PDF Parser',
      warnings: [
        'This PDF appears to be a scanned image with no selectable text layer. Export it as an image (PNG/JPG) for offline OCR or copy/paste the text directly.',
      ],
    };
  }

  // 2. Modern Word Document (.docx)
  if (ext === 'docx' || mime.includes('officedocument.wordprocessingml.document')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const cleaned = normalizeExtractedText(result.value || '');
      if (cleaned.length >= 15) {
        return {
          extractedText: cleaned.slice(0, 40000),
          detectedFormat: 'Word Document (.docx)',
          extractionMethod: 'Offline DOCX Parser (Mammoth)',
        };
      }
    } catch (err) {
      console.warn('Mammoth DOCX warning, trying ZIP XML fallback:', err);
    }

    const zipText = extractTextFromZipContainer(buffer, 'docx');
    if (zipText.length >= 15) {
      return {
        extractedText: zipText.slice(0, 40000),
        detectedFormat: 'Word Document (.docx)',
        extractionMethod: 'Offline OOXML Container Parser',
      };
    }
  }

  // 3. OpenDocument / PowerPoint / EPUB / Pages / ZIP-based documents (.odt, .pptx, .ods, .epub, .zip)
  if (['odt', 'pptx', 'ods', 'epub', 'pages', 'zip'].includes(ext) || isZipMagic) {
    const zipText = extractTextFromZipContainer(buffer, ext || 'zip');
    if (zipText.length >= 15) {
      return {
        extractedText: zipText.slice(0, 40000),
        detectedFormat: `Document Archive (.${ext || 'zip'})`,
        extractionMethod: 'Offline XML/ZIP Container Parser',
      };
    }
  }

  // 4. RTF Documents
  if (ext === 'rtf' || mime.includes('rtf') || buffer.subarray(0, 5).toString('ascii') === '{\\rtf') {
    const cleaned = cleanRtfText(buffer.toString('utf-8'));
    if (cleaned.length >= 15) {
      return {
        extractedText: cleaned.slice(0, 40000),
        detectedFormat: 'Rich Text Document (.rtf)',
        extractionMethod: 'Offline RTF Parser',
      };
    }
  }

  // 5. HTML / XML / SVG
  if (['html', 'htm', 'xhtml', 'xml'].includes(ext) || mime.includes('html') || mime.includes('xml')) {
    const cleaned = cleanHtmlOrXmlText(buffer.toString('utf-8'));
    if (cleaned.length >= 15) {
      return {
        extractedText: cleaned.slice(0, 40000),
        detectedFormat: `Structured Markup (.${ext || 'html'})`,
        extractionMethod: 'Offline HTML/XML Parser',
      };
    }
  }

  // 6. JSON Resume
  if (ext === 'json' || mime.includes('json')) {
    const cleaned = cleanJsonResume(buffer.toString('utf-8'));
    if (cleaned.length >= 15) {
      return {
        extractedText: cleaned.slice(0, 40000),
        detectedFormat: 'JSON Resume (.json)',
        extractionMethod: 'Offline JSON Parser',
      };
    }
  }

  // 7. LaTeX (.tex)
  if (ext === 'tex' || mime.includes('x-tex')) {
    const cleaned = cleanLatexText(buffer.toString('utf-8'));
    if (cleaned.length >= 15) {
      return {
        extractedText: cleaned.slice(0, 40000),
        detectedFormat: 'LaTeX Resume (.tex)',
        extractionMethod: 'Offline LaTeX Parser',
      };
    }
  }

  // 8. Plain Text, Markdown, CSV, YAML
  if (
    ['txt', 'md', 'markdown', 'csv', 'tsv', 'yaml', 'yml', 'log'].includes(ext) ||
    mime.startsWith('text/')
  ) {
    const cleaned = normalizeExtractedText(buffer.toString('utf-8'));
    if (cleaned.length >= 15) {
      return {
        extractedText: cleaned.slice(0, 40000),
        detectedFormat: `Text Document (.${ext || 'txt'})`,
        extractionMethod: 'Offline UTF-8 Text Parser',
      };
    }
  }

  // 9. Images / Scanned Resume Photos (.png, .jpg, .jpeg, .webp, .bmp, .gif, .tiff) -> Offline OCR!
  if (
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tif', 'tiff', 'heic', 'heif'].includes(ext)
  ) {
    if (resumeText && resumeText.trim().length >= 20) {
      return {
        extractedText: normalizeExtractedText(resumeText).slice(0, 40000),
        detectedFormat: `Resume Image (.${ext || 'img'})`,
        extractionMethod: 'Client OCR / Text Layer',
      };
    }
    const ocrText = await runOfflineImageOcr(buffer);
    if (ocrText.length >= 15) {
      return {
        extractedText: ocrText.slice(0, 40000),
        detectedFormat: `Scanned Image (.${(ext || 'image').toUpperCase()})`,
        extractionMethod: 'Offline Tesseract OCR',
      };
    }
    return {
      extractedText: '',
      detectedFormat: `Image File (.${ext || 'img'})`,
      extractionMethod: 'Offline Tesseract OCR',
      warnings: [
        'Offline OCR could not read clear text from this image. Try a sharper high-contrast screenshot/photo, upload a PDF/DOCX, or paste the resume text.',
      ],
    };
  }

  // 10. Legacy Word (.doc) & Universal Binary Fallback
  const binaryRuns = extractReadableRunsFromBinary(buffer);
  if (binaryRuns.length >= 20) {
    return {
      extractedText: binaryRuns.slice(0, 40000),
      detectedFormat: ext === 'doc' ? 'Legacy Word Document (.doc)' : `Document (.${ext || 'file'})`,
      extractionMethod: 'Offline Binary Text Extractor',
    };
  }

  // Final UTF-8 fallback
  const utf8Fallback = normalizeExtractedText(buffer.toString('utf-8'));
  return {
    extractedText: utf8Fallback.slice(0, 40000),
    detectedFormat: `Document (.${ext || 'file'})`,
    extractionMethod: 'Offline Universal Fallback',
  };
}
