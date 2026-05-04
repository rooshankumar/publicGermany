// supabase/functions/generate-academic-cv-pdf/cvTemplateBuilder.ts
// @ts-nocheck

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE RESPONSIBILITY — this file only turns clean data into clean HTML.
// No HTML parsing. No rendering tricks. No font sentinels.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 1. Safety helper — escape only, zero logic
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Data Types (shared with frontend importer)
// ─────────────────────────────────────────────────────────────────────────────

export interface CVPersonalInfo {
  full_name: string
  email?: string
  phone?: string
  address?: string
  linkedin_url?: string
  avatar_url?: string
  signature_url?: string
  passport_number?: string
  date_of_birth?: string
  place_of_birth?: string
  nationality?: string
  gender?: string
}

export interface CVEducation {
  degree_title: string
  field_of_study?: string
  institution: string
  country?: string
  start_year?: number
  end_year?: number
  start_date?: string
  end_date?: string
  key_subjects?: string[] | string
  final_grade?: string
  max_scale?: number
  total_credits?: number
  credit_system?: string
  thesis_title?: string
  website_url?: string
}

export interface CVWorkExperience {
  job_title: string
  organisation: string
  city_country?: string
  start_date: string
  end_date?: string
  is_current?: boolean
  description?: string[] | string
}

export interface CVLanguage {
  language_name: string
  mother_tongue?: boolean
  listening?: string
  reading?: string
  writing?: string
  speaking?: string
}

export interface CVCertification {
  title: string
  institution?: string
  date?: string
}

export interface CVPublication {
  title: string
  year: string
  journal?: string
  doi_url?: string
}

export interface CVCustomSection {
  title: string
  items: {
    label: string
    description?: string[] | string
  }[]
}

export interface CVRecommendation {
  name: string
  designation?: string
  department?: string
  institution?: string
  email?: string
  lor_link?: string
  contact?: string
}

export interface CVBuildOptions {
  headerBgColor?: string
  density?: "compact" | "standard" | "expanded"
  sectionOrder?: string[]
}
// Photo box (square, teal border), dark-teal name, contact grid,
// section title with bullet dot + bottom rule, language table with
// merged Understanding/Speaking/Writing headers, dot-separated bullets.

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function escapeHtml(v: string | null | undefined): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function toLines(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v ?? "").trim()).filter(Boolean);
  let text = String(value);
  text = text
    .replace(/\s+style\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+style\s*=\s*'[^']*'/gi, "")
    .replace(/\s+class\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+class\s*=\s*'[^']*'/gi, "")
    .replace(/\s+[\w:-]+\s*=\s*"[^"]*"/g, "")
    .replace(/\s+[\w:-]+\s*=\s*'[^']*'/g, "")
    .replace(/<\/(?:p|div|li|h[1-6]|br)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&ndash;/g, "–").replace(/&mdash;/g, "—");
  return text.split(/\r?\n/)
    .map(l => l.replace(/^\s*[-*•·]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return "";
  const s = String(v).trim();
  if (/^\d{4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [yr, mo] = s.split("-").map(Number);
    if (mo >= 1 && mo <= 12)
      return `${new Date(yr, mo - 1).toLocaleString("en-US", { month: "short" })} ${yr}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00`);
    if (!isNaN(d.getTime()))
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  const fb = new Date(s);
  if (!isNaN(fb.getTime()))
    return fb.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return escapeHtml(s);
}

function fmtDOB(v: string | null | undefined): string {
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
  if (max && max > 0)   return `${escapeHtml(grade)} / ${max}`;
  return escapeHtml(grade);
}

function bullets(lines: string[], cls = "blist"): string {
  if (!lines.length) return "";
  return `<ul class="${cls}">${lines.map(l => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`;
}

function richOrBullets(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string" && /<\/?(p|ul|ol|li|strong|em|b|i|u|br)/i.test(value)) {
    return value; // rich html from editor
  }
  return bullets(toLines(value));
}

// ─── Section: Header ─────────────────────────────────────────────────────────
function buildHeader(personal: any): string {
  const items: Array<[string, string]> = [];
  if (personal.passport_number) items.push(["Passport", escapeHtml(personal.passport_number)]);
  if (personal.date_of_birth)   items.push(["Date of birth", fmtDOB(personal.date_of_birth)]);
  if (personal.place_of_birth)  items.push(["Place of birth", escapeHtml(personal.place_of_birth)]);
  if (personal.nationality)     items.push(["Nationality", escapeHtml(personal.nationality)]);
  if (personal.gender)          items.push(["Gender", escapeHtml(personal.gender)]);
  if (personal.phone)           items.push(["Phone", escapeHtml(personal.phone)]);
  if (personal.email)           items.push(["Email address", `<a href="mailto:${escapeHtml(personal.email)}">${escapeHtml(personal.email)}</a>`]);
  if (personal.linkedin_url)    items.push(["LinkedIn", `<a href="${escapeHtml(personal.linkedin_url)}">${escapeHtml(personal.linkedin_url)}</a>`]);
  if (personal.address)         items.push(["Address", escapeHtml(personal.address)]);

  const grid = items.map(([k, v]) =>
    `<div class="contact-item"><span class="label">${k}:</span><span class="value">${v}</span></div>`
  ).join("");

  const photo = personal.avatar_url
    ? `<div class="photo-box"><img src="${escapeHtml(personal.avatar_url)}" alt="Photo"></div>`
    : `<div class="photo-box photo-empty">Photo</div>`;

  return `
<div class="header">
  ${photo}
  <div class="header-info">
    <div class="header-name">${escapeHtml(personal.full_name)}</div>
    <div class="contact-grid">${grid}</div>
  </div>
</div>`;
}

// ─── Section wrapper with dot title ──────────────────────────────────────────
function sectionWrap(title: string, body: string): string {
  if (!body.trim()) return "";
  return `
<div class="section">
  <div class="section-title"><span class="section-dot"></span><h2>${escapeHtml(title)}</h2></div>
  ${body}
</div>`;
}

// ─── Education ───────────────────────────────────────────────────────────────
function buildEducation(eds: any[]): string {
  if (!eds.length) return "";
  const body = eds.map(edu => {
    const title = escapeHtml((edu.degree_title ?? "").trim()).toUpperCase()
      + (edu.field_of_study ? ` – ${escapeHtml((edu.field_of_study ?? "").trim()).toUpperCase()}` : "");
    const start = fmtDate(edu.start_date) || escapeHtml(String(edu.start_year ?? ""));
    const end   = fmtDate(edu.end_date)   || escapeHtml(String(edu.end_year   ?? ""));
    const dates = [start, end].filter(Boolean).join(" – ");

    const inst = `${escapeHtml(edu.institution || "")}${edu.country ? `, ${escapeHtml(edu.country)}` : ""}`;
    const headerRow = `<div class="entry-row"><div class="entry-left">${title}${inst ? ` <span class="entry-inst">— ${inst}</span>` : ""}</div>${dates ? `<div class="entry-dates">${dates}</div>` : ""}</div>`;

    const metaParts: string[] = [];
    if (edu.website_url)   metaParts.push(`<span class="edu-meta-item"><span>Website</span> <a href="${escapeHtml(edu.website_url)}">${escapeHtml(edu.website_url)}</a></span>`);
    const grade = fmtGrade(edu.final_grade, edu.max_scale, edu.credit_system);
    if (grade)             metaParts.push(`<span class="edu-meta-item"><span>Final grade</span> ${grade}</span>`);
    if (edu.credit_system) metaParts.push(`<span class="edu-meta-item"><span>Type of credits</span> ${escapeHtml(edu.credit_system)}</span>`);
    if (edu.total_credits) metaParts.push(`<span class="edu-meta-item"><span>Number of credits</span> ${escapeHtml(String(edu.total_credits))}</span>`);
    const meta = metaParts.length ? `<div class="edu-meta">${metaParts.join("")}</div>` : "";

    const thesis = edu.thesis_title ? `<div class="edu-meta-item"><span>Thesis:</span> <i>${escapeHtml(edu.thesis_title)}</i></div>` : "";

    let desc = "";
    if (edu.description) {
      desc = `<div class="edu-desc">${typeof edu.description === "string" && /<\/?(p|ul|ol|li|strong|em|b|i|u|br)/i.test(edu.description) ? edu.description : bullets(toLines(edu.description))}</div>`;
    } else if (edu.key_subjects) {
      const subjects = Array.isArray(edu.key_subjects) ? edu.key_subjects.join(", ") : String(edu.key_subjects);
      desc = `<div class="edu-desc"><strong>Core Areas:</strong> ${escapeHtml(subjects)}</div>`;
    }

    return `
<div class="edu-entry">
  ${headerRow}
  ${meta}
  ${thesis}
  ${desc}
</div>`;
  }).join("");

  return sectionWrap("Education and Training", body);
}

// ─── Work ────────────────────────────────────────────────────────────────────
function buildWork(works: any[]): string {
  if (!works.length) return "";
  const body = works.map(w => {
    const start = fmtDate(w.start_date);
    const end   = w.is_current ? "Present" : fmtDate(w.end_date);
    const dates = [start, end].filter(Boolean).join(" – ");
    const title = escapeHtml(w.job_title || "").toUpperCase();
    const org   = [w.organisation, w.city_country].filter(Boolean).map(escapeHtml).join(", ");
    return `
<div class="edu-entry">
  <div class="entry-row"><div class="entry-left">${title}${org ? ` <span class="entry-inst">— ${org}</span>` : ""}</div>${dates ? `<div class="entry-dates">${dates}</div>` : ""}</div>
  ${w.description ? `<div class="edu-desc">${richOrBullets(w.description)}</div>` : ""}
</div>`;
  }).join("");
  return sectionWrap("Work Experience", body);
}

// ─── Publications ────────────────────────────────────────────────────────────
function buildPublications(pubs: any[]): string {
  if (!pubs.length) return "";
  const body = pubs.map(p => `
<div class="edu-entry">
  <div class="edu-header"><div class="edu-degree">${escapeHtml(p.title)}${p.year ? ` | ${escapeHtml(String(p.year))}` : ""}</div></div>
  ${p.journal ? `<div class="edu-institution">${escapeHtml(p.journal)}</div>` : ""}
  ${p.doi_url ? `<div class="edu-meta-item"><a href="${escapeHtml(p.doi_url)}">${escapeHtml(p.doi_url)}</a></div>` : ""}
</div>`).join("");
  return sectionWrap("Research Publications", body);
}

// ─── Languages ───────────────────────────────────────────────────────────────
function buildLanguages(langs: any[]): string {
  if (!langs.length) return "";
  const mothers = langs.filter(l => l.mother_tongue)
    .map(l => escapeHtml(l.language_name).toUpperCase()).join(", ");
  const others = langs.filter(l => !l.mother_tongue);

  const rows = others.map(l => `
<tr>
  <td class="lang-name">${escapeHtml(l.language_name).toUpperCase()}</td>
  <td>${escapeHtml(l.listening ?? "") || "—"}</td>
  <td>${escapeHtml(l.reading ?? "")   || "—"}</td>
  <td>${escapeHtml(l.writing ?? "")   || "—"}</td>
  <td>${escapeHtml(l.speaking ?? "")  || "—"}</td>
</tr>`).join("");

  const table = others.length ? `
<table class="lang-table">
  <thead>
    <tr>
      <th class="lang-name-header">LANGUAGE</th>
      <th>LISTENING</th><th>READING</th><th>WRITING</th><th>SPEAKING</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="lang-note">CEFR Levels: A1/A2 Basic · B1/B2 Independent · C1/C2 Proficient</div>
` : "";

  const body = `
${mothers ? `<div class="mother-tongue"><strong>Mother tongue(s):</strong> ${mothers}</div>` : ""}
${others.length ? `<div class="other-lang"><strong>Other language(s):</strong></div>` : ""}
${table}`;

  return sectionWrap("Language Skills", body);
}

// ─── Certifications ──────────────────────────────────────────────────────────
function buildCertifications(certs: any[]): string {
  if (!certs.length) return "";
  const lines = certs.map(c => {
    const d = fmtDate(c.date);
    return `${c.title}${c.institution ? ` – ${c.institution}` : ""}${d ? ` (${d})` : ""}`;
  });
  return sectionWrap("Certifications", bullets(lines));
}

// ─── Custom sections ─────────────────────────────────────────────────────────
function buildCustomSections(sections: any[]): string {
  return sections.filter(s => s.items?.length).map(section => {
    const isTwoCol = (section.items?.length || 0) >= 2 && /skills|tools|knowledge/i.test(section.title || "");
    const items = section.items.map((item: any) => {
      const lbl = item.label ? `<div class="skill-group-title">${escapeHtml(item.label)}</div>` : "";
      const desc = item.description ? `<div class="entry-desc">${richOrBullets(item.description)}</div>` : "";
      return `<div class="skill-group">${lbl}${desc}</div>`;
    }).join("");
    const body = isTwoCol ? `<div class="skills-grid">${items}</div>` : items;
    return sectionWrap(section.title, body);
  }).join("");
}

// ─── Recommendations ─────────────────────────────────────────────────────────
function buildRecommendations(recs: any[]): string {
  if (!recs.length) return "";
  const body = recs.map(r => {
    const subline = [r.designation, r.department, r.institution].filter(Boolean).map(escapeHtml).join(", ");
    const contactBits: string[] = [];
    if (r.email)    contactBits.push(`✉ <a href="mailto:${escapeHtml(r.email)}" class="rec-link">${escapeHtml(r.email)}</a>`);
    if (r.contact)  contactBits.push(`Mobile: ${escapeHtml(r.contact)}`);
    if (r.lor_link) contactBits.push(`<a href="${escapeHtml(r.lor_link)}" class="rec-link">LOR</a>`);
    return `
<div class="rec-entry">
  <div class="rec-name">${escapeHtml(r.name)}${r.designation ? `, ${escapeHtml(r.designation)}` : ""}</div>
  ${subline && subline !== escapeHtml(r.designation || "") ? `<div class="rec-detail">${subline}</div>` : ""}
  ${contactBits.length ? `<div class="rec-detail">${contactBits.join("  |  ")}</div>` : ""}
</div>`;
  }).join("<hr class=\"thin\">");
  return sectionWrap("Recommendations", body);
}

function buildFooter(personal: any): string {
  if (!personal.signature_url) return "";
  return `
<div class="footer">
  <img src="${escapeHtml(personal.signature_url)}" alt="Signature" class="sig-img">
  <div class="sig-name">(${escapeHtml(personal.full_name)})</div>
</div>`;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
function buildCSS(opts: CVBuildOptions = {}): string {
  const raw = (opts.headerBgColor || '').toString().trim();
  const headerBg = /^#?[0-9a-fA-F]{3,8}$/.test(raw.replace('#',''))
    ? (raw.startsWith('#') ? raw : `#${raw}`)
    : '';
  const hasHeaderBg = !!headerBg;
  const accent = '#1a3a4a';
  const density = opts.density || 'standard';
  const dens = density === 'compact'
    ? { fs: '9.5px', lh: '1.4',  sec: '10px', name: '23px', entryGap: '7px' }
    : density === 'expanded'
    ? { fs: '11.5px', lh: '1.65', sec: '18px', name: '28px', entryGap: '12px' }
    : { fs: '10.5px', lh: '1.5',  sec: '14px', name: '26px', entryGap: '10px' };

  // When header has bg, text/labels/links inside header turn white for contrast
  const headerOverride = hasHeaderBg ? `
.header { background: ${headerBg}; padding: 10mm 9mm; margin: -8mm -9mm ${dens.sec} -9mm; }
.header .header-name { color: #fff; }
.header .contact-item { color: #fff; }
.header .contact-item .label { color: #fff; opacity: 0.85; }
.header .contact-item a { color: #fff; text-decoration: underline; }
.header .photo-box { border-color: #fff; }
` : '';

  return `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4 portrait; margin: 0; }

:root { --accent: ${accent}; }


*, *::before, *::after {
  margin: 0; padding: 0; box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
h1,h2,h3,h4,h5,h6,p { margin: 0; padding: 0; }

html, body {
  font-family: 'Open Sans', Arial, sans-serif;
  font-size: ${dens.fs};
  color: #2c2c2c;
  background: #fff;
  line-height: ${dens.lh};
  -webkit-font-smoothing: antialiased;
}

.cv-wrap { width: 100%; background: #fff; padding: 8mm 9mm; }

/* HEADER */
.header {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: ${dens.sec};
  padding-bottom: 10px;
}
.photo-box {
  width: 96px; height: 96px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  flex-shrink: 0; overflow: hidden;
  background: #e8f0f5;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; color: #888;
}
.photo-box img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.header-info { flex: 1; }
.header-name {
  font-size: ${dens.name}; font-weight: 700;
  color: var(--accent); letter-spacing: 0.5px;
  margin-bottom: 10px; line-height: 1.1;
}
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 20px;
}
.contact-item {
  font-size: 9.5px; color: #333;
  display: flex; gap: 5px;
  word-break: break-word;
}
.contact-item .label { font-weight: 700; color: var(--accent); flex-shrink: 0; }
.contact-item a { color: var(--accent); text-decoration: none; }

/* SECTION */
.section { margin-bottom: ${dens.sec}; page-break-inside: auto; }
.section-title {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #d0d0d0;
  padding-bottom: 4px;
  page-break-after: avoid; break-after: avoid;
}
.section-dot {
  width: 10px; height: 10px;
  border-radius: 50%; background: var(--accent);
  flex-shrink: 0;
}
.section-title h2 {
  font-size: 11.5px; font-weight: 700;
  color: var(--accent); letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* ENTRY */
.edu-entry {
  margin-bottom: ${dens.entryGap}; padding-bottom: 8px;
  page-break-inside: avoid; break-inside: avoid;
}
.edu-entry + .edu-entry { border-top: 1px dashed #ececec; padding-top: 8px; }

.entry-row {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 12px; margin-bottom: 2px;
}
.entry-left {
  font-weight: 700; font-size: 10.5px; color: var(--accent);
  text-transform: uppercase; letter-spacing: 0.3px;
  flex: 1;
}
.entry-inst {
  font-weight: 500; font-style: italic; color: #444; text-transform: none; letter-spacing: 0;
}
.entry-dates {
  font-size: 9.5px; color: var(--accent); font-weight: 600;
  white-space: nowrap; flex-shrink: 0;
}

.edu-meta { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-bottom: 5px; margin-top: 3px; }
.edu-meta-item { font-size: 9px; color: #555; }
.edu-meta-item span { font-weight: 700; color: var(--accent); }

.edu-desc, .entry-desc {
  font-size: 9.5px; color: #444; line-height: 1.55; margin-top: 3px;
}
.edu-desc strong, .entry-desc strong { color: var(--accent); font-weight: 700; }
.edu-desc p, .entry-desc p { margin: 2px 0; }
.edu-desc ul, .entry-desc ul, .blist {
  list-style: none; padding-left: 0; margin: 3px 0;
}
.edu-desc ol, .entry-desc ol { list-style: decimal; padding-left: 16px; margin: 3px 0; }
.edu-desc li, .entry-desc li, .blist li {
  font-size: 9.5px; color: #444;
  padding-left: 12px; position: relative;
  margin-bottom: 2px; line-height: 1.5;
}
.edu-desc li::before, .entry-desc li::before, .blist li::before {
  content: '•'; position: absolute; left: 0;
  color: var(--accent); font-size: 11px; line-height: 1;
}

/* LANGUAGE TABLE */
.mother-tongue, .other-lang { font-size: 10px; margin-bottom: 4px; }
.mother-tongue strong, .other-lang strong { color: var(--accent); }
.lang-table {
  width: 100%; border-collapse: collapse;
  font-size: 9px; margin-top: 4px;
  page-break-inside: avoid;
}
.lang-table th {
  background: var(--accent); color: #fff;
  padding: 5px 6px; text-align: center;
  font-weight: 600; font-size: 8.5px;
  border: 1px solid var(--accent);
}
.lang-table th.lang-name-header { text-align: left; padding-left: 8px; }
.lang-table td {
  padding: 5px 6px; text-align: center;
  border-bottom: 1px solid #e8e8e8;
  border-right: 1px solid #e8e8e8;
  font-size: 9px;
}
.lang-table td.lang-name { text-align: left; font-weight: 700; color: var(--accent); padding-left: 8px; }
.lang-table tr:nth-child(even) td { background: #f7f9fb; }
.lang-note { font-size: 8px; color: #777; margin-top: 5px; font-style: italic; }

/* SKILLS GRID */
.skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 20px;
}
.skill-group-title { font-weight: 700; font-size: 9.5px; color: var(--accent); margin-bottom: 2px; }

/* RECOMMENDATIONS */
.rec-entry { margin-bottom: 8px; font-size: 9.5px; }
.rec-name  { font-weight: 700; color: var(--accent); font-size: 10px; }
.rec-detail { color: #555; }
.rec-link  { color: var(--accent); text-decoration: none; font-size: 9px; }
hr.thin    { border: none; border-top: 1px solid #e0e0e0; margin: 8px 0; }

/* FOOTER */
.footer { margin-top: 18px; text-align: right; page-break-inside: avoid; }
.sig-img { max-width: 110px; height: auto; filter: grayscale(1); }
.sig-name { font-weight: 700; font-size: 10px; margin-top: 2px; color: var(--accent); }

/* LINKS */
a { color: var(--accent); text-decoration: none; }

/* SCREEN PREVIEW */
@media screen {
  html, body { background: #fff; }
  .cv-wrap {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 8mm 9mm;
    box-shadow: none;
    border-radius: 0;
  }
}
</style>`;
}

// ─── Main assembler ──────────────────────────────────────────────────────────
export function buildCVHtml(
  personal: any,
  educations: any[],
  workExperiences: any[],
  languages: any[],
  publications: any[],
  certifications: any[],
  customSections: any[] = [],
  recommendations: any[] = [],
  options: any = {},
): string {
  const { sectionOrder = ["work", "publications", "languages", "certifications", "custom", "recommendations"] } = options;

  const sectionMap: Record<string, string> = {
    work:            buildWork(workExperiences),
    publications:    buildPublications(publications),
    languages:       buildLanguages(languages),
    certifications:  buildCertifications(certifications),
    custom:          buildCustomSections(customSections),
    recommendations: buildRecommendations(recommendations),
  };
  const bodySections = sectionOrder.map((k: string) => sectionMap[k] ?? "").filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(personal.full_name)} – Curriculum Vitae</title>
${buildCSS(options)}
</head>
<body>
<div class="cv-wrap">
  ${buildHeader(personal)}
  ${buildEducation(educations)}
  ${bodySections}
  ${buildFooter(personal)}
</div>
</body>
</html>`;
}
