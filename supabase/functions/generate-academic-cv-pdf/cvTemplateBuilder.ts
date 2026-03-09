// supabase/functions/generate-academic-cv-pdf/cvTemplateBuilder.ts
// @ts-nocheck

export function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return String(html)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<(?!(\/?)(?:strong|em|b|i|br|div|span|ul|li|a)\b)[^>]+>/gi, "");
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

function formatCoreCoursework(subjects?: string[]): string {
  if (!subjects) return "";
  return `<div class="academic-meta">${subjects.map(escapeHtml).join(", ")}</div>`;
}

function formatBullets(value?: string[]): string {
  if (!value) return "";
  return `<ul class="bullet-list">${value.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function formatBulletsIfExplicit(value?: string[], className = "bullet-list"): string {
  if (!value) return "";

  const v = String(value);
  const hasHtmlList = /<\s*(ul|ol|li)\b/i.test(v);
  const hasPlainBullets = /^\s*(?:[-*]|•|\u2022)\s+/m.test(v);

  if (hasHtmlList) return sanitizeHtml(v);
  if (hasPlainBullets) return formatBullets(v, className);

  return sanitizeHtml(v);
}

export interface CVPersonalInfo {
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  linkedin_url?: string;
  avatar_url?: string;
  signature_url?: string;
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
  key_subjects?: string[]; // Array of strings for clean data
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
  description?: string[]; // Array of strings for clean data
}

export interface CVLanguage {
  language_name: string;
  mother_tongue: boolean;
  listening?: string;
  reading?: string;
  writing?: string;
  speaking?: string;
}

export interface CVPublication {
  title: string;
  year: string;
  journal?: string;
  doi_url?: string;
}

export interface CVCertification {
  title: string;
  institution?: string;
  date?: string;
}

export interface CVCustomSection {
  title: string;
  items: {
    label: string;
    description?: string[];
  }[];
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
    density = "standard",
    sectionOrder = ["work", "publications", "languages", "certifications", "custom", "recommendations"],
  } = options;

  const motherTongues = languages.filter(l => l.mother_tongue).map(l => escapeHtml(l.language_name).toUpperCase()).join("  &nbsp;  ");
  
  const eduHtml = educations.map(edu => `
<div class="entry">
  <div class="entry-header">
    <span class="entry-title">${escapeHtml(edu.degree_title).toUpperCase()}${edu.field_of_study ? ` – ${escapeHtml(edu.field_of_study).toUpperCase()}` : ""}</span>
    <span class="entry-date">${formatMonthYear(edu.start_date) || edu.start_year} – ${formatMonthYear(edu.end_date) || edu.end_year}</span>
  </div>
  <div class="sub-info">${escapeHtml(edu.institution)}${edu.country ? `, ${escapeHtml(edu.country)}` : ""}</div>
  ${formatCoreCoursework(edu.key_subjects)}
  <div class="academic-meta">
    ${edu.thesis_title ? `<strong>Thesis:</strong> <em>${escapeHtml(edu.thesis_title)}</em><br>` : ""}
    ${formatGrade(edu.final_grade, edu.max_scale, edu.credit_system)}${edu.credit_system ? ` (${escapeHtml(edu.credit_system)})` : ""}${edu.total_credits ? ` | Credits: ${edu.total_credits}` : ""}
  </div>
</div>`).join("\n");

  const workHtml = workExperiences.length > 0 ? `
    <div class="section">
      <div class="section-title">Work Experience</div>
      <div class="section-content">
        ${workExperiences.map(w => `
          <div class="entry">
            <div class="entry-header">
              <span class="entry-title">${escapeHtml([w.job_title, w.organisation, w.city_country].filter(Boolean).join(", "))}</span>
              <span class="entry-date">${formatMonthYear(w.start_date)} – ${w.is_current ? "Present" : formatMonthYear(w.end_date)}</span>
            </div>
            ${formatBullets(w.description)}
          </div>`).join("\n")}
      </div>
    </div>` : "";

  const langRows = languages.filter(l => !l.mother_tongue).map(l => `
<tr><td class="lang-name-cell">${escapeHtml(l.language_name)}</td><td class="lang-level-cell">${l.listening || "—"}</td><td class="lang-level-cell">${l.reading || "—"}</td><td class="lang-level-cell">${l.writing || "—"}</td><td class="lang-level-cell">${l.speaking || "—"}</td></tr>`).join("");

  const certHtml = certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      <div class="section-content">
        <ul class="bullet-list">
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
      <div class="section">
        <div class="section-title">${escapeHtml(section.title)}</div>
        <div class="section-content">
          ${section.items.map(item => {
            if (item.description) {
              return `
              <div class="entry">
                <strong>${escapeHtml(item.label)}</strong><br>
                ${formatBullets(item.description)}
              </div>`;
            }

            return `<div class="entry">${escapeHtml(item.label)}</div>`;
          }).join("")}
        </div>
      </div>`).join("\n");

  const recHtml = recommendations.length > 0 ? `
    <div class="section">
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

  const profilePicBlock = personal.avatar_url ? `<div class="profile-pic-wrapper"><img src="${escapeHtml(personal.avatar_url)}" alt="Profile" class="profile-pic-circle"></div>` : "";
  const signatureBlock = personal.signature_url ? `<img src="${escapeHtml(personal.signature_url)}" alt="Signature" class="sig-img">` : "";

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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${headerBgColor};
      --text: #111827;
      --text-muted: #4b5563;
      --border: #e5e7eb;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      color: var(--text);
      line-height: 1.5;
      background: white;
    }
    .cv-container {
      width: 210mm;
      padding: 0;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: var(--primary);
      color: white;
      padding: 30px 40px;
      display: flex;
      gap: 30px;
      align-items: center;
    }
    .profile-img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid white;
    }
    .header-content h1 {
      font-size: 28px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 20px;
      font-size: 11px;
    }
    .contact-info a { color: white; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.3); }
    
    .cv-body { padding: 30px 40px; }
    .section { margin-bottom: 25px; }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: var(--primary);
      text-transform: uppercase;
      border-bottom: 2px solid var(--border);
      padding-bottom: 5px;
      margin-bottom: 12px;
    }
    .entry { margin-bottom: 15px; }
    .entry-header {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .sub-info { font-style: italic; color: var(--text-muted); font-size: 10.5px; }
    .bullet-list { margin: 8px 0 8px 20px; }
    .bullet-list li { font-size: 10.5px; margin-bottom: 2px; }
    .academic-meta { font-size: 10px; margin-top: 4px; }
    
    .footer { padding: 20px 40px; display: flex; justify-content: flex-end; }
    .signature { max-width: 150px; border-bottom: 1px solid #999; }

    @media print {
      body { background: none; }
      .cv-container { width: 100%; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="cv-container">
    <header class="header">
      ${personal.avatar_url ? `<img src="${personal.avatar_url}" class="profile-img">` : ""}
      <div class="header-content">
        <h1>${escapeHtml(personal.full_name)}</h1>
        <div class="contact-info">
          ${personal.email ? `<span>${escapeHtml(personal.email)}</span>` : ""}
          ${personal.phone ? `<span>${escapeHtml(personal.phone)}</span>` : ""}
          ${personal.linkedin_url ? `<a href="${personal.linkedin_url}">LinkedIn</a>` : ""}
          ${personal.address ? `<span>${escapeHtml(personal.address)}</span>` : ""}
        </div>
      </div>
    </header>

    <main class="cv-body">
      <section class="section">
        <h2 class="section-title">Education</h2>
        <div class="section-content">${eduHtml}</div>
      </section>
      
      ${workHtml}
      
      <!-- Additional sections like publications, languages, etc. would follow same pattern -->
    </main>

    <footer class="footer">
      ${personal.signature_url ? `<img src="${personal.signature_url}" class="signature">` : ""}
    </footer>
  </div>
</body>
</html>`;
}
