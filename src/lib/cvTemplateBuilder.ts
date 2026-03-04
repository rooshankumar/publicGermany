// Shared CV template builder for both authenticated (edge function) and public (client-side) generation

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Sanitize HTML - allow only safe formatting tags
function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  // Allow only: <strong>, <em>, <b>, <i>, <br>, <div style="text-align:...">
  return String(html)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<(?!\/?(?:strong|em|b|i|br|div|span)\b)[^>]+>/gi, "");
}

function formatDateDMY(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
  institution?: string;
  email?: string;
  contact?: string;
}

export interface CVBuildOptions {
  headerBgColor?: string;
  photoPosition?: string;
  photoZoom?: number;
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
  const { headerBgColor = "#ffffff", photoPosition = "center", photoZoom = 100 } = options;

  const motherTongues = languages.filter(l => l.mother_tongue).map(l => escapeHtml(l.language_name).toUpperCase()).join(", ");
  const otherLangs = languages.filter(l => !l.mother_tongue);

  const eduHtml = educations.map(edu => `
<div class="entry">
    <table class="entry-table"><tr>
        <td class="entry-title">${escapeHtml(edu.degree_title).toUpperCase()} – ${escapeHtml(edu.field_of_study).toUpperCase()}</td>
        <td class="entry-date">${edu.start_year} – ${edu.end_year}</td>
    </tr></table>
    <div class="sub-info">${escapeHtml(edu.institution)}, ${escapeHtml(edu.country)}</div>
    ${edu.key_subjects ? `<div class="academic-meta"><strong>Focus:</strong> ${sanitizeHtml(edu.key_subjects)}</div>` : ""}
    <div class="academic-meta">Grade: ${escapeHtml(edu.final_grade)} / ${edu.max_scale}${edu.credit_system ? ` (${escapeHtml(edu.credit_system)})` : ""} | Credits: ${edu.total_credits || "N/A"}${edu.thesis_title ? ` | Thesis: <em>${escapeHtml(edu.thesis_title)}</em>` : ""}</div>
</div>`).join("\n");

  const pubHtml = publications.length > 0 ? `
    <div class="section-title">Research Publications</div>
    ${publications.map(pub => `
<div class="entry">
    <strong>${escapeHtml(pub.title)}</strong>
    <div class="academic-meta">${escapeHtml(pub.journal)}${pub.year ? ` (${pub.year})` : ""}${pub.doi_url ? `. <a href="${escapeHtml(pub.doi_url)}">${escapeHtml(pub.doi_url)}</a>` : ""}</div>
</div>`).join("\n")}` : "";

  const workHtml = workExperiences.length > 0 ? `
    <div class="section-title">Work Experience</div>
    ${workExperiences.map(w => `
<div class="entry">
    <table class="entry-table"><tr>
        <td class="entry-title">${escapeHtml(w.job_title).toUpperCase()}</td>
        <td class="entry-date">${formatDateDMY(w.start_date)} – ${w.is_current ? "Present" : formatDateDMY(w.end_date)}</td>
    </tr></table>
    <div class="sub-info">${escapeHtml(w.organisation)}${w.city_country ? `, ${escapeHtml(w.city_country)}` : ""}</div>
    ${w.description ? `<div class="academic-meta">${sanitizeHtml(w.description)}</div>` : ""}
</div>`).join("\n")}` : "";

  const langRows = otherLangs.map(l => `
<tr><td>${escapeHtml(l.language_name).toUpperCase()}</td><td>${l.listening || "—"}</td><td>${l.reading || "—"}</td><td>${l.writing || "—"}</td><td>${l.speaking || "—"}</td></tr>`).join("");

  const langTableHtml = otherLangs.length > 0 ? `
<table class="lang-table">
<tr><th>Language</th><th>Listening</th><th>Reading</th><th>Writing</th><th>Speaking</th></tr>
${langRows}
</table>` : "";

  const certHtml = certifications.length > 0 ? `
    <div class="section-title">Certifications</div>
    <div class="bullet-list">
    ${certifications.map(c => {
      const yr = c.date ? new Date(c.date).getFullYear() : "";
      return `• ${escapeHtml(c.title)}${c.institution ? ` | ${escapeHtml(c.institution)}` : ""}${yr ? ` | ${yr}` : ""}`;
    }).join("<br>")}
    </div>` : "";

  const customHtml = customSections.filter(s => s.items.length > 0).map(section => `
    <div class="section-title">${escapeHtml(section.title)}</div>
    <div class="bullet-list">
    ${section.items.map(item => 
      `• ${escapeHtml(item.label)}${item.description ? ` — ${sanitizeHtml(item.description)}` : ""}`
    ).join("<br>")}
    </div>`).join("\n");

  const recHtml = recommendations.length > 0 ? `
    <div class="section-title">Recommendations / Referees</div>
    ${recommendations.map(r => `
<div class="entry">
    <strong>${escapeHtml(r.name)}</strong>
    <div class="academic-meta">${[r.designation, r.institution].filter(Boolean).map(escapeHtml).join(", ")}${r.email ? ` | <a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>` : ""}${r.contact ? ` | ${escapeHtml(r.contact)}` : ""}</div>
</div>`).join("\n")}` : "";

  const linkedinBlock = personal.linkedin_url ? `<div><span class="label">LinkedIn:</span><a href="${escapeHtml(personal.linkedin_url)}">${escapeHtml(personal.linkedin_url)}</a></div>` : "";
  
  const photoStyle = `object-fit: cover; object-position: ${photoPosition}; transform: scale(${photoZoom / 100});`;
  const profilePicBlock = personal.avatar_url ? `<div class="profile-pic-wrapper"><img src="${escapeHtml(personal.avatar_url)}" alt="Profile" class="profile-pic-circle" style="${photoStyle}"></div>` : "";
  const signatureBlock = personal.signature_url ? `<img src="${escapeHtml(personal.signature_url)}" alt="Signature" class="sig-img">` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Academic_CV_${escapeHtml(personal.full_name)}</title>
<style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: "Helvetica", "Arial", sans-serif; line-height: 1.3; color: #000; margin: 0; padding: 0; font-size: 10px; background: #fff; width: 794px; }
    .container { width: 794px; padding: 20px 25px; box-sizing: border-box; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; background-color: ${headerBgColor}; padding: 8px; }
    .profile-col { width: 85px; vertical-align: top; }
    .name-col { vertical-align: top; padding-left: 15px; }
    .profile-pic-wrapper { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 0.5pt solid #999; }
    .profile-pic-circle { width: 80px; height: 80px; border-radius: 50%; display: block; }
    .name-text { font-size: 18pt; font-weight: bold; color: #000; text-transform: uppercase; margin: 0; line-height: 1.1; }
    .header-divider { height: 0.5pt; background-color: #004a99; width: 100%; margin: 4px 0 8px 0; }
    .personal-details-block { line-height: 1.4; font-size: 9.5px; }
    .label { font-weight: bold; color: #333; text-transform: uppercase; font-size: 8pt; margin-right: 3px; }
    .section-title { font-size: 10.5px; font-weight: bold; color: #004a99; text-transform: uppercase; border-bottom: 0.5pt solid #ccc; margin: 12px 0 6px 0; padding-bottom: 1px; }
    .entry-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
    .entry-title { font-weight: bold; font-size: 10px; text-align: left; }
    .entry-date { font-weight: bold; font-size: 10px; text-align: right; white-space: nowrap; width: 120px; }
    .entry { margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid-page; }
    .sub-info { font-style: italic; color: #444; margin: 1px 0; font-size: 10px; }
    .academic-meta { font-size: 9px; color: #555; margin: 2px 0; }
    .lang-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .lang-table th, .lang-table td { border: 0.5pt solid #666; padding: 3px; text-align: center; font-size: 9px; }
    .lang-table th { background-color: #f9f9f9; font-weight: bold; }
    .mother-tongue-text { margin: 2px 0; font-size: 10px; }
    .bullet-list { margin: 2px 0; font-size: 10px; line-height: 1.5; }
    .sig-table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 9px; }
    .sig-table td { vertical-align: bottom; padding: 0; }
    .sig-img { max-width: 130px; max-height: 50px; border-bottom: 0.5pt solid #000; filter: grayscale(1); display: block; margin: 0 auto 2px; }
    a { color: #004a99; text-decoration: none; }
    .page-footer { text-align: center; font-size: 8px; color: #999; margin-top: 30px; padding-top: 8px; border-top: 0.5pt solid #eee; }
    @media print {
        @page { size: A4; margin: 10mm 12mm; }
        body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .container { width: 100%; padding: 0; }
        .entry { page-break-inside: avoid; break-inside: avoid; }
        .section-title { page-break-after: avoid; }
        .header-table { page-break-inside: avoid; }
        .sig-table { page-break-inside: avoid; }
        .page-footer { position: fixed; bottom: 0; left: 0; right: 0; }
    }
</style>
</head>
<body>
<div class="container">
    <table class="header-table"><tr>
        <td class="profile-col">${profilePicBlock}</td>
        <td class="name-col">
            <h1 class="name-text">${escapeHtml(personal.full_name)}</h1>
            <div class="header-divider"></div>
            <div class="personal-details-block">
                <div><span class="label">Passport:</span>${escapeHtml(personal.passport_number)} | <span class="label">DOB:</span>${formatDateDMY(personal.date_of_birth)} | <span class="label">Nationality:</span>${escapeHtml(personal.nationality)} | <span class="label">Gender:</span>${escapeHtml(personal.gender)}</div>
                <div><span class="label">Place of Birth:</span>${escapeHtml(personal.place_of_birth)}</div>
                <div><span class="label">Phone:</span>${escapeHtml(personal.phone)} | <span class="label">Email:</span><a href="mailto:${escapeHtml(personal.email)}">${escapeHtml(personal.email)}</a></div>
                <div><span class="label">Address:</span>${escapeHtml(personal.address)}</div>
                ${linkedinBlock}
            </div>
        </td>
    </tr></table>

    <div class="section-title">Education and Training</div>
    ${eduHtml}

    ${pubHtml}
    ${workHtml}

    <div class="section-title">Language Skills</div>
    ${motherTongues ? `<div class="mother-tongue-text"><strong>Mother Tongue(s):</strong> ${motherTongues}</div>` : ""}
    ${langTableHtml}

    ${certHtml}
    ${customHtml}
    ${recHtml}

    <div class="sig-area">
        <div class="sig-left">
            <div>Date: ${formatDateDMY(personal.signature_date || new Date().toISOString())}</div>
            <div>Place: ${escapeHtml(personal.place_of_birth)}</div>
        </div>
        <div class="sig-right">
            ${signatureBlock}
            <div style="font-weight: bold;">(${escapeHtml(personal.full_name)})</div>
        </div>
    </div>

    <div class="page-footer">Curriculum Vitae — ${escapeHtml(personal.full_name)}</div>
</div>
</body>
</html>`;
}
