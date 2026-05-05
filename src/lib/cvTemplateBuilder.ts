// ─────────────────────────────────────────────────────────────────────────────
// CV Template Builder — single-page Europass-style CV
// Matches the user-provided cv_template.html exactly.
// Same builder is used for the live preview and the PDFShift edge function,
// so what you see in the preview is what you download.
// ─────────────────────────────────────────────────────────────────────────────

export interface CVPersonalInfo {
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  linkedin_url?: string;
  avatar_url?: string;
  signature_url?: string;
  passport_number?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  nationality?: string;
  gender?: string;
}

export interface CVEducation {
  degree_title: string;
  field_of_study?: string;
  institution: string;
  country?: string;
  city?: string;
  start_year?: number;
  end_year?: number;
  start_date?: string;
  end_date?: string;
  key_subjects?: string[] | string;
  final_grade?: string;
  max_scale?: number;
  total_credits?: number;
  credit_system?: string;
  thesis_title?: string;
  website_url?: string;
  description?: string;
}

export interface CVWorkExperience {
  job_title: string;
  organisation: string;
  city_country?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  description?: string[] | string;
}

export interface CVLanguage {
  language_name: string;
  mother_tongue?: boolean;
  listening?: string;
  reading?: string;
  writing?: string;
  speaking?: string;
}

export interface CVCertification {
  title: string;
  institution?: string;
  date?: string;
  description?: string;
}

export interface CVPublication {
  title: string;
  year: string;
  journal?: string;
  doi_url?: string;
}

export interface CVCustomSection {
  title: string;
  items: { label: string; description?: string[] | string }[];
}

export interface CVRecommendation {
  name: string;
  designation?: string;
  department?: string;
  institution?: string;
  email?: string;
  lor_link?: string;
  contact?: string;
}

export interface CVBuildOptions {
  headerBgColor?: string;
  density?: "compact" | "standard" | "expanded";
  sectionOrder?: string[];
}

// ─── helpers ────────────────────────────────────────────────────────────────
export function escapeHtml(v: string | null | undefined): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function toLines(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v ?? "").trim()).filter(Boolean);
  let text = String(value)
    .replace(/<\/(?:p|div|li|h[1-6])[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
  return text.split(/\r?\n/).map(l => l.replace(/^\s*[-*•·]\s*/, "").trim()).filter(Boolean);
}

function fmtYearRange(startYear?: number | string, endYear?: number | string,
                     startDate?: string, endDate?: string, isCurrent?: boolean): string {
  const yr = (v?: string | number) => {
    if (!v) return "";
    const s = String(v);
    const m = s.match(/(\d{4})/);
    return m ? m[1] : "";
  };
  const s = yr(startDate) || yr(startYear);
  const e = isCurrent ? "Present" : (yr(endDate) || yr(endYear));
  if (!s && !e) return "";
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

function fmtDOB(v?: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return escapeHtml(v);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtGrade(grade?: string, max?: number, system?: string): string {
  if (!grade) return "";
  const n = Number(grade);
  const pct = (system ?? "").toLowerCase().includes("percent") || max === 100;
  if (pct && !isNaN(n)) return `${Math.min(Math.max(n, 0), 100)}%`;
  if (max && max > 0) return `${escapeHtml(grade)} / ${max}`;
  return escapeHtml(grade);
}

// ─── Header ─────────────────────────────────────────────────────────────────
function buildHeader(p: any): string {
  const items: string[] = [];
  const add = (label: string, val?: string) => {
    if (val) items.push(`<span class="hd-item"><span class="hd-label">${label}:</span> ${val}</span>`);
  };
  add("Passport", escapeHtml(p.passport_number));
  add("Date of birth", fmtDOB(p.date_of_birth));
  add("Nationality", escapeHtml(p.nationality));
  add("Gender", escapeHtml(p.gender));
  add("Place of birth", escapeHtml(p.place_of_birth));
  add("Phone", escapeHtml(p.phone));
  if (p.email) add("Email", `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>`);
  if (p.linkedin_url) add("LinkedIn", `<a href="${escapeHtml(p.linkedin_url)}">${escapeHtml(p.linkedin_url)}</a>`);
  add("Address", escapeHtml(p.address));

  // Distribute across rows of ~2 items for compactness
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const chunk = items.slice(i, i + 2).join("");
    rows.push(`<div class="row"${i ? ' style="margin-top:3px;"' : ''}>${chunk}</div>`);
  }

  const photo = p.avatar_url
    ? `<img src="${escapeHtml(p.avatar_url)}" alt="${escapeHtml(p.full_name)}" />`
    : `<div class="photo-empty">Photo</div>`;

  return `
<div class="header">
  <div class="photo-circle">${photo}</div>
  <div class="header-right">
    <div class="header-name">${escapeHtml(p.full_name || "")}</div>
    <div class="header-details">${rows.join("")}</div>
  </div>
</div>`;
}

function sectionWrap(title: string, body: string): string {
  if (!body.trim()) return "";
  return `
<div class="section">
  <div class="sec-head"><div class="sec-dot"></div><h2>${escapeHtml(title)}</h2></div>
  ${body}
</div>`;
}

// ─── Education ──────────────────────────────────────────────────────────────
function buildEducation(eds: any[]): string {
  if (!eds?.length) return "";
  const body = eds.map(edu => {
    const titleParts = [edu.degree_title, edu.field_of_study].filter(Boolean).map(escapeHtml);
    const title = titleParts.join(" – ");
    const dates = fmtYearRange(edu.start_year, edu.end_year, edu.start_date, edu.end_date);
    const inst = [edu.institution, edu.city, edu.country].filter(Boolean).map(escapeHtml).join(", ");

    const metaBits: string[] = [];
    const grade = fmtGrade(edu.final_grade, edu.max_scale, edu.credit_system);
    if (grade) metaBits.push(`<b>Final Grade:</b> ${grade}`);
    if (edu.total_credits) {
      const sys = edu.credit_system ? ` (${escapeHtml(edu.credit_system)})` : "";
      metaBits.push(`<b>Credits:</b> ${escapeHtml(String(edu.total_credits))}${sys}`);
    }
    const subjects = Array.isArray(edu.key_subjects)
      ? edu.key_subjects.join(" · ")
      : (edu.key_subjects || "");
    const subjectsLine = subjects
      ? `<b>Core Areas:</b> ${escapeHtml(subjects)}`
      : "";
    const thesis = edu.thesis_title ? `<b>Thesis:</b> <i>${escapeHtml(edu.thesis_title)}</i>` : "";
    const descLines = toLines(edu.description);
    const descBlock = descLines.length ? descLines.map(l => `• ${escapeHtml(l)}`).join("<br>") : "";

    const metaLines = [metaBits.join(" &nbsp;|&nbsp; "), thesis, subjectsLine, descBlock].filter(Boolean).join("<br>");

    return `
<div class="row-entry">
  <div class="row-top">
    <div class="row-title">${title}</div>
    ${dates ? `<div class="row-date">${dates}</div>` : ""}
  </div>
  ${inst ? `<div class="row-inst">${inst}</div>` : ""}
  ${metaLines ? `<div class="row-meta">${metaLines}</div>` : ""}
</div>`;
  }).join("");
  return sectionWrap("Education and Training", body);
}

// ─── Work ───────────────────────────────────────────────────────────────────
function buildWork(works: any[]): string {
  if (!works?.length) return "";
  const body = works.map(w => {
    const dates = fmtYearRange(undefined, undefined, w.start_date, w.end_date, w.is_current);
    const inst = [w.organisation, w.city_country].filter(Boolean).map(escapeHtml).join(", ");
    const lines = toLines(w.description);
    const desc = lines.length ? lines.join(" · ") : "";
    return `
<div class="row-entry">
  <div class="row-top">
    <div class="row-title">${escapeHtml(w.job_title || "")}</div>
    ${dates ? `<div class="row-date">${dates}</div>` : ""}
  </div>
  ${inst ? `<div class="row-inst">${inst}</div>` : ""}
  ${desc ? `<div class="row-meta">${escapeHtml(desc)}</div>` : ""}
</div>`;
  }).join("");
  return sectionWrap("Work Experience", body);
}

// ─── Publications ───────────────────────────────────────────────────────────
function buildPublications(pubs: any[]): string {
  if (!pubs?.length) return "";
  const body = pubs.map(p => {
    const meta: string[] = [];
    if (p.journal) meta.push(`<b>Journal:</b> ${escapeHtml(p.journal)}`);
    if (p.year) meta.push(`<b>Year:</b> ${escapeHtml(String(p.year))}`);
    if (p.doi_url) meta.push(`<a href="${escapeHtml(p.doi_url)}">${escapeHtml(p.doi_url)}</a>`);
    return `
<div class="row-entry">
  <div class="row-top">
    <div class="row-title">${escapeHtml(p.title || "")}</div>
    ${p.year ? `<div class="row-date">${escapeHtml(String(p.year))}</div>` : ""}
  </div>
  ${meta.length ? `<div class="row-meta">${meta.join(" &nbsp;|&nbsp; ")}</div>` : ""}
</div>`;
  }).join("");
  return sectionWrap("Research Publications", body);
}

// ─── Certifications ─────────────────────────────────────────────────────────
function buildCertifications(certs: any[]): string {
  if (!certs?.length) return "";
  const body = certs.map(c => {
    const meta: string[] = [];
    if (c.institution) meta.push(`<b>Issued by:</b> ${escapeHtml(c.institution)}`);
    if (c.date) meta.push(`<b>Date:</b> ${escapeHtml(c.date)}`);
    if (c.description) meta.push(escapeHtml(c.description));
    return `
<div class="cert-item">
  <div class="cert-title">${escapeHtml(c.title || "")}</div>
  ${meta.length ? `<div class="cert-meta">${meta.join(" &nbsp;|&nbsp; ")}</div>` : ""}
</div>`;
  }).join("");
  return sectionWrap("Certificates & Achievements", body);
}

// ─── Languages ──────────────────────────────────────────────────────────────
function buildLanguages(langs: any[]): string {
  if (!langs?.length) return "";
  const mothers = langs.filter(l => l.mother_tongue).map(l => escapeHtml(l.language_name)).join(", ");
  const others = langs.filter(l => !l.mother_tongue);
  const rows = others.map(l => `
<tr>
  <td class="lang-name">${escapeHtml(l.language_name || "")}</td>
  <td>${escapeHtml(l.listening || "—")}</td>
  <td>${escapeHtml(l.reading   || "—")}</td>
  <td>${escapeHtml(l.writing   || "—")}</td>
  <td>${escapeHtml(l.speaking  || "—")}</td>
</tr>`).join("");

  const table = others.length ? `
<table class="lang-table">
  <thead>
    <tr>
      <th class="lang-name-col">Language</th>
      <th>Listening</th>
      <th>Reading</th>
      <th>Writing</th>
      <th>Speaking</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="lang-note">A1–A2: Basic · B1–B2: Independent · C1–C2: Proficient</div>` : "";

  const body = `
${mothers ? `<div class="row-meta" style="margin-bottom:4px;"><b>Mother tongue:</b> ${mothers}</div>` : ""}
${table}`;
  return sectionWrap("Language Skills", body);
}

// ─── Custom (Skills, etc) ───────────────────────────────────────────────────
function buildCustomSections(sections: any[]): string {
  if (!sections?.length) return "";
  return sections.filter(s => s.items?.length).map(section => {
    const groups = section.items.map((item: any, i: number) => {
      const lines = toLines(item.description);
      const txt = lines.length ? lines.join(" · ") : "";
      return `<div class="skill-group"${i ? ' style="margin-top:4px;"' : ''}>
  ${item.label ? `<div class="skill-label">${escapeHtml(item.label)}</div>` : ""}
  ${txt ? `<div class="skill-text">${escapeHtml(txt)}</div>` : ""}
</div>`;
    }).join("");
    return sectionWrap(section.title || "Skills", groups);
  }).join("");
}

// ─── Recommendations ────────────────────────────────────────────────────────
function buildRecommendations(recs: any[]): string {
  if (!recs?.length) return "";
  const cells = recs.map(r => {
    const subline = [r.designation, r.department, r.institution].filter(Boolean).map(escapeHtml).join(" · ");
    const contactBits: string[] = [];
    if (r.email) contactBits.push(`✉ <a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>`);
    if (r.contact) contactBits.push(escapeHtml(r.contact));
    if (r.lor_link) contactBits.push(`<a href="${escapeHtml(r.lor_link)}">LOR</a>`);
    return `
<div class="ref-item">
  <div class="ref-name">${escapeHtml(r.name || "")}</div>
  ${subline ? `${subline}<br>` : ""}
  ${contactBits.join(" &nbsp;|&nbsp; ")}
</div>`;
  }).join("");
  return sectionWrap("Recommendations", `<div class="ref-row">${cells}</div>`);
}

function buildSignature(p: any): string {
  if (!p.signature_url && !p.full_name) return "";
  return `
<div class="sig-wrap">
  <div class="sig-box">
    ${p.signature_url ? `<img src="${escapeHtml(p.signature_url)}" alt="Signature" />` : ""}
    <div class="sig-label">${escapeHtml(p.full_name || "")}</div>
  </div>
</div>`;
}

// ─── CSS ────────────────────────────────────────────────────────────────────
function buildCSS(opts: CVBuildOptions = {}): string {
  const raw = (opts.headerBgColor || "").trim();
  const accent = /^#?[0-9a-fA-F]{3,8}$/.test(raw.replace("#", ""))
    ? (raw.startsWith("#") ? raw : `#${raw}`)
    : "#003399";
  const density = opts.density || "standard";
  const dens = density === "compact"
    ? { fs: "9.2px",  lh: "1.40", padX: "20px", padY: "12px", entryGap: "5px" }
    : density === "expanded"
    ? { fs: "10.6px", lh: "1.55", padX: "26px", padY: "18px", entryGap: "8px" }
    : { fs: "9.8px",  lh: "1.45", padX: "22px", padY: "14px", entryGap: "6px" };

  return `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4 portrait; margin: 0; }
:root { --accent: ${accent}; --accent-light: #ffffff; }

*, *::before, *::after {
  margin: 0; padding: 0; box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

html, body {
  font-family: 'Calibri', 'Open Sans', Arial, sans-serif;
  font-size: ${dens.fs};
  color: #1a1a1a;
  background: #fff;
  line-height: ${dens.lh};
  -webkit-font-smoothing: antialiased;
}

.page {
  width: 100%;
  background: #fff;
  padding: ${dens.padY} ${dens.padX};
}

/* HEADER */
.header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--accent);
  color: #fff;
  padding: 12px 16px;
  border-radius: 3px;
  margin-bottom: 11px;
}
.photo-circle {
  width: 82px; height: 82px;
  border-radius: 50%;
  border: 2.5px solid #fff;
  overflow: hidden; flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  background: #ccc;
  display: flex; align-items: center; justify-content: center;
}
.photo-circle img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
.photo-empty { color: #fff; font-size: 9px; opacity: 0.85; }
.header-right { flex: 1; }
.header-name {
  font-size: 22px; font-weight: 700; letter-spacing: 0.4px;
  color: #fff; margin-bottom: 6px;
}
.header-details { font-size: 9px; color: var(--accent-light); line-height: 1.6; opacity: 0.95; }
.header-details .row { display: flex; flex-wrap: wrap; gap: 2px 18px; }
.hd-item { display: inline; }
.hd-label { font-weight: 700; color: #fff; }
.header-details a { color: #fff; text-decoration: underline; }

/* SECTION */
.section { margin-bottom: 9px; page-break-inside: auto; }
.sec-head {
  display: flex; align-items: center; gap: 6px;
  border-bottom: 1.5px solid var(--accent);
  padding-bottom: 2px; margin-bottom: 5px;
  page-break-after: avoid; break-after: avoid;
}
.sec-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.sec-head h2 {
  font-size: 9.5px; font-weight: 700; color: var(--accent);
  letter-spacing: 0.9px; text-transform: uppercase;
}

/* ROW ENTRY */
.row-entry {
  margin-bottom: ${dens.entryGap}; padding-bottom: ${dens.entryGap};
  border-bottom: 1px solid #f0f0f0;
  page-break-inside: avoid; break-inside: avoid;
}
.row-entry:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.row-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; gap: 8px; }
.row-title { font-weight: 700; font-size: 10px; color: var(--accent); }
.row-date  { font-size: 8.8px; color: #555; white-space: nowrap; margin-left: 8px; }
.row-inst  { font-size: 9px; color: #333; font-style: italic; margin-bottom: 2px; }
.row-meta  { font-size: 9px; color: #444; line-height: 1.5; }
.row-meta b { color: #222; }
.row-meta a { color: var(--accent); text-decoration: none; }

/* CERT */
.cert-item { margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px solid #f0f0f0; }
.cert-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.cert-title { font-weight: 700; font-size: 9.8px; color: var(--accent); }
.cert-meta  { font-size: 9px; color: #444; line-height: 1.5; }
.cert-meta b { color: #222; }

/* LANGUAGE TABLE — strictly L/R/W/S */
.lang-table { width: 100%; border-collapse: collapse; font-size: 8.8px; margin-top: 3px; page-break-inside: avoid; }
.lang-table th {
  background: var(--accent); color: #fff;
  padding: 3px 6px; text-align: center; font-size: 8.3px; font-weight: 600;
}
.lang-table th.lang-name-col { text-align: left; width: 70px; }
.lang-table td { padding: 3px 6px; text-align: center; border-bottom: 1px solid #e8e8e8; }
.lang-table td.lang-name { text-align: left; font-weight: 700; color: var(--accent); }
.lang-table tr:nth-child(even) td { background: #f5f8ff; }
.lang-note { font-size: 7.8px; color: #777; margin-top: 3px; font-style: italic; }

/* SKILLS */
.skill-group { margin-bottom: 4px; }
.skill-label { font-weight: 700; font-size: 9px; color: var(--accent); margin-bottom: 1px; }
.skill-text  { font-size: 9px; color: #444; line-height: 1.5; }

/* REFS */
.ref-row { display: flex; flex-direction: column; gap: 6px; }
.ref-item { padding-bottom: 5px; border-bottom: 1px solid #f0f0f0; }
.ref-item:last-child { border-bottom: none; padding-bottom: 0; }
.ref-item { font-size: 9px; color: #444; line-height: 1.55; }
.ref-name { font-weight: 700; font-size: 9.5px; color: var(--accent); }
.ref-item a { color: var(--accent); text-decoration: none; }

/* SIGNATURE */
.sig-wrap { display: flex; justify-content: flex-end; margin-top: 8px; page-break-inside: avoid; }
.sig-box { text-align: center; }
.sig-box img { height: 40px; object-fit: contain; display: block; margin: 0 auto 2px; }
.sig-label { font-size: 8px; color: #555; border-top: 1px solid #bbb; padding-top: 2px; font-style: italic; }

/* SCREEN PREVIEW — single page, no extra blank canvas */
@media screen {
  html, body { background: #fff; }
  .page { width: 100%; max-width: 100%; margin: 0; box-shadow: none; }
}
</style>`;
}

// ─── Main ───────────────────────────────────────────────────────────────────
export function buildCVHtml(
  personal: any,
  educations: any[] = [],
  workExperiences: any[] = [],
  languages: any[] = [],
  publications: any[] = [],
  certifications: any[] = [],
  customSections: any[] = [],
  recommendations: any[] = [],
  options: CVBuildOptions = {},
): string {
  const order = options.sectionOrder || ["work", "publications", "certifications", "languages", "custom", "recommendations"];
  const map: Record<string, string> = {
    work:            buildWork(workExperiences),
    publications:    buildPublications(publications),
    certifications:  buildCertifications(certifications),
    languages:       buildLanguages(languages),
    custom:          buildCustomSections(customSections),
    recommendations: buildRecommendations(recommendations),
  };
  const body = order.map(k => map[k] || "").filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(personal.full_name || "Curriculum Vitae")} – Curriculum Vitae</title>
${buildCSS(options)}
</head>
<body>
<div class="page">
  ${buildHeader(personal)}
  ${buildEducation(educations)}
  ${body}
  ${buildSignature(personal)}
</div>
</body>
</html>`;
}
