/**
 * CV Import Parser — extracts structured data from PDF/DOCX text
 * Uses pattern matching to identify common CV sections and populate form fields.
 */

import type { CVPersonalInfo, CVEducation, CVWorkExperience, CVLanguage, CVCertification, CVPublication, CVCustomSection, CVRecommendation, CVBuildOptions } from "./cvTemplateBuilder";

export interface ImportedCVData {
  personal: Partial<CVPersonalInfo>;
  educations: CVEducation[];
  workExperiences: CVWorkExperience[];
  languages: CVLanguage[];
  certifications: CVCertification[];
  publications?: CVPublication[];
  customSections?: CVCustomSection[];
  recommendations?: CVRecommendation[];
  buildOptions?: CVBuildOptions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Marker constants
//
// Two formats are supported:
//
// FORMAT A — URI annotation (current, reliable):
//   The metadata is embedded as an <a href="...PGCVMETA-{payload}-ENDPGCVMETA">
//   link in the HTML. PDFShift/Chrome converts this to a PDF URI annotation,
//   which is stored as a literal ASCII string in the PDF object structure.
//   A raw latin1 byte scan will find it directly.
//   Uses '-' as separator because ':' is octal-escaped by PDF as '\072'.
//
// FORMAT B — text layer (legacy):
//   PGCVMETA:{payload}:ENDPGCVMETA
//   Embedded as visible-but-tiny text. Only works if the PDF renderer stores
//   text as ASCII (not CIDFont glyph IDs). PDFShift/Chrome does NOT do this,
//   so this format only works for browser print-to-PDF fallbacks.
// ─────────────────────────────────────────────────────────────────────────────
const URI_PREFIX  = "PGCVMETA-";
const URI_SUFFIX  = "-ENDPGCVMETA";
const TEXT_PREFIX = "PGCVMETA:";
const TEXT_SUFFIX = ":ENDPGCVMETA";

// Separate annotation for profile avatar (too large for main PGCVMETA payload)
const AVATAR_PREFIX = "PGCVAVATAR-";
const AVATAR_SUFFIX = "-ENDPGCVAVATAR";

function normalizeRawBytes(text: string): string {
  // PDF literal strings encode some chars as octal escapes (\072 = ':').
  // Decode those first so the text-layer format still works for browser-print PDFs.
  let decoded = text.replace(/\\([0-7]{3})/g, (_, oct) =>
    String.fromCharCode(parseInt(oct, 8))
  );

  // Strip whitespace, null bytes, zero-width chars, and other control chars
  // that PDF extractors and print-to-PDF pipelines inject into long tokens.
  decoded = decoded.replace(
    /[\s\u0000-\u001F\u007F-\u009F\u00A0\u200B\u200C\u200D\u2060\uFEFF]+/g,
    ""
  );

  return decoded;
}

function extractPayload(text: string, prefix: string, suffix: string): string | null {
  const start = text.indexOf(prefix);
  if (start === -1) return null;
  // Search up to 20000 chars ahead — rich HTML descriptions + 80px avatar thumbnail
  // can push the payload to ~14000-16000 chars when both are present.
  const searchEnd = Math.min(text.length, start + prefix.length + 20000);
  const end = text.indexOf(suffix, start + prefix.length, searchEnd as any);
  if (end === -1) return null;
  // Keep only base64url-safe chars in the payload itself
  return text.slice(start + prefix.length, end).replace(/[^A-Za-z0-9+/=_-]/g, "");
}

function base64UrlToBase64(input: string): string {
  const normalized = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  return pad === 0 ? normalized : normalized + "=".repeat(4 - pad);
}

function decodeEmbeddedPayload(encoded: string): ImportedCVData | null {
  try {
    const normalized = base64UrlToBase64(encoded);
    const json = decodeURIComponent(escape(atob(normalized)));
    const parsed = JSON.parse(json);
    if (parsed?.generator !== "publicgermany-cv" || !parsed?.data) return null;
    return parsed.data as ImportedCVData;
  } catch {
    return null;
  }
}

export function extractEmbeddedCVDataFromText(text: string): ImportedCVData | null {
  if (!text) return null;

  const normalized = normalizeRawBytes(text);

  // ── Strategy 1: URI annotation format (PGCVMETA-...-ENDPGCVMETA) ──────────
  // This is the primary format for PDFShift-generated PDFs.
  // The href URL appears as literal ASCII in the PDF URI annotation object.
  // After normalizeRawBytes, the URL looks like:
  //   https://cvpgmapp/?d=PGCVMETA-{encoded}-ENDPGCVMETA
  // (dots and ? stripped, but PGCVMETA- prefix and -ENDPGCVMETA suffix intact)
  const uriPayload = extractPayload(normalized, URI_PREFIX, URI_SUFFIX);
  if (uriPayload) {
    const decoded = decodeEmbeddedPayload(uriPayload);
    if (decoded) {
      // Also try to extract the avatar from its separate annotation
      extractAndMergeAvatar(normalized, decoded);
      return decoded;
    }
  }

  // ── Strategy 2: Text layer format (PGCVMETA:...:ENDPGCVMETA) ─────────────
  // Fallback for browser print-to-PDF and any future pdfjs-based extraction.
  // After octal decode, ':' characters are restored correctly.
  const textPayload = extractPayload(normalized, TEXT_PREFIX, TEXT_SUFFIX);
  if (textPayload) {
    const decoded = decodeEmbeddedPayload(textPayload);
    if (decoded) {
      extractAndMergeAvatar(normalized, decoded);
      return decoded;
    }
  }

  // ── Strategy 3: Loose scan (no end marker) — backward compat ─────────────
  // For very old PDFs that only had a start marker with no end marker.
  const looseStart = normalized.indexOf(TEXT_PREFIX);
  if (looseStart === -1) return null;

  const after = normalized.slice(looseStart + TEXT_PREFIX.length);
  let payload = "";
  let invalidRun = 0;
  for (let i = 0; i < after.length; i++) {
    const ch = after[i];
    if (/[A-Za-z0-9+/=_-]/.test(ch)) {
      payload += ch;
      invalidRun = 0;
    } else {
      if (++invalidRun >= 25) break;
    }
  }

  if (payload) {
    const decoded = decodeEmbeddedPayload(payload);
    if (decoded) {
      extractAndMergeAvatar(normalized, decoded);
      return decoded;
    }
  }
  return null;
}

// ── Avatar extraction ─────────────────────────────────────────────────────────
// Avatar is stored in a separate PGCVAVATAR-...-ENDPGCVAVATAR URI annotation
// so it doesn't inflate the main PGCVMETA payload.
// The avatar payload is a base64url-encoded UTF-8 string of the data URI
// (e.g. "data:image/jpeg;base64,/9j/...").
function extractAndMergeAvatar(normalized: string, data: ImportedCVData): void {
  try {
    const avatarPayload = extractPayload(normalized, AVATAR_PREFIX, AVATAR_SUFFIX);
    if (!avatarPayload) return;
    const b64 = base64UrlToBase64(avatarPayload);
    // Decode bytes back to the original data URI string
    const binaryStr = atob(b64);
    // The binary string IS the original data URI (UTF-8 encoded, but data URIs are ASCII-safe)
    const avatarDataUri = binaryStr;
    if (avatarDataUri.startsWith("data:image")) {
      if (!data.personal) data.personal = {} as any;
      (data.personal as any).avatar_url = avatarDataUri;
    }
  } catch {
    // Avatar extraction failure is non-fatal — rest of CV data is still valid
  }
}

export async function extractEmbeddedCVDataFromPDF(file: File): Promise<ImportedCVData | null> {
  const arrayBuffer = await file.arrayBuffer();

  // ── Raw PDF byte scan ─────────────────────────────────────────────────────
  // PDFShift preserves <a href> links as PDF URI annotations stored as
  // literal ASCII strings — findable by raw latin1 scan.
  // Also handles browser print-to-PDF which sometimes embeds readable text.
  const rawPdfText = new TextDecoder("latin1").decode(new Uint8Array(arrayBuffer));
  const fromRawScan = extractEmbeddedCVDataFromText(rawPdfText);
  if (fromRawScan) return fromRawScan;

  return null;
}