// supabase/functions/generate-academic-cv-pdf/cvTemplateBuilder.ts
// @ts-nocheck

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE RESPONSIBILITY — this file only turns clean data into clean HTML.
// No HTML parsing. No rendering tricks. No font sentinels.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 1. Safety helper — escape only, zero logic
// ─────────────────────────────────────────────────────────────────────────────

export function escapeHtml(v: string | null | undefined): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Data normaliser — converts any field to string[]
//
// Priority order:
//   A) Already a clean array  → use directly       (new data format)
//   B) Plain text with \n     → split on newlines   (textarea input)
//   C) Legacy rich-text HTML  → strip tags, split   (old data)
// ─────────────────────────────────────────────────────────────────────────────

export function toLines(value: unknown): string[] {
  if (!value) return [];

  // A — already a clean array (ideal format)
  if (Array.isArray(value)) {
    return value.map(v => String(v ?? "").trim()).filter(Boolean);
  }

  let text = String(value);

  // C — strip HTML (order is critical)
  //
  // IMPORTANT: Strip attributes BEFORE decoding &quot; entities.
  // Tailwind stores style="...font-family: customFont, &quot;customFont Fallback&quot;..."
  // If we decode &quot;→" first, the [^"]* regex terminates at the internal quote
  // and leaves the rest of the style blob intact as raw text.
  // Stripping attrs while &quot; is still encoded means " always marks attr boundaries.

  // Step 1: strip style="" and class="" by name (contain Tailwind --tw-* blobs)
  text = text
    .replace(/\s+style\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+style\s*=\s*'[^']*'/gi, "")
    .replace(/\s+class\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+class\s*=\s*'[^']*'/gi, "");

  // Step 2: strip all remaining attributes (data-*, aria-*, id=, etc.)
  text = text
    .replace(/\s+[\w:-]+\s*=\s*"[^"]*"/g, "")
    .replace(/\s+[\w:-]+\s*=\s*'[^']*'/g, "");

  // Step 3: convert block-level closing tags to newlines, then strip all remaining tags
  text = text
    .replace(/<\/(?:p|div|li|h[1-6]|br)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "");

  // Step 4: decode HTML entities (safe to do now — all attr blobs are gone)
  text = text
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&ndash;/g, "–").replace(/&mdash;/g, "—");

  // B — split on newlines, strip leading bullet chars
  return text
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*[-*•·]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Date helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(v: string | null | undefined): string {
  if (!v) return "";
  const s = String(v).trim();
  const my = s.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (my) {
    const m = new Date(`${my[1]} 1 2000`).toLocaleString("en-US", { month: "short" });
    return m !== "Invalid Date" ? `${m} ${my[2]}` : s;
  }
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
  const n   = Number(grade);
  const pct = (system ?? "").toLowerCase().includes("percent") || max === 100;
  if (pct && !isNaN(n)) return `Grade: ${Math.min(Math.max(n, 0), 100)}%`;
  if (max && max > 0)   return `Grade: ${escapeHtml(grade)} / ${max}`;
  return `Grade: ${escapeHtml(grade)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bullet renderer — caller provides string[], we render only
// ─────────────────────────────────────────────────────────────────────────────

function bullets(lines: string[], cls = "blist"): string {
  if (!lines.length) return "";
  return `<ul class="${cls}">${lines.map(l => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Section builders — one function per section
// ─────────────────────────────────────────────────────────────────────────────

function buildHeader(personal: any, headerBgColor: string): string {
  const r1: string[] = [];
  const r2: string[] = [];
  const r3: string[] = [];

  if (personal.passport_number) r1.push(`<b>Passport:</b> ${escapeHtml(personal.passport_number)}`);
  if (personal.date_of_birth)   r1.push(`<b>Date of Birth:</b> ${fmtDOB(personal.date_of_birth)}`);
  if (personal.place_of_birth)  r1.push(`<b>Place of Birth:</b> ${escapeHtml(personal.place_of_birth)}`);

  if (personal.nationality) r2.push(`<b>Nationality:</b> ${escapeHtml(personal.nationality)}`);
  if (personal.gender)      r2.push(`<b>Gender:</b> ${escapeHtml(personal.gender)}`);
  if (personal.phone)       r2.push(`<b>Phone:</b> ${escapeHtml(personal.phone)}`);
  if (personal.email)       r2.push(`<b>Email:</b> <a href="mailto:${escapeHtml(personal.email)}">${escapeHtml(personal.email)}</a>`);

  if (personal.linkedin_url) r3.push(`<b>LinkedIn:</b> <a href="${escapeHtml(personal.linkedin_url)}" target="_blank">${escapeHtml(personal.linkedin_url)}</a>`);
  if (personal.address)      r3.push(`<b>Address:</b> ${escapeHtml(personal.address)}`);

  const detailRows = [r1, r2, r3]
    .filter(r => r.length)
    .map(r => `<p class="hdr-p">${r.join(` <span class="pipe">|</span> `)}</p>`)
    .join("");

  const pic = personal.avatar_url
    ? `<img src="${escapeHtml(personal.avatar_url)}" alt="Profile" class="pic">` : "";

  // Use a table for header layout — most reliable in headless Chromium PDF renderers
  return `
<div class="hdr" style="background:${headerBgColor};">
  <table class="hdr-table"><tr>
    ${pic ? `<td class="hdr-pic-td"><div class="pic-wrap">${pic}</div></td>` : ""}
    <td class="hdr-text-td">
      <div class="hdr-name">${escapeHtml(personal.full_name)}</div>
      <div class="hdr-rule"></div>
      <div class="hdr-details">${detailRows}</div>
    </td>
  </tr></table>
</div>`;
}

function buildEducation(educations: any[]): string {
  if (!educations.length) return "";
  return `
<div class="section">
  <div class="sec-title">Education and Training</div>
  ${educations.map((edu, idx) => {
    const title   = escapeHtml((edu.degree_title ?? "").trim()).toUpperCase();
    const field   = edu.field_of_study ? ` &ndash; ${escapeHtml((edu.field_of_study ?? "").trim()).toUpperCase()}` : "";
    const start   = fmtDate(edu.start_date) || escapeHtml(String(edu.start_year ?? ""));
    const end     = fmtDate(edu.end_date)   || escapeHtml(String(edu.end_year   ?? ""));
    const creditSys = edu.credit_system ? escapeHtml(edu.credit_system) : "";
    const totalCred = edu.total_credits  ? escapeHtml(String(edu.total_credits)) : "";
    const websiteUrl = edu.website_url   ? escapeHtml(edu.website_url.trim()) : "";
    const thesis  = edu.thesis_title ? `<p class="meta"><b>Thesis:</b> <i>${escapeHtml(edu.thesis_title)}</i></p>` : "";

    // Grade string: "Grade: 8.42 / 10 (Indian Scale)"
    const gradeVal = fmtGrade(edu.final_grade, edu.max_scale, edu.credit_system);
    const gradeStr = gradeVal
      ? `${gradeVal}${creditSys && !gradeVal.includes(creditSys) ? ` (${creditSys})` : ""}`
      : "";
    const credStr  = totalCred ? `Credits: ${totalCred}` : "";

    // Single bottom meta row: Website | Grade (Scale) | Credits
    // All items share one line separated by pipes — compact and easy to scan.
    const metaParts: string[] = [];
    if (websiteUrl) metaParts.push(`<b>Website</b> <a href="${websiteUrl}" target="_blank" style="color:#0b4a8b">${websiteUrl}</a>`);
    if (gradeStr)   metaParts.push(gradeStr);
    if (credStr)    metaParts.push(credStr);
    const metaRow = metaParts.length
      ? `<p class="meta edu-meta-row">${metaParts.join(" &nbsp;|&nbsp; ")}</p>` : "";

    // description: free-form HTML written by user (rich text editor output)
    const descHtml = edu.description
      ? `<div class="edu-desc">${typeof edu.description === "string" ? edu.description : toLines(edu.description).join("<br>")}</div>`
      : "";

    // Divider between entries — not before the first one
    const divider = idx > 0 ? `<hr class="edu-divider">` : "";

    return `${divider}
<div class="entry">
  <table class="row-table"><tr>
    <td class="row-title">${title}${field}</td>
    <td class="row-date">${start} &ndash; ${end}</td>
  </tr></table>
  <p class="sub-info">${escapeHtml(edu.institution)}${edu.country ? `, ${escapeHtml(edu.country)}` : ""}</p>
  ${descHtml}${thesis}${metaRow}
</div>`;
  }).join("")}
</div>`;
}

function buildWork(works: any[]): string {
  if (!works.length) return "";
  return `
<div class="section">
  <div class="sec-title">Work Experience</div>
  ${works.map(w => {
    const title = [w.job_title, w.organisation, w.city_country].filter(Boolean).map(escapeHtml).join(", ");
    const end   = w.is_current ? "Present" : fmtDate(w.end_date);
    const descHtml = w.description
      ? `<div class="entry-desc">${typeof w.description === "string" ? w.description : bullets(toLines(w.description), "blist work-list")}</div>`
      : "";
    return `
<div class="entry">
  <table class="row-table"><tr>
    <td class="row-title">${title}</td>
    <td class="row-date">${fmtDate(w.start_date)} &ndash; ${end}</td>
  </tr></table>
  ${descHtml}
</div>`;
  }).join("")}
</div>`;
}

function buildPublications(pubs: any[]): string {
  if (!pubs.length) return "";
  return `
<div class="section">
  <div class="sec-title">Research Publications</div>
  ${pubs.map(p => `
<div class="entry">
  <table class="row-table"><tr>
    <td class="row-title">${escapeHtml(p.title)}</td>
    <td class="row-date">${escapeHtml(String(p.year ?? ""))}</td>
  </tr></table>
  ${p.journal ? `<p class="sub-info">${escapeHtml(p.journal)}</p>` : ""}
  ${p.doi_url ? `<p class="meta"><a href="${escapeHtml(p.doi_url)}">${escapeHtml(p.doi_url)}</a></p>` : ""}
</div>`).join("")}
</div>`;
}

function buildLanguages(langs: any[]): string {
  if (!langs.length) return "";
  const mothers = langs.filter(l => l.mother_tongue)
    .map(l => escapeHtml(l.language_name).toUpperCase()).join("&nbsp;&nbsp;&nbsp;");
  const others  = langs.filter(l => !l.mother_tongue);

  const tableRows = others.map(l => `
<tr>
  <td class="lang-name">${escapeHtml(l.language_name)}</td>
  <td class="lang-lvl">${escapeHtml(l.listening ?? "") || "&mdash;"}</td>
  <td class="lang-lvl">${escapeHtml(l.reading   ?? "") || "&mdash;"}</td>
  <td class="lang-lvl">${escapeHtml(l.writing   ?? "") || "&mdash;"}</td>
  <td class="lang-lvl">${escapeHtml(l.speaking  ?? "") || "&mdash;"}</td>
</tr>`).join("");

  const table = others.length ? `
<table class="lang-table">
  <colgroup>
    <col style="width:34%">
    <col style="width:16.5%"><col style="width:16.5%">
    <col style="width:16.5%"><col style="width:16.5%">
  </colgroup>
  <thead><tr>
    <th class="lang-th lang-name-th">Language</th>
    <th class="lang-th">Listening</th>
    <th class="lang-th">Reading</th>
    <th class="lang-th">Writing</th>
    <th class="lang-th">Speaking</th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
</table>` : "";

  return `
<div class="section">
  <div class="sec-title">Language Skills</div>
  ${mothers ? `<p class="mother-tongue"><b>Mother Tongue(s):</b>&nbsp;${mothers}</p>` : ""}
  ${table}
</div>`;
}

function buildCertifications(certs: any[]): string {
  if (!certs.length) return "";
  const lines = certs.map(c => {
    const d = fmtDate(c.date);
    return `${escapeHtml(c.title)}${c.institution ? ` | ${escapeHtml(c.institution)}` : ""}${d ? ` | ${d}` : ""}`;
  });
  return `
<div class="section">
  <div class="sec-title">Certifications</div>
  ${bullets(lines, "blist")}
</div>`;
}

function buildCustomSections(sections: any[]): string {
  return sections
    .filter(s => s.items?.length)
    .map(section => {

      const isTech = /technical\s+skills/i.test(section.title);

      const items = section.items
        .map((item: any) => {

          if (isTech) {
            // Tech skills: comma-separated key: value pairs
            const rawDesc = toLines(item.description);

            const vals = rawDesc
              .flatMap(v => v.split(","))
              .map(v => v.trim())
              .filter(Boolean);

            const unique = [...new Set(vals)];

            return `<p class="skills-row"><b>${escapeHtml(item.label ?? "Skills")}:</b> ${unique.map(escapeHtml).join(", ") || "&mdash;"}</p>`;
          }

          // Free-form HTML description
          const descHtml = item.description
            ? (typeof item.description === "string"
                ? item.description
                : bullets(toLines(item.description), "blist"))
            : "";

          if (item.label && descHtml) {
            return `<div class="entry">
  <p class="item-lbl"><b>${escapeHtml(item.label)}</b></p>
  <div class="entry-desc">${descHtml}</div>
</div>`;
          }

          if (item.label) {
            return `<div class="entry"><b>${escapeHtml(item.label)}</b></div>`;
          }

          if (descHtml) {
            return `<div class="entry"><div class="entry-desc">${descHtml}</div></div>`;
          }

          return "";
        })
        .filter(Boolean)
        .join("\n");

      return `
<div class="section">
  <div class="sec-title">${escapeHtml(section.title)}</div>
  ${items}
</div>`;
    })
    .join("\n");
}

function buildRecommendations(recs: any[]): string {
  if (!recs.length) return "";
  return `
<div class="section">
  <div class="sec-title">Recommendations</div>
  ${recs.map(r => `
<div class="entry">
  <p class="rec-name"><b>${escapeHtml(r.name)}</b>${
    [r.designation, r.department, r.institution].filter(Boolean).length
      ? `, ${[r.designation, r.department, r.institution].filter(Boolean).map(escapeHtml).join(", ")}` : ""}</p>
  <p class="rec-contact">
    ${r.email    ? `<b>Email:</b> <a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>` : ""}
    ${r.lor_link ? `&nbsp;&nbsp;<b>LOR:</b> <a href="${escapeHtml(r.lor_link)}" target="_blank">Download Certificate</a>` : ""}
    ${r.contact  ? `&nbsp;&nbsp;<b>Contact No:</b> ${escapeHtml(r.contact)}` : ""}
  </p>
</div>`).join("")}
</div>`;
}

function buildFooter(personal: any): string {
  const sig = personal.signature_url
    ? `<img src="${escapeHtml(personal.signature_url)}" alt="Signature" class="sig-img">` : "";
  return `
<div class="footer">
  <div class="footer-right">
    ${sig}
    <p class="sig-name">(${escapeHtml(personal.full_name)})</p>
  </div>
</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CSS — clean block layout, no flex on root, no viewport meta
// ─────────────────────────────────────────────────────────────────────────────

function buildCSS(headerBgColor: string): string {
  return `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>

/* ── Page ──
   A4 portrait. PDFShift ignores CSS @page size — page dimensions are
   controlled by the format field in the API call (or its A4 default).
   We keep this here for browser print preview accuracy.
*/
@page { size: A4 portrait; margin: 0; }

/* ── Reset ──
   Explicitly reset h1-h6 because headless Chromium UA stylesheet
   assigns margins that the universal * reset misses. This was causing
   the "white line" gap in the header.
*/
*, *::before, *::after {
  margin: 0; padding: 0; box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
h1, h2, h3, h4, h5, h6, p { margin: 0; padding: 0; }

/* Constrain html + body to exactly A4 width.
   Without this, PDFShift's headless Chromium may use a wider default
   viewport, causing cv-wrap to appear centred on a wider-than-A4 page. */
html, body {
  width: 210mm;
  margin: 0;
  padding: 0;
  background: #fff;
  font-family: "Inter", Arial, sans-serif;
  font-size: 10.5px;
  line-height: 1.45;
  color: #111827;
  -webkit-font-smoothing: antialiased;
}

/* ── Root container ──
   display:block — NEVER flex (collapses to zero height in headless Chrome).
   min-height:297mm ensures at least one full A4 page even with sparse content.
   No position:relative needed — footer is in normal flow, JS spacer handles bottom alignment.
*/
.cv-wrap {
  display: block;
  width: 210mm;
  min-height: 297mm;
  background: #fff;
}

/* ── Header ──
   Table layout for the header inner (pic + text columns) is the most
   reliable alignment method in headless Chromium. Flex works in browsers
   but has collapsed in every headless environment we've tested.
*/
.hdr {
  width: 100%;
  padding: 18px 28px 20px 28px;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.hdr-table { width: 100%; border-collapse: collapse; }
.hdr-table td { padding: 0; border: none; vertical-align: top; }
.hdr-pic-td { width: 112px; padding-right: 18px; }
.hdr-text-td { vertical-align: middle; }

/* Profile picture */
.pic-wrap {
  width: 96px; height: 96px;
  border-radius: 50%; overflow: hidden;
  border: 3px solid rgba(255,255,255,0.9);
}
.pic {
  width: 96px; height: 96px;
  display: block; object-fit: cover; object-position: center top;
}

/* Name + details */
.hdr-name {
  font-size: 26px; font-weight: 800;
  color: #fff; text-transform: uppercase;
  letter-spacing: 1px; line-height: 1.15;
  margin-bottom: 6px; word-break: break-word;
}
.hdr-rule  { height: 1px; background: rgba(255,255,255,0.42); margin-bottom: 8px; }
.hdr-details { color: #fff; }
.hdr-p {
  font-size: 10.6px; line-height: 1.65;
  color: #fff; word-break: break-word;
  margin: 0; padding: 0;
}
.hdr-p b    { font-weight: 700; color: rgba(255,255,255,0.82); }
.pipe       { opacity: 0.5; margin: 0 3px; }
.hdr a      { color: #fff; text-decoration: underline; }

/* ── Body — padding-bottom reserves space so content never overlaps the absolute-positioned footer ── */
.cv-body { padding: 8px 28px 8px 28px; }

/* ── Section ── */
.section { margin-bottom: 4px; page-break-inside: avoid; break-inside: avoid; }
.sec-title {
  font-size: 11px; font-weight: 800;
  color: #0b4a8b; text-transform: uppercase; letter-spacing: 0.6px;
  border-bottom: 2px solid #cfd8e8;
  padding-bottom: 4px; margin: 14px 0 7px;
  page-break-after: avoid; break-after: avoid;
}

/* ── Entry row table ──
   A 2-cell table ensures the title takes up all available space and
   the date stays right-aligned — reliably, in every PDF renderer.
   This avoids the flex space-between approach that fails in some versions
   of headless Chromium.
*/
.entry { margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid; }
.row-table { width: 100%; border-collapse: collapse; table-layout: auto; }
.row-table td { padding: 0; border: none; vertical-align: baseline; }
.row-title {
  font-weight: 700; font-size: 11px; color: #111827;
  word-break: break-word; text-align: left;
  word-spacing: 1px; /* prevents Inter font kerning word-merges (e.g. "BACHELOROF") in Chromium PDF */
}
.row-date {
  font-weight: 600; font-size: 10px; color: #374151;
  white-space: nowrap; text-align: right; padding-left: 8px;
}
.sub-info { font-style: italic; font-size: 10.2px; color: #374151; margin: 2px 0 1px; }
.meta     { font-size: 10px; color: #111; margin: 2px 0; line-height: 1.5; }
.edu-meta-row { font-size: 10px; color: #111; margin: 4px 0 1px; }

/* Divider between education entries — not shown before the first entry */
.edu-divider {
  border: none;
  border-top: 1.5px solid #c5d0de;
  margin: 11px 0 12px;
}

/* Free-form rich text description — renders HTML as-is */
.edu-desc, .entry-desc {
  font-size: 10.5px; line-height: 1.5;
  margin: 4px 0 2px;
}
.edu-desc p, .entry-desc p { margin: 2px 0; }
/* Rich editor creates standard <ul>/<ol> — must explicitly set list-style
   because Chromium's print mode inherits global reset on some elements */
.edu-desc ul, .entry-desc ul {
  list-style: disc;
  margin: 3px 0 3px 0;
  padding-left: 18px;
}
.edu-desc ol, .entry-desc ol {
  list-style: decimal;
  margin: 3px 0 3px 0;
  padding-left: 18px;
}
.edu-desc li, .entry-desc li { margin: 1px 0; display: list-item; }
.edu-desc b, .entry-desc b { font-weight: 700; }
.edu-desc i, .entry-desc i { font-style: italic; }
.edu-desc u, .entry-desc u { text-decoration: underline; }
/* Nested lists */
.edu-desc ul ul, .entry-desc ul ul { list-style: circle; margin-top: 1px; margin-bottom: 1px; }
.edu-desc ol ol, .entry-desc ol ol { list-style: lower-alpha; margin-top: 1px; margin-bottom: 1px; }
.item-lbl { margin-bottom: 2px; }
.coursework-lbl { font-weight: 700; font-size: 10.3px; margin: 5px 0 2px; }

/* ── Bullets ──
   list-style:none + li::before with the literal "•" character.
   This is font-independent — the bullet always renders correctly
   regardless of whether Inter has loaded yet.
*/
.blist, .work-list, .coursework-list {
  list-style: none;
  padding-left: 14px;
  margin: 4px 0;
}
.blist li, .work-list li, .coursework-list li {
  position: relative;
  padding-left: 12px;
  margin-bottom: 2px;
  font-size: 10.3px; line-height: 1.45;
}
.blist li::before, .work-list li::before, .coursework-list li::before {
  content: "•";
  position: absolute; left: 0; top: 0;
  color: #333; font-size: 11px; line-height: 1.45;
}

/* ── Skills ── */
.skills-row { font-size: 10.3px; margin-bottom: 5px; }
.skills-row b { margin-right: 4px; }

/* ── Language table ── */
.lang-table {
  width: 100%; border-collapse: collapse;
  margin-top: 6px; table-layout: fixed;
  page-break-inside: avoid;
}
.lang-table th, .lang-table td {
  border: 1px solid #c5d0df; padding: 5px 8px; font-size: 10px;
}
.lang-th    { background: #edf2f8; font-weight: 700; font-size: 9.5px; text-align: center; }
.lang-name-th { text-align: left !important; }
.lang-name  { font-weight: 600; text-align: left; }
.lang-lvl   { text-align: center; }
.mother-tongue { font-size: 10.5px; margin: 3px 0 7px; }

/* ── Recommendations ── */
.rec-name    { font-size: 10.3px; margin-bottom: 2px; }
.rec-contact { font-size: 10.2px; }

/* ── Footer ──
   In normal document flow — appears directly after .cv-body content.
   margin-top: 20px creates a small visual gap after the last section.
   page-break-inside: avoid keeps the signature block together.
   Right-aligned so the signature sits at the bottom-right of the last page.
*/
.footer       { margin-top: 20px; padding: 0 28px 14px; page-break-inside: avoid; }
.footer-right { text-align: right; }
.sig-img      { max-width: 110px; height: auto; filter: grayscale(1); display: inline-block; margin-bottom: 2px; }
.sig-name     { font-weight: 700; font-size: 10px; margin: 0; }

/* ── Links — must be clickable in PDF ── */
a { color: #0b4a8b; text-decoration: underline; pointer-events: auto; }

/* ── Page break helpers ── */
.entry, .lang-table, .section, .sec-title { page-break-inside: avoid; break-inside: avoid; }
.sec-title + .entry { page-break-before: avoid; break-before: avoid; }

/* ── Screen preview ── */
@media screen {
  body { background: #dde3ec; }
  .cv-wrap {
    box-shadow: 0 8px 32px rgba(0,0,0,0.14);
    border-radius: 6px; margin: 24px auto;
  }
}

/* ── Print overrides ──
   PDFShift uses use_print:true so @media print applies.

   WHITE LINE FIX: Chrome's print renderer starts the page clip box 1 CSS px (0.75pt)
   below the physical top — baked into the inner CTM as "0 3.125" device offset.
   margin-top:-1px on .hdr bleeds the header's background colour UP past that clip.

   PAGE MARGIN APPROACH:
   - Page 1 stays flush via @page :first { margin: 0 }.
   - Pages 2+ get an 8mm top gap via @page { margin-top: 8mm }.
   - No fixed/repeated header element needed — simpler and more stable.
   - JS SPACER: PAGE_MARGIN_PX measures 8mm to correctly account for the gap
     when computing the footer position on pages 2+.
*/
@media print {
  @page :first {
    margin: 0;
  }
  @page {
    margin-top: 8mm;
    margin-bottom: 0;
    margin-left: 0;
    margin-right: 0;
  }
  .hdr {
    margin-top: -1px !important;
    position: relative;
    z-index: 1;
  }
  .cv-wrap {
    box-shadow: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
}


</style>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Main assembler
// ─────────────────────────────────────────────────────────────────────────────

export function buildCVHtml(
  personal:        any,
  educations:      any[],
  workExperiences: any[],
  languages:       any[],
  publications:    any[],
  certifications:  any[],
  customSections:  any[] = [],
  recommendations: any[] = [],
  options:         any   = {},
): string {

  const {
    headerBgColor = "#154a8a",
    sectionOrder  = ["work", "publications", "languages", "certifications", "custom", "recommendations"],
  } = options;

  const sectionMap: Record<string, string> = {
    work:            buildWork(workExperiences),
    publications:    buildPublications(publications),
    languages:       buildLanguages(languages),
    certifications:  buildCertifications(certifications),
    custom:          buildCustomSections(customSections),
    recommendations: buildRecommendations(recommendations),
  };

  const bodySections = sectionOrder
    .map((k: string) => sectionMap[k] ?? "")
    .filter(Boolean)
    .join("\n");

  // IMPORTANT: No <meta name="viewport"> — this tag causes headless Chromium
  // to sometimes collapse the layout, producing a blank PDF.
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CV — ${escapeHtml(personal.full_name)}</title>
${buildCSS(headerBgColor)}
</head>
<body>
<div class="cv-wrap">
  ${buildHeader(personal, headerBgColor)}
  <div class="cv-body">
    ${buildEducation(educations)}
    ${bodySections}
  </div>
  ${buildFooter(personal)}
</div>
</body>
</html>`;
}