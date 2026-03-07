// Shared CV template builder for both authenticated (edge function) and public (client-side) generation

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Sanitize HTML - allow only safe formatting tags
function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return String(html)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<(?!\/?(?:strong|em|b|i|br|div|span|ul|li)\b)[^>]+>/gi, "");
}

function formatDateDMY(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const value = dateStr.trim();
  if (!value) return "";

  const normalized = value.replace(/\./g, " ").replace(/\s+/g, " ").trim();
  const monthYearMatch = normalized.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthName = new Date(`${monthYearMatch[1]} 1, 2000`).toLocaleString("en-US", { month: "short" });
    if (monthName !== "Invalid Date") return `${monthName} ${monthYearMatch[2]}`;
  }

  if (/^\d{4}$/.test(normalized)) return normalized;

  if (/^\d{4}-\d{2}$/.test(normalized)) {
    const [year, month] = normalized.split("-").map(Number);
    if (month >= 1 && month <= 12) {
      return `${new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short" })} ${year}`;
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const d = new Date(`${normalized}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
  }

  const fallback = new Date(value);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  return escapeHtml(value);
}

function formatGrade(finalGrade?: string, maxScale?: number, creditSystem?: string): string {
  if (!finalGrade) return "";
  const numericGrade = Number(finalGrade);
  const isPercentageSystem = (creditSystem || "").toLowerCase().includes("percent") || maxScale === 100;

  if (isPercentageSystem && !Number.isNaN(numericGrade)) {
    return `Grade: ${Math.min(Math.max(numericGrade, 0), 100)}%`;
  }

  if (maxScale && maxScale > 0) {
    return `Grade: ${escapeHtml(finalGrade)} / ${maxScale}`;
  }

  return `Grade: ${escapeHtml(finalGrade)}`;
}


function formatCoreCoursework(subjects?: string): string {
  if (!subjects) return "";
  const plain = sanitizeHtml(subjects)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "");

  const parts = plain
    .split(/\n|,|;|\u2022|•/)
    .map(item => item.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";

  return `<div class="core-coursework-title">Core Coursework</div><ul class="cv-list core-coursework-list">${parts.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function plainLinesFromHtml(value?: string): string[] {
  if (!value) return [];
  const lines = sanitizeHtml(value)
    .replace(/<\/(?:p|div|h[1-6])>/gi, "\n")
    .replace(/<(?:p|div|h[1-6])[^>]*>/gi, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .split(/\n|\u2022|•|;|\|/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(line => line.replace(/\s{2,}/g, " ").trim());

  if (lines.length === 1 && /[.!?]/.test(lines[0])) {
    return lines[0]
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return lines;
}

function formatBullets(value?: string, className = "bullet-list"): string {
  const raw = value || "";
  const multiline = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
  const lines = multiline.length > 1 ? multiline.map(line => escapeHtml(line)) : plainLinesFromHtml(value).map(line => escapeHtml(line));
  if (!lines.length) return "";
  return `<ul class="cv-list ${className}">${lines.map(line => `<li>${line}</li>`).join("")}</ul>`;
}

function encodeBase64Unicode(value: string): string {
  try {
    if (typeof globalThis !== "undefined" && typeof globalThis.btoa === "function") {
      return globalThis.btoa(unescape(encodeURIComponent(value)));
    }
  } catch {
    // no-op
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf-8").toString("base64");
  }

  return "";
}

export interface CVPersonalInfo {
  full_name?: string;
  passport_number?: string;
  date_of_birth?: string;
  nationality?: string;
  gender?: string;
  place_of_birth?: string;
  phone?: string;
  email?: string;
  linkedin_url?: string;
  address?: string;
  avatar_url?: string;
  signature_url?: string;
  signature_date?: string;
}

export interface CVEducation {
  degree_title: string;
  field_of_study: string;
  institution: string;
  country: string;
  start_year: number;
  end_year: number;
  start_date?: string;
  end_date?: string;
  key_subjects?: string;
  final_grade?: string;
  max_scale?: number;
  total_credits?: number;
  credit_system?: string;
  thesis_title?: string;
}

export interface CVWorkExperience {
  job_title: string;
  organisation: string;
  city_country?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
}

export interface CVLanguage {
  language_name: string;
  mother_tongue?: boolean;
  listening?: string;
  reading?: string;
  writing?: string;
  speaking?: string;
}

export interface CVPublication {
  title: string;
  journal?: string;
  year?: number;
  doi_url?: string;
}

export interface CVCertification {
  title: string;
  institution?: string;
  date?: string;
}

export interface CVCustomSection {
  title: string;
  items: { label: string; description?: string }[];
}

export interface CVRecommendation {
  name: string;
  designation?: string;
  department?: string;
  institution?: string;
  email?: string;
  contact?: string;
  lor_link?: string;
}

export interface CVBuildOptions {
  headerBgColor?: string;
  photoPosition?: string;
  photoZoom?: number;
  photoPositionX?: number;
  photoPositionY?: number;
  density?: "compact" | "standard" | "expanded";
  sectionOrder?: Array<"work" | "publications" | "languages" | "certifications" | "custom" | "recommendations">;
}

export function buildCVHtml(
  personal: CVPersonalInfo,
  educations: CVEducation[],
  workExperiences: CVWorkExperience[],
  languages: CVLanguage[],
  publications: CVPublication[],
  certifications: CVCertification[],
  customSections: CVCustomSection[] = [],
  recommendations: CVRecommendation[] = [],
  options: CVBuildOptions = {}
): string {
  const {
    headerBgColor = "#154a8a",
    photoPosition = "center",
    photoZoom = 100,
    photoPositionX = 50,
    photoPositionY = photoPosition === "top" ? 20 : photoPosition === "bottom" ? 80 : 50,
    density = "standard",
    sectionOrder = ["work", "publications", "languages", "certifications", "custom", "recommendations"],
  } = options;

  const motherTongues = languages.filter(l => l.mother_tongue).map(l => escapeHtml(l.language_name).toUpperCase()).join("  &nbsp;  ");
  const otherLangs = languages.filter(l => !l.mother_tongue);

  const eduHtml = educations.map(edu => `
<div class="entry education-entry education-item">
  <table class="entry-row-table"><tr>
    <td class="entry-title-cell">${escapeHtml(edu.degree_title).toUpperCase()}${edu.field_of_study ? ` – ${escapeHtml(edu.field_of_study).toUpperCase()}` : ""}</td>
    <td class="entry-date-cell">${formatMonthYear(edu.start_date) || edu.start_year} – ${formatMonthYear(edu.end_date) || edu.end_year}</td>
  </tr></table>
  <div class="sub-info">${escapeHtml(edu.institution)}${edu.country ? `, ${escapeHtml(edu.country)}` : ""}</div>
  ${formatCoreCoursework(edu.key_subjects)}
  <div class="academic-meta">
    ${edu.thesis_title ? `<strong>Thesis:</strong> <em>${escapeHtml(edu.thesis_title)}</em><br>` : ""}
    ${formatGrade(edu.final_grade, edu.max_scale, edu.credit_system)}${edu.credit_system ? ` (${escapeHtml(edu.credit_system)})` : ""}${edu.total_credits ? ` | Credits: ${edu.total_credits}` : ""}
  </div>
</div>`).join("\n");

  const pubHtml = publications.length > 0 ? `
    <div class="section publications-section">
    <div class="section-title">Research Publications</div>
    <div class="section-content">
    ${publications.map(pub => `
<div class="entry research-entry">
  <div class="research-title"><strong>${escapeHtml(pub.title)}</strong>${pub.year ? ` — ${pub.year}` : ""}</div>
  <div class="academic-meta">
    ${escapeHtml(pub.journal)}${pub.doi_url ? `. <a href="${escapeHtml(pub.doi_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(pub.doi_url)}</a>` : ""}
  </div>
  </div>`).join("\n")}
    </div>
    </div>` : "";

  const workHtml = workExperiences.length > 0 ? `
    <div class="section work-section">
    <div class="section-title">Work Experience</div>
    <div class="section-content">
    ${workExperiences.map(w => `
<div class="entry work-entry experience-item">
  <table class="entry-row-table"><tr>
    <td class="entry-title-cell">${escapeHtml([w.job_title, w.organisation, w.city_country].filter(Boolean).join(", "))}</td>
    <td class="entry-date-cell">${formatMonthYear(w.start_date)} – ${w.is_current ? "Present" : formatMonthYear(w.end_date)}</td>
  </tr></table>
  ${formatBullets(w.description, "work-bullet-list")}
</div>`).join("\n")}
    </div>
    </div>` : "";

  const langRows = otherLangs.map(l => `
<tr><td class="lang-name-cell">${escapeHtml(l.language_name)}</td><td class="lang-level-cell">${l.listening || "—"}</td><td class="lang-level-cell">${l.reading || "—"}</td><td class="lang-level-cell">${l.writing || "—"}</td><td class="lang-level-cell">${l.speaking || "—"}</td></tr>`).join("");

  const langTableHtml = otherLangs.length > 0 ? `
<table class="lang-table">
<colgroup><col class="lang-col-name"><col class="lang-col-level"><col class="lang-col-level"><col class="lang-col-level"><col class="lang-col-level"></colgroup>
<tr><th>Language</th><th>Listening</th><th>Reading</th><th>Writing</th><th>Speaking</th></tr>
${langRows}
</table>` : "";

  const certHtml = certifications.length > 0 ? `
    <div class="section certifications-section">
    <div class="section-title">Certifications</div>
    <div class="section-content">
    <ul class="cv-list bullet-list">
    ${certifications.map(c => {
      const certDate = formatMonthYear(c.date);
      return `<li>${escapeHtml(c.title)}${c.institution ? ` | ${escapeHtml(c.institution)}` : ""}${certDate ? ` | ${certDate}` : ""}</li>`;
    }).join("")}
    </ul>
    </div>
    </div>` : "";

const customHtml = customSections
  .filter(s => s.items.length > 0)
  .map(section => `
    <div class="section custom-section">
    <div class="section-title">${escapeHtml(section.title)}</div>
    <div class="section-content">

    ${section.items.map(item => {

      // TITLE + DESCRIPTION
      const isTechnicalSkillsSection = /technical\s+skills/i.test(section.title);

      if (isTechnicalSkillsSection) {
        const values = plainLinesFromHtml(item.description)
          .flatMap(v => v.split(","))
          .map(v => v.trim())
          .filter(Boolean)
          .map(v => escapeHtml(v));
        const label = escapeHtml(item.label || "Skills");
        const unique = Array.from(new Set(values.map(v => String(v).trim()).filter(Boolean)));
        const list = unique.join(", ") || "—";
        return `<div class="entry skills-line-entry project-item"><strong>${label}:</strong> ${list}</div>`;
      }

      if (item.description) {
        return `
        <div class="entry ${isTechnicalSkillsSection ? "skills-entry" : ""} project-item">
          <strong>${escapeHtml(item.label)}</strong>${isTechnicalSkillsSection ? ":" : "<br>"}
          ${formatBullets(item.description, "bullet-list") || sanitizeHtml(item.description)}
        </div>`;
      }

      // SIMPLE
      return `<div class="entry project-item">${escapeHtml(item.label)}</div>`;

    }).join("")}

  </div>
  </div>`).join("\n");

  const recHtml = recommendations.length > 0 ? `
    <div class="section referees-section">
    <div class="section-title">Recommendations</div>
    <div class="section-content">
    ${recommendations.map(r => `
<div class="entry">
    <div class="ref-row-1"><strong>${escapeHtml(r.name)}</strong>${[r.designation, r.department, r.institution].filter(Boolean).length ? `, ${[r.designation, r.department, r.institution].filter(Boolean).map(escapeHtml).join(", ")}` : ""}</div>
    <div class="ref-row-2">${r.email ? `<span class="ref-label">Email:</span> <a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>` : ""}${r.lor_link ? `<span class="ref-sep">&nbsp;&nbsp;</span><span class="ref-label">Download LOR Certificate:</span> <a href="${escapeHtml(r.lor_link)}" target="_blank" rel="noopener noreferrer">Clickable Link</a>` : ""}${r.contact ? `<span class="ref-sep">&nbsp;&nbsp;</span>${escapeHtml(r.contact)}` : ""}</div>
</div>`).join("\n")}
    </div>
    </div>` : "";

const linkedinLine = personal.linkedin_url
  ? `<div><span class="label">LinkedIn:</span> <a href="${escapeHtml(personal.linkedin_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(personal.linkedin_url)}</a></div>`
  : "";

const addressLine = personal.address
  ? `<div><span class="label">Address:</span> ${escapeHtml(personal.address)}</div>`
  : "";

const photoStyle = `object-fit: cover; object-position: ${photoPositionX}% ${photoPositionY}%; transform: scale(${photoZoom / 100});`;
const profilePicBlock = personal.avatar_url ? `<div class="profile-pic-wrapper"><img src="${escapeHtml(personal.avatar_url)}" alt="Profile" class="profile-pic-circle" style="${photoStyle}"></div>` : "";
const signatureBlock = personal.signature_url ? `<img src="${escapeHtml(personal.signature_url)}" alt="Signature" class="sig-img">` : "";
const metadataPayload = {
  generator: "publicgermany-cv",
  version: "1.0",
  data: {
    personal,
    educations,
    workExperiences,
    languages,
    certifications,
    publications,
    customSections,
    recommendations,
    buildOptions: options,
  },
};
const encodedMetadata = encodeBase64Unicode(JSON.stringify(metadataPayload));
const metadataText = encodedMetadata ? `PGCVMETA:${encodedMetadata}` : "";

// Build personal details lines - compact academic grouping
const personalLines: string[] = [];
const row2: string[] = [];
const row3: string[] = [];

if (personal.passport_number) row2.push(`<span class="label">Passport:</span> ${escapeHtml(personal.passport_number)}`);
if (personal.date_of_birth) row2.push(`<span class="label">Date of Birth:</span> ${formatDateDMY(personal.date_of_birth)}`);
if (personal.place_of_birth) row2.push(`<span class="label">Place of Birth:</span> ${escapeHtml(personal.place_of_birth)}`);

if (personal.nationality) row3.push(`<span class="label">Nationality:</span> ${escapeHtml(personal.nationality)}`);
if (personal.gender) row3.push(`<span class="label">Gender:</span> ${escapeHtml(personal.gender)}`);
if (personal.phone) row3.push(`<span class="label">Phone:</span> ${escapeHtml(personal.phone)}`);
if (personal.email) row3.push(`<span class="label">Email:</span> <a href="mailto:${escapeHtml(personal.email)}">${escapeHtml(personal.email)}</a>`);

if (row2.length > 0) personalLines.push(`<div>${row2.join(" | ")}</div>`);
if (row3.length > 0) personalLines.push(`<div>${row3.join(" | ")}</div>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="generator" content="PublicGermany-CV-Generator-v2">
<meta name="cv-format" content="europass-academic">
<meta name="cv-created" content="${new Date().toISOString()}">
<title>Academic_CV_${escapeHtml(personal.full_name)}</title>
<style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; user-select: text; -webkit-user-select: text; }
    html, body { width: 210mm; margin: 0; padding: 0; background: #fff; }
    body {
      font-family: "Inter", "Segoe UI", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
      line-height: 1.45;
      color: #111827;
      font-size: 10.5px;
      text-rendering: geometricPrecision;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .cv-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 0;
      background: #fff;
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      position: relative;
      --base-font-size: 10.5px;
      --base-line-height: 1.45;
      --header-vpad: 22px;
      --section-gap: 16px;
      --entry-gap: 11px;
    }
    .cv-container.density-compact {
      --base-font-size: 10px;
      --base-line-height: 1.38;
      --header-vpad: 18px;
      --section-gap: 13px;
      --entry-gap: 8px;
    }
    .cv-container.density-standard {
      --base-font-size: 10.5px;
      --base-line-height: 1.45;
      --header-vpad: 22px;
      --section-gap: 16px;
      --entry-gap: 11px;
    }
    .cv-container.density-expanded {
      --base-font-size: 11px;
      --base-line-height: 1.52;
      --header-vpad: 26px;
      --section-gap: 20px;
      --entry-gap: 13px;
    }
    /* ===== HEADER: full-width background ===== */
.header-band {
  background-color: ${headerBgColor};
  width: 100%;
  padding: calc(var(--header-vpad) - 10px) 28px calc(var(--header-vpad) - 14px) 28px;
}

.header-inner { 
  display: table; 
  width: 100%; 
}

.profile-col { 
  display: table-cell; 
  vertical-align: top; 
  width: 116px; 
  padding-right: 18px; 
}

.name-col { 
  display: table-cell; 
  vertical-align: top; 
}

.profile-pic-wrapper { 
  width: 104px; 
  height: 104px; 
  min-width: 104px;
  min-height: 104px;
  max-width: 104px;
  max-height: 104px;
  border-radius: 50%; 
  overflow: hidden; 
  border: 3px solid #ffffff; 
  box-shadow: 0 1px 4px rgba(0,0,0,0.15); 
}

.profile-pic-circle { 
  width: 104px !important; 
  height: 104px !important; 
  max-width: 104px !important;
  max-height: 104px !important;
  border-radius: 50%; 
  display: block; 
  object-fit: cover; 
  transform-origin: center center;
}

.name-text {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  margin-top: -4px;
  margin-bottom: 6px;
  line-height: 1.2;
  letter-spacing: 1px;
}

.header-divider {
  height: 1px;
  background-color: rgba(255,255,255,0.6);
  margin: 6px 0 10px 0;
}

.personal-details-block {
  line-height: 1.7;
  font-size: 11.1px;
  color: #ffffff;
}

.personal-details-block div {
  margin-bottom: 4px;
}

.label {
  font-weight: 600;
  color: inherit;
  text-transform: none;
  margin-right: 4px;
}

.personal-details-block span,
.personal-details-block a {
  color: inherit;
  font-weight: normal;
}

/* clickable links in header */
.header-band a { 
  color: #ffffff; 
  text-decoration: none; 
}

.header-band a:hover {
  text-decoration: underline;
}
    /* ===== BODY CONTENT ===== */
    .cv-body { padding: 0 28px 14mm 28px; font-size: calc(var(--base-font-size) + 0.3px); line-height: var(--base-line-height); color: #111; }
    .section-title { font-size: 12.2px; font-weight: 800; color: #0b4a8b; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 2px solid #d5dbe4; margin: var(--section-gap) 0 8px 0; padding-bottom: 5px; page-break-after: avoid; break-after: avoid; }
    .section-content { display: block; page-break-inside: avoid; break-inside: avoid; }
    /* Entry header using table for no-flex alignment */
    .entry-row-table { width: 100%; border-collapse: collapse; margin: 0; padding: 0; }
    .entry-row-table td { padding: 0; border: none; vertical-align: baseline; }
    .entry-title-cell { font-weight: 700; font-size: 11.1px; text-align: left; }
    .entry-date-cell { font-weight: 700; font-size: 10.1px; text-align: right; white-space: nowrap; width: 160px; color: #1f2937; }
    .entry { margin-bottom: var(--entry-gap); page-break-inside: avoid; break-inside: avoid; }
    .skills-entry { margin-bottom: 3px; }
    .skills-entry strong { margin-right: 3px; }
    .sub-info { font-style: italic; color: #1f2937; margin: 2px 0; font-size: 10.2px; }
    .academic-meta { font-size: 10px; color: #111; margin: 2px 0; line-height: 1.5; }
    /* Language table */
    .lang-table { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; page-break-inside: avoid; break-inside: avoid; }
    .lang-table th, .lang-table td { border: 1px solid #c8d2df; padding: 6px 8px; font-size: 10px; overflow: hidden; text-overflow: ellipsis; }
    .lang-table th { background-color: #f3f6fa; font-weight: 700; font-size: 9.5px; }
    .lang-col-name { width: 36%; }
    .lang-col-level { width: 16%; }
    .lang-name-cell { font-weight: 600; text-align: left; }
    .lang-level-cell, .lang-table th:not(:first-child) { text-align: center; }
    .lang-table th:first-child { text-align: left; }
    .mother-tongue-text { margin: 4px 0; font-size: 10.5px; }
    .cv-list, .bullet-list, .work-bullet-list, .core-coursework-list {
      margin-top: 6px;
      margin-bottom: 6px;
      padding-left: 20px;
      list-style: disc;
      list-style-position: outside;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .cv-list li, .bullet-list li, .work-bullet-list li, .core-coursework-list li {
      display: list-item;
      margin-bottom: 5px;
      line-height: 1.35;
      font-size: 11.5px;
      color: #111;
    }
    .cv-list li::marker, .bullet-list li::marker, .work-bullet-list li::marker, .core-coursework-list li::marker {
      font-size: 1.1em;
      color: #111;
    }
    .core-coursework-title { font-weight: 700; margin: 4px 0 3px 0; color: #1f2937; }
    .ref-row-1 { font-size: 10.3px; color: #111; margin-bottom: 2px; }
    .ref-row-2 { font-size: 10.2px; color: #111; }
    .ref-label { font-weight: 700; color: #111; }
    .ref-sep { display: inline-block; min-width: 12px; }

    /* Footer: signature + page number only */
    .cv-footer { margin-top: auto; padding: 16px 28px 14px 28px; page-break-inside: avoid; break-inside: avoid; }
    .sig-table { width: 100%; border-collapse: collapse; }
    .sig-table td { padding: 0; border: none; vertical-align: bottom; }
    .sig-left-cell { text-align: left; width: 50%; font-size: 9px; }
    .sig-right-cell { text-align: right; width: 50%; }
    .sig-img { max-width: 120px; height: auto; filter: grayscale(1); display: block; margin-left: auto; }
    .sig-name { font-weight: bold; font-size: 10px; text-align: right; margin-top: 2px; }
    .page-footer { text-align: right; font-size: 8px; color: #888; margin-top: 8px; padding-top: 4px; border-top: 0.5pt solid #ddd; }
    table { width: 100%; border-collapse: collapse; }
    img { max-width: 100%; height: auto; }
    a { color: #0b4a8b; text-decoration: underline; cursor: pointer; pointer-events: auto; }
    /* Section-level page break control */
    .section { page-break-inside: avoid; break-inside: avoid; page-break-before: auto; margin-bottom: 18px; }
    .section-title { page-break-after: avoid; }
    .section-content { page-break-inside: avoid; break-inside: avoid; }
    .experience-item, .education-item, .project-item { page-break-inside: avoid; break-inside: avoid; }
    .entry, .lang-table, .section-title { page-break-inside: avoid; break-inside: avoid; }
    .cv-list { page-break-inside: avoid; break-inside: avoid; }

    .pdf-export { width: 794px !important; min-height: 1123px !important; }
    .pdf-export .section,
    .pdf-export .entry,
    .pdf-export .lang-table,
    .pdf-export .bullet-list,
    .pdf-export .cv-footer,
    .pdf-export .section-title {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    /* Keep section titles with their following content */
    .section-title + .entry, .section-title + .bullet-list, .section-title + .lang-table, .section-title + .mother-tongue-text { page-break-before: avoid; break-before: avoid; }

    @media print {
      @page { margin: 22mm 18mm 22mm 18mm; }
      html, body { width: 210mm; margin: 0; padding: 0; background: #fff; }
      .cv-container { width: 210mm; min-height: auto; margin: 0; box-shadow: none; border-radius: 0; }
      .section { page-break-inside: avoid; break-inside: avoid; }
      .header-band { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      .cv-body { padding-bottom: 10mm; }
      /* Orphan/widow control */
      p, li, .entry, .academic-meta { orphans: 3; widows: 3; }
    }
    @media screen {
      .cv-container { box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.08); border-radius: 10px; margin: 16px auto; }
    }
    .cv-metadata {
      font-size: 1px;
      line-height: 1;
      color: #ffffff;
      user-select: none;
      word-break: break-all;
      margin-top: 2px;
    }
</style>
</head>
<body>
<!-- PublicGermany CV Metadata (machine-readable) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "${escapeHtml(personal.full_name)}",
  "generator": "PublicGermany Europass CV Generator",
  "version": "2.0",
  "dateCreated": "${new Date().toISOString()}"
}
</script>
<div class="cv-container density-${density}">
  <!-- HEADER BAND -->
  <div class="header-band">
    <div class="header-inner">
      ${personal.avatar_url ? `<div class="profile-col">${profilePicBlock}</div>` : ""}
      <div class="name-col">
        <h1 class="name-text">${escapeHtml(personal.full_name)}</h1>
        <div class="header-divider"></div>
       <div class="personal-details-block">
  ${personalLines.join("\n          ")}
  ${linkedinLine}
  ${addressLine}
</div>
      </div>
    </div>
  </div>

  <!-- CV BODY -->
  <div class="cv-body">
    <div class="section education-section">
    <div class="section-title">Education and Training</div>
    <div class="section-content">${eduHtml}</div>
    </div>

    ${sectionOrder.map(section => {
      if (section === "work") return workHtml;
      if (section === "publications") return pubHtml;
      if (section === "languages") return `<div class="section language-section"><div class="section-title">Language Skills</div><div class="section-content">${motherTongues ? `<div class="mother-tongue-text"><strong>Mother Tongue(s):</strong>&nbsp; ${motherTongues}</div>` : ""}${langTableHtml}</div></div>`;
      if (section === "certifications") return certHtml;
      if (section === "custom") return customHtml;
      if (section === "recommendations") return recHtml;
      return "";
    }).join("\n")}
  </div>

  <!-- FOOTER: signature + page -->
  <div class="cv-footer">
    <table class="sig-table"><tr>
      <td class="sig-left-cell"></td>
      <td class="sig-right-cell">
        ${signatureBlock}
        <div class="sig-name">(${escapeHtml(personal.full_name)})</div>
      </td>
    </tr></table>
    ${metadataText ? `<div class="cv-metadata">${metadataText}</div>` : ""}
  </div>
</div>
</body>
</html>`;
}
