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
  const end = text.slice(0, searchEnd).indexOf(suffix, start + prefix.length);
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

// ─────────────────────────────────────────────────────────────────────────────
// JSON import (template round-trip)
//
// Parses the downloadable template JSON (or the app's own 'Download JSON'
// backup) and normalizes it so values land in the right form boxes even if
// the file contains slightly wrong types (numbers as strings, objects as
// arrays, …). Returns null when the JSON is invalid or doesn't look like a CV.
// ─────────────────────────────────────────────────────────────────────────────
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  return typeof v === "string" ? v : String(v);
}

function bool(v: unknown): boolean | undefined {
  if (v == null) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(s)) return true;
    if (["false", "no", "n", "0"].includes(s)) return false;
    return undefined;
  }
  return v === true || v === 1;
}

function num(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normArray(v: unknown): Record<string, unknown>[] {
  // Forgiving: a single object (array brackets left out) becomes [obj]
  if (isObj(v)) return [v];
  if (!Array.isArray(v)) return [];
  return v.filter(isObj);
}

function normSection<T>(v: unknown, map: (raw: Record<string, unknown>) => T): T[] {
  return normArray(v).map(map);
}

export function parseImportedCVJson(text: string): ImportedCVData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObj(parsed)) return null;

  const personalRaw = isObj(parsed.personal) ? parsed.personal : undefined;
  const personal: Partial<CVPersonalInfo> = personalRaw
    ? {
        full_name: str(personalRaw.full_name),
        email: str(personalRaw.email),
        phone: str(personalRaw.phone),
        address: str(personalRaw.address),
        linkedin_url: str(personalRaw.linkedin_url),
        avatar_url: str(personalRaw.avatar_url),
        signature_url: str(personalRaw.signature_url),
        passport_number: str(personalRaw.passport_number),
        date_of_birth: str(personalRaw.date_of_birth),
        place_of_birth: str(personalRaw.place_of_birth),
        nationality: str(personalRaw.nationality),
        gender: str(personalRaw.gender),
      }
    : {};

  // Refuse files that don't resemble a PublicGermany CV at all
  const hasAnyContent =
    Object.keys(personal).length > 0 ||
    Array.isArray(parsed.educations) ||
    Array.isArray(parsed.workExperiences) ||
    Array.isArray(parsed.languages) ||
    Array.isArray(parsed.certifications) ||
    Array.isArray(parsed.publications) ||
    Array.isArray(parsed.customSections) ||
    Array.isArray(parsed.recommendations);
  if (!hasAnyContent) return null;

  const educations = normSection(parsed.educations, e => ({
    ...e,
    degree_title: str(e.degree_title) ?? "",
    field_of_study: str(e.field_of_study) ?? "",
    institution: str(e.institution) ?? "",
    city: str(e.city) ?? "",
    country: str(e.country) ?? "",
    start_date: str(e.start_date) ?? "",
    end_date: str(e.end_date) ?? "",
    start_year: num(e.start_year),
    end_year: num(e.end_year),
    final_grade: str(e.final_grade) ?? "",
    max_scale: num(e.max_scale),
    total_credits: num(e.total_credits),
    credit_system: str(e.credit_system) ?? "",
    thesis_title: str(e.thesis_title) ?? "",
    website_url: str(e.website_url) ?? "",
  })) as CVEducation[];

  const workExperiences = normSection(parsed.workExperiences, w => ({
    ...w,
    job_title: str(w.job_title) ?? "",
    organisation: str(w.organisation) ?? "",
    city: str(w.city) ?? "",
    country: str(w.country) ?? "",
    city_country: str(w.city_country) ?? "",
    start_date: str(w.start_date) ?? "",
    end_date: str(w.end_date) ?? "",
    is_current: bool(w.is_current) ?? false,
  })) as CVWorkExperience[];

  const languages = normSection(parsed.languages, l => ({
    ...l,
    language_name: str(l.language_name) ?? "",
    mother_tongue: bool(l.mother_tongue) ?? false,
    listening: str(l.listening) ?? "",
    reading: str(l.reading) ?? "",
    writing: str(l.writing) ?? "",
    speaking: str(l.speaking) ?? "",
  })) as CVLanguage[];

  const certifications = normSection(parsed.certifications, c => ({
    ...c,
    title: str(c.title) ?? "",
    institution: str(c.institution) ?? "",
    date: str(c.date) ?? "",
  })) as CVCertification[];

  const publications = normSection(parsed.publications, p => ({
    ...p,
    title: str(p.title) ?? "",
    year: str(p.year) ?? "",
    journal: str(p.journal) ?? "",
    doi_url: str(p.doi_url) ?? "",
  })) as CVPublication[];

  const customSections = normSection(parsed.customSections, s => ({
    ...s,
    title: str(s.title) ?? "",
    items: normArray(s.items).map(item => ({
      ...item,
      label: str(item.label) ?? "",
    })),
  })) as CVCustomSection[];

  const recommendations = normSection(parsed.recommendations, r => ({
    ...r,
    name: str(r.name) ?? "",
    designation: str(r.designation) ?? "",
    department: str(r.department) ?? "",
    institution: str(r.institution) ?? "",
    email: str(r.email) ?? "",
    contact: str(r.contact) ?? "",
    lor_link: str(r.lor_link) ?? "",
  })) as CVRecommendation[];

  let buildOptions: CVBuildOptions | undefined;
  if (isObj(parsed.buildOptions)) {
    const raw = parsed.buildOptions;
    const sectionOrder = Array.isArray(raw.sectionOrder)
      ? raw.sectionOrder.filter((k): k is string => typeof k === "string")
      : undefined;
    buildOptions = {
      headerBgColor: str(raw.headerBgColor) || undefined,
      density: str(raw.density) as CVBuildOptions["density"] | undefined,
      sectionOrder,
    };
  }

  return {
    personal,
    educations,
    workExperiences,
    languages,
    certifications,
    publications,
    customSections,
    recommendations,
    buildOptions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown template — plain-text format
//
// The downloadable template is plain Markdown: sections are `## Heading`,
// entries are `### Entry N`, fields are `- Label: value` lines. Markdown is
// plain text, so it carries no macros or scripts (unlike docx), and the filled
// file is easy to review before uploading.
//
// The parser below is deliberately forgiving: bold labels, stray whitespace,
// yes/no answers, comma-separated subjects, indented bullet descriptions,
// n/a placeholders and single-object-vs-array mistakes are all normalized.
// ─────────────────────────────────────────────────────────────────────────────

export function buildCVMarkdownTemplate(): string {
  return `# PublicGermany Europass CV Template

> HOW TO USE THIS TEMPLATE
> 1. Replace each value after the colon with your details. Keep the labels exactly as written.
> 2. Leave a field blank (nothing after the colon) if you don't have the information — blank fields are hidden in the CV.
> 3. To add more entries (e.g. a second degree), copy the whole block from \"### Entry\" to just before the next \"### Entry\" and fill it in.
> 4. Dates: use Mon YYYY (e.g. Oct 2022) or a plain year (e.g. 2022). Date of birth: 15 Aug 1998 or YYYY-MM-DD.
> 5. Final Grade: your CGPA / GPA / percentage (e.g. 8.33). Max Scale: the maximum possible score (10, 100, etc.).
> 6. Language levels must be one of: A1, A2, B1, B2, C1, C2. Mother Tongue: write yes for native languages.
> 7. Current Job: write yes if the job is still ongoing, otherwise no (or leave blank).
> 8. Descriptions: a single short line, or several lines each starting with two spaces and a dash (  - ).
> 9. Key Subjects: write them comma-separated on one line.
> 10. After filling, upload this file back in the CV Generator: Personal step -> Import Existing CV -> Upload CV.

## Personal Information

- Full Name:
- Email:
- Phone:
- Address:
- LinkedIn URL:
- Passport Number:
- Date of Birth:
- Place of Birth:
- Nationality:
- Gender:

## Education

### Entry 1

- Degree:
- Specialization:
- Institution:
- City:
- Country:
- Start Date:
- End Date:
- Final Grade:
- Max Scale:
- Credits:
- Credit System:
- Thesis Title:
- Website URL:
- Key Subjects:
- Description:

## Work Experience

### Entry 1

- Job Title:
- Organisation:
- City:
- Country:
- Start Date:
- End Date:
- Current Job:

- Description:

## Languages

### Entry 1

- Language:
- Mother Tongue:
- Listening:
- Reading:
- Writing:
- Speaking:

## Certifications

### Entry 1

- Title:
- Institution:
- Date:
- Description:

## Publications

### Entry 1

- Title:
- Year:
- Journal:
- DOI URL:

## Custom Sections

### Entry 1

- Section Title:
- Item Label:
- Item Description:

## Recommendations

### Entry 1

- Name:
- Designation:
- Department:
- Institution:
- Email:
- Contact:
- LOR Link:

## Style (optional)

- Header Color:
- Density:
`;
}

type SectionType =
  | "personal"
  | "educations"
  | "workExperiences"
  | "languages"
  | "certifications"
  | "publications"
  | "customSections"
  | "recommendations"
  | "style";

// Substring keywords used for markdown headings (## Education, ### Contact, …)
const SECTION_KEYWORDS: Array<[SectionType, string[]]> = [
  ["personal", ["personal", "contact", "profile", "about"]],
  ["educations", ["education", "qualification", "degree", "study", "academic background"]],
  ["workExperiences", ["work", "experience", "employment", "career", "job", "professional history"]],
  ["languages", ["language"]],
  ["certifications", ["certif", "course", "training", "license"]],
  ["publications", ["publication", "research", "paper"]],
  ["customSections", ["custom", "additional", "skill", "project", "award", "achievement", "hobby", "interest", "volunteer", "extracurricular"]],
  ["recommendations", ["recommend", "referee", "reference"]],
  ["style", ["style", "appearance"]],
];

// Exact names for plain-text section lines (no markdown heading), e.g. "EDUCATION"
const SECTION_EXACT: Array<[SectionType, string[]]> = [
  ["personal", ["personal information", "personal details", "personal", "contact information", "contact details", "contact", "profile", "about me"]],
  ["educations", ["education", "educational background", "academic background", "academic qualifications", "qualifications", "qualification", "studies"]],
  ["workExperiences", ["work experience", "professional experience", "experience", "employment history", "employment", "career history", "work history", "career", "jobs"]],
  ["languages", ["languages", "language skills", "language proficiency"]],
  ["certifications", ["certifications", "certification", "certificates", "certificate", "courses", "courses & certifications", "licenses"]],
  ["publications", ["publications", "publication", "research publications", "research", "papers", "papers & publications"]],
  ["customSections", ["skills", "technical skills", "core skills", "additional sections", "additional information", "additional", "projects", "academic projects", "project", "awards", "achievements", "achievement", "hobbies", "interests", "volunteer work", "volunteering", "custom sections", "extracurriculars", "extracurricular activities"]],
  ["recommendations", ["recommendations", "recommendation", "references", "reference", "referees", "referee"]],
  ["style", ["style", "appearance", "cv style", "layout"]],
];

const FIELD_MAPS: Record<SectionType, Record<string, string>> = {
  personal: {
    "full name": "full_name",
    name: "full_name",
    "candidate name": "full_name",
    "first and last name": "full_name",
    fullname: "full_name",
    email: "email",
    "e-mail": "email",
    "email address": "email",
    phone: "phone",
    "phone number": "phone",
    mobile: "phone",
    "contact number": "phone",
    telephone: "phone",
    tel: "phone",
    contact: "phone",
    address: "address",
    "current address": "address",
    linkedin: "linkedin_url",
    "linkedin url": "linkedin_url",
    "linkedin profile": "linkedin_url",
    "linkedin profile url": "linkedin_url",
    "linkedin id": "linkedin_url",
    passport: "passport_number",
    "passport number": "passport_number",
    "passport no": "passport_number",
    "date of birth": "date_of_birth",
    dob: "date_of_birth",
    "birth date": "date_of_birth",
    "place of birth": "place_of_birth",
    "born in": "place_of_birth",
    nationality: "nationality",
    citizenship: "nationality",
    gender: "gender",
  },
  educations: {
    degree: "degree_title",
    "degree title": "degree_title",
    qualification: "degree_title",
    course: "degree_title",
    program: "degree_title",
    programme: "degree_title",
    specialization: "field_of_study",
    specialisation: "field_of_study",
    "field of study": "field_of_study",
    major: "field_of_study",
    discipline: "field_of_study",
    institution: "institution",
    university: "institution",
    college: "institution",
    institute: "institution",
    school: "institution",
    city: "city",
    country: "country",
    "start date": "start_date",
    start: "start_date",
    "start year": "start_date",
    "end date": "end_date",
    end: "end_date",
    "end year": "end_date",
    "graduation date": "end_date",
    "graduation year": "end_date",
    duration: "duration",
    dates: "duration",
    period: "duration",
    years: "duration",
    "final grade": "final_grade",
    grade: "final_grade",
    cgpa: "final_grade",
    gpa: "final_grade",
    score: "final_grade",
    percentage: "final_grade",
    "max scale": "max_scale",
    scale: "max_scale",
    "max marks": "max_scale",
    credits: "total_credits",
    "total credits": "total_credits",
    "credit points": "total_credits",
    ects: "total_credits",
    "credit system": "credit_system",
    thesis: "thesis_title",
    "thesis title": "thesis_title",
    "final project": "thesis_title",
    website: "website_url",
    "website url": "website_url",
    "institution website": "website_url",
    url: "website_url",
    "key subjects": "key_subjects",
    subjects: "key_subjects",
    "core subjects": "key_subjects",
    modules: "key_subjects",
    courses: "key_subjects",
    description: "description",
  },
  workExperiences: {
    "job title": "job_title",
    position: "job_title",
    role: "job_title",
    title: "job_title",
    organisation: "organisation",
    organization: "organisation",
    "organisation name": "organisation",
    "organization name": "organisation",
    company: "organisation",
    "company name": "organisation",
    employer: "organisation",
    city: "city",
    country: "country",
    "city, country": "city_country",
    location: "city_country",
    place: "city_country",
    "start date": "start_date",
    start: "start_date",
    "start year": "start_date",
    "end date": "end_date",
    end: "end_date",
    "end year": "end_date",
    duration: "duration",
    dates: "duration",
    period: "duration",
    years: "duration",
    "current job": "is_current",
    current: "is_current",
    ongoing: "is_current",
    "still working": "is_current",
    "currently working": "is_current",
    "currently employed": "is_current",
    description: "description",
    responsibilities: "description",
    "key responsibilities": "description",
    achievements: "description",
    duties: "description",
    "job description": "description",
  },
  languages: {
    language: "language_name",
    "language name": "language_name",
    "mother tongue": "mother_tongue",
    listening: "listening",
    reading: "reading",
    writing: "writing",
    speaking: "speaking",
  },
  certifications: {
    title: "title",
    certification: "title",
    "certification name": "title",
    certificate: "title",
    "course name": "title",
    credential: "title",
    name: "title",
    institution: "institution",
    issuer: "institution",
    "issued by": "institution",
    "issuing authority": "institution",
    provider: "institution",
    organisation: "institution",
    organization: "institution",
    date: "date",
    year: "date",
    "completion date": "date",
    "completion year": "date",
    "date obtained": "date",
    description: "description",
  },
  publications: {
    title: "title",
    "paper title": "title",
    "publication title": "title",
    publication: "title",
    paper: "title",
    article: "title",
    year: "year",
    "publication year": "year",
    journal: "journal",
    "journal / issn": "journal",
    issn: "journal",
    conference: "journal",
    venue: "journal",
    publisher: "journal",
    doi: "doi_url",
    "doi url": "doi_url",
    "doi number": "doi_url",
    url: "doi_url",
    link: "doi_url",
    hyperlink: "doi_url",
  },
  customSections: {
    "section title": "title",
    title: "title",
    section: "title",
    heading: "title",
    category: "title",
    "item label": "label",
    label: "label",
    item: "label",
    skill: "label",
    tool: "label",
    "item description": "description",
    description: "description",
    details: "description",
    content: "description",
    notes: "description",
    achievements: "description",
    highlights: "description",
  },
  recommendations: {
    name: "name",
    referee: "name",
    "referee name": "name",
    reference: "name",
    designation: "designation",
    title: "designation",
    position: "designation",
    "job title": "designation",
    department: "department",
    institution: "institution",
    university: "institution",
    organisation: "institution",
    organization: "institution",
    company: "institution",
    email: "email",
    "email address": "email",
    contact: "contact",
    "contact number": "contact",
    phone: "contact",
    "phone number": "contact",
    mobile: "contact",
    "lor link": "lor_link",
    "lor url": "lor_link",
    lor: "lor_link",
    "letter of recommendation": "lor_link",
    "recommendation letter": "lor_link",
    "reference letter": "lor_link",
    link: "lor_link",
  },
  style: {
    "header color": "headerBgColor",
    color: "headerBgColor",
    "accent color": "headerBgColor",
    "theme color": "headerBgColor",
    "header background": "headerBgColor",
    density: "density",
    "layout density": "density",
    layout: "density",
  },
};

const EMPTY_TOKENS = new Set([
  "n/a", "na", "nil", "nill", "not provided", "not applicable", "unknown",
  "none", "tbd", "to be determined", "-", "_", "?", "todo", "fill in", "xxx", "e.g", "e.g.",
]);

function cleanValue(v: string): string {
  let s = v.trim();
  // strip markdown emphasis / code markers
  s = s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1");
  // stray emphasis markers (e.g. bold label like "**Full Name:**" leaves "** value")
  s = s.replace(/^[*_`]+/, "").replace(/[*_`]+$/, "").trim();
  // normalize "93 %" -> "93%"
  s = s.replace(/(\d)\s+%/, "$1%");
  s = s.replace(/\s+/g, " ").trim();
  const t = s.toLowerCase().replace(/[.!]+$/g, "").trim();
  if (EMPTY_TOKENS.has(t)) return "";
  return s;
}

function splitSubjects(v: string): string[] {
  return v.split(/[,;•|]/).map(s => s.trim()).filter(Boolean);
}

function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[*`_]/g, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\s:.,?\-]+$/g, "")
    .trim();
}

function cleanHeadingText(raw: string): string {
  return raw.replace(/[*`_#]/g, "").trim();
}

// Substring match for markdown headings (## Education, ### Contact Information, …)
function matchSection(heading: string): SectionType | null {
  const h = cleanHeadingText(heading).toLowerCase();
  if (!h) return null;
  for (const [type, keywords] of SECTION_KEYWORDS) {
    if (keywords.some(k => h.includes(k))) return type;
  }
  return null;
}

// Exact match for plain-text section lines without markdown heading markers
function matchSectionExact(line: string): SectionType | null {
  const h = line
    .toLowerCase()
    .replace(/[*`_]/g, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\s:.]+$/g, "")
    .trim();
  if (!h) return null;
  for (const [type, names] of SECTION_EXACT) {
    if (names.includes(h)) return type;
  }
  return null;
}

// Split a section's lines into entry blocks on "### Heading" lines or rule lines.
function splitEntries(lines: string[]): string[][] {
  const entries: string[][] = [];
  let cur: string[] = [];
  for (const line of lines) {
    if (/^#{3,6}\s+/.test(line) || /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      if (cur.length) entries.push(cur);
      cur = [];
      continue;
    }
    cur.push(line);
  }
  if (cur.length) entries.push(cur);
  return entries;
}

const DESC_KEYS = new Set(["description"]);

// Parse one "Label: value" line or a markdown table row (| Label | Value |)
function parseFieldLine(line: string): { label: string; value: string } | null {
  const trimmed = line.trim();
  if (trimmed.startsWith("|")) {
    const cells = trimmed.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      const label = normalizeLabel(cells[0]);
      if (label && !/^[-=]+$/.test(label)) {
        return { label, value: cells.slice(1).join(" | ").trim() };
      }
    }
    return null;
  }
  const m = /^\s*(?:[-*+]\s+|\d+[.)]\s+)?(.+?)\s*:\s*(.*)$/.exec(line);
  if (!m) return null;
  return { label: normalizeLabel(m[1]), value: m[2].trim() };
}

// Parse a block of lines into one or more entries. When the same field label
// repeats (the "### Entry" separators were left out), a new entry is started.
function parseEntries(lines: string[], map: Record<string, string>): Array<{
  values: Record<string, string>;
  descBullets: Record<string, string[]>;
}> {
  const entries: Array<{ values: Record<string, string>; descBullets: Record<string, string[]> }> = [];
  let values: Record<string, string> = {};
  let descBullets: Record<string, string[]> = {};
  let lastDescKey: string | null = null;

  const flush = () => {
    if (Object.keys(values).length > 0) entries.push({ values, descBullets });
    values = {};
    descBullets = {};
    lastDescKey = null;
  };

  const assign = (key: string, value: string) => {
    if (key in values && !DESC_KEYS.has(key)) flush();
    values[key] = value;
    if (DESC_KEYS.has(key)) lastDescKey = key;
  };

  // Column labels of the current multi-column table (| A | B | C |) — reused by
  // the following data rows until the table ends.
  let tableHeaders: string[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trim().startsWith(">")) continue;

    const trimmed = line.trim();
    if (trimmed.startsWith("|")) {
      const cells = trimmed.split("|").map(c => c.trim()).filter(Boolean);
      if (cells.length === 2) {
        // Two-column table: | Label | Value |
        tableHeaders = null;
        const field = parseFieldLine(line);
        if (field) {
          const key = map[field.label];
          if (key) assign(key, field.value);
        }
      } else if (cells.length >= 3) {
        // Skip markdown separator rows (|---|---|)
        const isSeparator = cells.every(c => /^[-=:]+$/.test(c.trim()));
        if (isSeparator) continue;
        if (tableHeaders && cells.length === tableHeaders.length) {
          // Data row — map each cell to its column label
          cells.forEach((cell, i) => {
            const hLabel = tableHeaders![i];
            const key = hLabel && map[hLabel];
            if (key && cell.trim()) assign(key, cell.trim());
          });
        } else {
          const firstKey = map[normalizeLabel(cells[0])];
          if (firstKey) {
            // Header row — remember the column labels
            tableHeaders = cells.map(c => normalizeLabel(c));
          } else {
            tableHeaders = null; // orphan data row without a header
          }
        }
      }
      continue;
    }

    tableHeaders = null;

    // Indented lines (2+ spaces) are continuation of the current description
    if (/^\s{2,}/.test(line)) {
      const content = line.replace(/^\s+/, "").replace(/^[-*+]+\s+/, "").trim();
      if (content && lastDescKey) (descBullets[lastDescKey] ||= []).push(content);
      continue;
    }

    const field = parseFieldLine(line);
    if (!field) continue;
    const key = map[field.label];
    if (!key) continue;
    assign(key, field.value);
  }
  flush();
  return entries;
}

function coerceValue(key: string, value: string, bullets: string[] | undefined): unknown {
  // Clean first so stray markdown markers (e.g. "** 10") don't break coercion
  const clean = cleanValue(value);
  if (key === "max_scale" || key === "total_credits") return num(clean);
  if (key === "is_current" || key === "mother_tongue") return bool(clean) ?? false;
  if (key === "key_subjects") return splitSubjects(clean);
  if (key === "duration") return clean;
  if (DESC_KEYS.has(key)) {
    if (bullets && bullets.length) return bullets;
    return clean || undefined;
  }
  return clean;
}

// Split a "Aug 2018 - Jul 2022" style value into start/end dates.
function applyDuration(e: Record<string, unknown>): void {
  const d = e.duration;
  if (typeof d !== "string" || !d.trim()) {
    delete e.duration;
    return;
  }
  const parts = d.split(/\s*(?:–|—|-|to|till|until)\s*/i).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 1 && parts[0]) e.start_date = parts[0];
  if (parts.length >= 2) {
    if (/^(present|current|ongoing|now)$/i.test(parts[1])) {
      e.is_current = true;
    } else {
      e.end_date = parts[1];
    }
  }
  delete e.duration;
}

// ── Whole-document fallback ─────────────────────────────────────────────────
// Used when no section headings could be recognized. Only unambiguous labels
// are routed (labels shared by several sections are skipped so values never
// land in the wrong box).
const LOOSE_ROUTES: Record<string, [SectionType, string]> = {
  // personal
  "full name": ["personal", "full_name"],
  "candidate name": ["personal", "full_name"],
  "first and last name": ["personal", "full_name"],
  name: ["personal", "full_name"],
  email: ["personal", "email"],
  "email address": ["personal", "email"],
  phone: ["personal", "phone"],
  "phone number": ["personal", "phone"],
  mobile: ["personal", "phone"],
  telephone: ["personal", "phone"],
  address: ["personal", "address"],
  linkedin: ["personal", "linkedin_url"],
  "linkedin url": ["personal", "linkedin_url"],
  "linkedin profile": ["personal", "linkedin_url"],
  passport: ["personal", "passport_number"],
  "passport number": ["personal", "passport_number"],
  "passport no": ["personal", "passport_number"],
  "date of birth": ["personal", "date_of_birth"],
  dob: ["personal", "date_of_birth"],
  "place of birth": ["personal", "place_of_birth"],
  nationality: ["personal", "nationality"],
  citizenship: ["personal", "nationality"],
  gender: ["personal", "gender"],
  // education
  degree: ["educations", "degree_title"],
  qualification: ["educations", "degree_title"],
  "field of study": ["educations", "field_of_study"],
  specialization: ["educations", "field_of_study"],
  specialisation: ["educations", "field_of_study"],
  major: ["educations", "field_of_study"],
  institution: ["educations", "institution"],
  university: ["educations", "institution"],
  college: ["educations", "institution"],
  thesis: ["educations", "thesis_title"],
  "thesis title": ["educations", "thesis_title"],
  "key subjects": ["educations", "key_subjects"],
  subjects: ["educations", "key_subjects"],
  "final grade": ["educations", "final_grade"],
  grade: ["educations", "final_grade"],
  cgpa: ["educations", "final_grade"],
  gpa: ["educations", "final_grade"],
  percentage: ["educations", "final_grade"],
  "max scale": ["educations", "max_scale"],
  credits: ["educations", "total_credits"],
  "total credits": ["educations", "total_credits"],
  "credit system": ["educations", "credit_system"],
  // work
  "job title": ["workExperiences", "job_title"],
  position: ["workExperiences", "job_title"],
  role: ["workExperiences", "job_title"],
  organisation: ["workExperiences", "organisation"],
  organization: ["workExperiences", "organisation"],
  company: ["workExperiences", "organisation"],
  employer: ["workExperiences", "organisation"],
  // languages
  language: ["languages", "language_name"],
  "mother tongue": ["languages", "mother_tongue"],
  listening: ["languages", "listening"],
  reading: ["languages", "reading"],
  writing: ["languages", "writing"],
  speaking: ["languages", "speaking"],
  // certifications
  certification: ["certifications", "title"],
  certificate: ["certifications", "title"],
  "course name": ["certifications", "title"],
  issuer: ["certifications", "institution"],
  "issued by": ["certifications", "institution"],
  // publications
  "paper title": ["publications", "title"],
  journal: ["publications", "journal"],
  doi: ["publications", "doi_url"],
  "doi url": ["publications", "doi_url"],
  // recommendations
  referee: ["recommendations", "name"],
  "referee name": ["recommendations", "name"],
  reference: ["recommendations", "name"],
  designation: ["recommendations", "designation"],
  department: ["recommendations", "department"],
  lor: ["recommendations", "lor_link"],
  "lor link": ["recommendations", "lor_link"],
  "letter of recommendation": ["recommendations", "lor_link"],
};

function parseLoose(text: string): ImportedCVData | null {
  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  const personal: Record<string, unknown> = {};
  const educations: CVEducation[] = [];
  const workExperiences: CVWorkExperience[] = [];
  const languages: CVLanguage[] = [];
  const certifications: CVCertification[] = [];
  const publications: CVPublication[] = [];
  const recommendations: CVRecommendation[] = [];
  const arrays: Record<string, any[]> = {
    educations, workExperiences, languages, certifications, publications, recommendations,
  };
  let found = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim() || line.trim().startsWith(">")) continue;
    const field = parseFieldLine(line);
    if (!field) continue;
    const route = LOOSE_ROUTES[field.label];
    if (!route) continue;
    found = true;
    const [section, key] = route;
    if (section === "personal") {
      personal[key] = coerceValue(key, field.value, undefined);
      continue;
    }
    const arr = arrays[section];
    const last = arr[arr.length - 1];
    if (!last || key in last) arr.push({});
    arr[arr.length - 1][key] = coerceValue(key, field.value, undefined);
  }

  if (!found) return null;
  return {
    personal,
    educations,
    workExperiences,
    languages,
    certifications,
    publications,
    recommendations,
    customSections: [],
    buildOptions: undefined,
  };
}

export function parseImportedCVMarkdown(text: string): ImportedCVData | null {
  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");

  // Collect sections from headings (any level) or plain-text section lines
  const sections: Array<{ type: SectionType; lines: string[] }> = [];
  let current: { type: SectionType; lines: string[] } | null = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^#{1,6}\s*(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      const type = matchSection(heading[1]);
      if (type) {
        current = { type, lines: [] };
        sections.push(current);
        continue;
      }
      // Unrecognized heading — keep collecting into the current section
      continue;
    }
    // Plain-text section line (e.g. "EDUCATION" or "Work Experience")
    const trimmed = line.trim();
    if (trimmed && !/^[-*+|#>]/.test(trimmed) && !trimmed.includes(": ") && trimmed.length <= 40) {
      const type = matchSectionExact(trimmed);
      if (type) {
        current = { type, lines: [] };
        sections.push(current);
        continue;
      }
    }
    if (current) current.lines.push(line);
  }

  const personal: Partial<CVPersonalInfo> = {};
  const educations: CVEducation[] = [];
  const workExperiences: CVWorkExperience[] = [];
  const languages: CVLanguage[] = [];
  const certifications: CVCertification[] = [];
  const publications: CVPublication[] = [];
  const customSections: CVCustomSection[] = [];
  const recommendations: CVRecommendation[] = [];
  let buildOptions: CVBuildOptions | undefined;
  let found = false;

  for (const section of sections) {
    const map = FIELD_MAPS[section.type];
    const blocks = section.type === "personal" ? [section.lines] : splitEntries(section.lines);

    for (const block of blocks) {
      for (const { values, descBullets } of parseEntries(block, map)) {
        if (Object.keys(values).length === 0) continue;

        const pick = (key: string): unknown => coerceValue(key, values[key], descBullets[key]);

        // Personal section always applies (blank fields just stay blank)
        if (section.type === "personal") {
          for (const key of Object.keys(values)) (personal as any)[key] = pick(key);
          found = true;
          continue;
        }

        // Skip entries where every field is blank (e.g. an untouched "### Entry 1")
        const hasContent = Object.keys(values).some(k => {
          if (DESC_KEYS.has(k) && descBullets[k] && descBullets[k].length) return true;
          return cleanValue(values[k]) !== "";
        });
        if (!hasContent) continue;
        found = true;

        switch (section.type) {
          case "educations": {
            const e: Record<string, unknown> = {};
            for (const key of Object.keys(values)) e[key] = pick(key);
            applyDuration(e);
            educations.push(e as unknown as CVEducation);
            break;
          }
          case "workExperiences": {
            const w: Record<string, unknown> = {};
            for (const key of Object.keys(values)) w[key] = pick(key);
            applyDuration(w);
            workExperiences.push(w as unknown as CVWorkExperience);
            break;
          }
          case "languages": {
            const l: Record<string, unknown> = {};
            for (const key of Object.keys(values)) l[key] = pick(key);
            languages.push(l as unknown as CVLanguage);
            break;
          }
          case "certifications": {
            const c: Record<string, unknown> = {};
            for (const key of Object.keys(values)) c[key] = pick(key);
            certifications.push(c as unknown as CVCertification);
            break;
          }
          case "publications": {
            const p: Record<string, unknown> = {};
            for (const key of Object.keys(values)) p[key] = pick(key);
            publications.push(p as unknown as CVPublication);
            break;
          }
          case "recommendations": {
            const r: Record<string, unknown> = {};
            for (const key of Object.keys(values)) r[key] = pick(key);
            recommendations.push(r as unknown as CVRecommendation);
            break;
          }
          case "customSections": {
            const item: Record<string, unknown> = {};
            for (const key of Object.keys(values)) item[key] = pick(key);
            const title = typeof item.title === "string" ? item.title : "";
            const label = typeof item.label === "string" ? item.label : "";
            const description: string | string[] =
              typeof item.description === "string"
                ? item.description
                : Array.isArray(item.description)
                  ? item.description.filter((x): x is string => typeof x === "string")
                  : "";
            const last = customSections[customSections.length - 1];
            if (!last || (title && last.title !== title && last.items.length > 0)) {
              customSections.push({ title, items: [] });
            }
            customSections[customSections.length - 1].items.push({ label, description });
            break;
          }
          case "style": {
            const hc = cleanValue(values.headerBgColor ?? "");
            const d = cleanValue(values.density ?? "").toLowerCase();
            if (/^#?[0-9a-fA-F]{3,8}$/.test(hc.replace("#", ""))) {
              buildOptions = { ...buildOptions, headerBgColor: hc.startsWith("#") ? hc : `#${hc}` };
            }
            if (d === "compact" || d === "standard" || d === "expanded") {
              buildOptions = { ...buildOptions, density: d as CVBuildOptions["density"] };
            }
            break;
          }
        }
      }
    }
  }

  if (!found && Object.keys(personal).length === 0) {
    // Last resort: no recognizable sections — scan the whole document for labels
    return parseLoose(text);
  }

  return {
    personal,
    educations,
    workExperiences,
    languages,
    certifications,
    publications,
    customSections,
    recommendations,
    buildOptions,
  };
}