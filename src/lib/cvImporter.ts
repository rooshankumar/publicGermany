/**
 * CV Import Parser — extracts structured data from PDF/DOCX text
 * Uses pattern matching to identify common CV sections and populate form fields.
 */

import type { CVPersonalInfo, CVEducation, CVWorkExperience, CVLanguage, CVCertification } from "./cvTemplateBuilder";

export interface ImportedCVData {
  personal: Partial<CVPersonalInfo>;
  educations: CVEducation[];
  workExperiences: CVWorkExperience[];
  languages: CVLanguage[];
  certifications: CVCertification[];
}

// Section header patterns
const SECTION_PATTERNS: Record<string, RegExp> = {
  education: /\b(education|academic|qualification|degree|training|university|college)\b/i,
  work: /\b(work\s*experience|professional\s*experience|employment|career|internship|position|job)\b/i,
  languages: /\b(language|linguistic|mother\s*tongue)\b/i,
  certifications: /\b(certif|license|course|training|award|achievement)\b/i,
  personal: /\b(personal|contact|about\s*me|profile|summary|objective)\b/i,
  publications: /\b(publication|research|paper|journal)\b/i,
  skills: /\b(skill|competenc|technical|software|tool)\b/i,
  references: /\b(reference|referee|recommendation)\b/i,
};

// Regex patterns for personal info extraction
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i;
const DATE_RE = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/;
const YEAR_RANGE_RE = /(\d{4})\s*[-–—to]+\s*(\d{4}|present|current|ongoing)/i;
const YEAR_RE = /\b(19|20)\d{2}\b/;

const CEFR_RE = /\b([A-C][12])\b/;

const COMMON_LANGUAGES = [
  "English", "German", "French", "Spanish", "Hindi", "Arabic", "Chinese",
  "Mandarin", "Japanese", "Korean", "Portuguese", "Russian", "Italian",
  "Turkish", "Dutch", "Bengali", "Tamil", "Telugu", "Urdu", "Marathi",
  "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia",
];

function splitIntoSections(text: string): Record<string, string[]> {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const sections: Record<string, string[]> = { unknown: [] };
  let currentSection = "unknown";

  for (const line of lines) {
    // Check if this line is a section header
    let foundSection = false;
    for (const [sectionKey, pattern] of Object.entries(SECTION_PATTERNS)) {
      // Section headers are typically short lines (< 60 chars) matching a pattern
      if (line.length < 60 && pattern.test(line)) {
        currentSection = sectionKey;
        if (!sections[currentSection]) sections[currentSection] = [];
        foundSection = true;
        break;
      }
    }
    if (!foundSection) {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(line);
    }
  }

  return sections;
}

function extractPersonalInfo(text: string, sections: Record<string, string[]>): Partial<CVPersonalInfo> {
  const personal: Partial<CVPersonalInfo> = {};

  // Email
  const emailMatch = text.match(EMAIL_RE);
  if (emailMatch) personal.email = emailMatch[0];

  // Phone
  const phoneMatch = text.match(PHONE_RE);
  if (phoneMatch) personal.phone = phoneMatch[0];

  // LinkedIn
  const linkedinMatch = text.match(LINKEDIN_RE);
  if (linkedinMatch) personal.linkedin_url = linkedinMatch[0];

  // Name: usually the first non-empty line in the document
  const allLines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  if (allLines.length > 0) {
    const firstLine = allLines[0];
    // If first line looks like a name (2-5 words, no special chars, no email/phone)
    if (
      firstLine.length < 60 &&
      !EMAIL_RE.test(firstLine) &&
      !PHONE_RE.test(firstLine) &&
      /^[A-Za-zÀ-ÿ\s.'-]+$/.test(firstLine) &&
      firstLine.split(/\s+/).length >= 2
    ) {
      personal.full_name = firstLine;
    }
  }

  // Try to find address in personal/unknown sections
  const personalLines = [...(sections.personal || []), ...(sections.unknown || [])];
  for (const line of personalLines) {
    // Address patterns - lines with postal codes or "Street", "Road", etc.
    if (/\b\d{5,6}\b/.test(line) && line.length > 15 && !PHONE_RE.test(line)) {
      personal.address = line;
      break;
    }
  }

  return personal;
}

function extractEducation(lines: string[]): CVEducation[] {
  if (!lines || lines.length === 0) return [];

  const educations: CVEducation[] = [];
  let current: Partial<CVEducation> = {};
  const currentYear = new Date().getFullYear();

  for (const line of lines) {
    const yearRangeMatch = line.match(YEAR_RANGE_RE);

    if (yearRangeMatch) {
      // If we already have data, push it
      if (current.institution || current.degree_title) {
        educations.push(fillEducation(current));
        current = {};
      }
      current.start_year = parseInt(yearRangeMatch[1]);
      const endStr = yearRangeMatch[2].toLowerCase();
      current.end_year = /present|current|ongoing/.test(endStr)
        ? currentYear
        : parseInt(yearRangeMatch[2]);

      // The rest of the line might contain degree/institution
      const rest = line.replace(YEAR_RANGE_RE, "").trim().replace(/^[-–—|,\s]+|[-–—|,\s]+$/g, "");
      if (rest) {
        if (!current.degree_title) current.degree_title = rest;
        else if (!current.institution) current.institution = rest;
      }
    } else if (
      /\b(bachelor|master|b\.?sc|m\.?sc|b\.?a|m\.?a|b\.?tech|m\.?tech|ph\.?d|diploma|b\.?e|m\.?e|b\.?com|m\.?com|mba|llb|bba)\b/i.test(line)
    ) {
      if (current.institution || current.degree_title) {
        educations.push(fillEducation(current));
        current = {};
      }
      current.degree_title = line;
    } else if (
      /\b(university|college|institute|school|academy|iit|nit|iisc)\b/i.test(line)
    ) {
      current.institution = line;
    } else if (/\b(india|germany|usa|uk|canada|australia|china|japan|france)\b/i.test(line)) {
      current.country = line;
    } else if (!current.field_of_study && current.degree_title && line.length < 80) {
      current.field_of_study = line;
    }
  }

  if (current.institution || current.degree_title) {
    educations.push(fillEducation(current));
  }

  return educations;
}

function fillEducation(partial: Partial<CVEducation>): CVEducation {
  const currentYear = new Date().getFullYear();
  return {
    degree_title: partial.degree_title || "",
    field_of_study: partial.field_of_study || "",
    institution: partial.institution || "",
    country: partial.country || "India",
    start_year: partial.start_year || currentYear - 4,
    end_year: partial.end_year || currentYear,
    key_subjects: partial.key_subjects || "",
    final_grade: partial.final_grade || "",
    max_scale: 10,
    total_credits: 0,
    credit_system: "Indian Scale",
  };
}

function extractWorkExperience(lines: string[]): CVWorkExperience[] {
  if (!lines || lines.length === 0) return [];

  const experiences: CVWorkExperience[] = [];
  let current: Partial<CVWorkExperience> = {};
  let descLines: string[] = [];

  const pushCurrent = () => {
    if (current.job_title || current.organisation) {
      current.description = descLines.join(". ").trim();
      experiences.push({
        job_title: current.job_title || "",
        organisation: current.organisation || "",
        city_country: current.city_country || "",
        start_date: current.start_date || "",
        end_date: current.end_date || "",
        is_current: current.is_current || false,
        description: current.description || "",
      });
    }
  };

  for (const line of lines) {
    const yearRangeMatch = line.match(YEAR_RANGE_RE);

    if (yearRangeMatch) {
      pushCurrent();
      current = {};
      descLines = [];

      current.start_date = `${yearRangeMatch[1]}-01-01`;
      const endStr = yearRangeMatch[2].toLowerCase();
      if (/present|current|ongoing/.test(endStr)) {
        current.is_current = true;
        current.end_date = "";
      } else {
        current.end_date = `${yearRangeMatch[2]}-12-31`;
      }

      const rest = line.replace(YEAR_RANGE_RE, "").trim().replace(/^[-–—|,\s]+|[-–—|,\s]+$/g, "");
      if (rest) current.job_title = rest;
    } else if (
      /\b(manager|engineer|developer|analyst|intern|assistant|consultant|designer|lead|director|coordinator|officer|specialist|researcher|professor|lecturer|teacher)\b/i.test(line) &&
      !current.job_title
    ) {
      pushCurrent();
      current = {};
      descLines = [];
      current.job_title = line;
    } else if (
      /\b(pvt|ltd|inc|corp|llc|gmbh|company|group|solutions|technologies|services|consulting)\b/i.test(line) &&
      !current.organisation
    ) {
      current.organisation = line;
    } else {
      descLines.push(line);
    }
  }

  pushCurrent();
  return experiences;
}

function extractLanguages(lines: string[], fullText: string): CVLanguage[] {
  const languages: CVLanguage[] = [];
  const found = new Set<string>();

  // Search in language section lines + full text for common language names
  const searchText = [...(lines || []), fullText].join(" ");

  for (const lang of COMMON_LANGUAGES) {
    const re = new RegExp(`\\b${lang}\\b`, "i");
    if (re.test(searchText) && !found.has(lang.toLowerCase())) {
      found.add(lang.toLowerCase());

      // Check if it's marked as mother tongue / native
      const motherRe = new RegExp(`${lang}[^.]*\\b(mother|native|first)\\b`, "i");
      const isMother = motherRe.test(searchText);

      // Try to find CEFR level near the language name
      const levelRe = new RegExp(`${lang}[^.]{0,30}([A-C][12])`, "i");
      const levelMatch = searchText.match(levelRe);
      const level = levelMatch ? levelMatch[1].toUpperCase() : "";

      languages.push({
        language_name: lang,
        mother_tongue: isMother,
        listening: isMother ? "" : level,
        reading: isMother ? "" : level,
        writing: isMother ? "" : level,
        speaking: isMother ? "" : level,
      });
    }
  }

  return languages.length > 0 ? languages : [{ language_name: "", mother_tongue: false, listening: "", reading: "", writing: "", speaking: "" }];
}

function extractCertifications(lines: string[]): CVCertification[] {
  if (!lines || lines.length === 0) return [];

  return lines
    .filter(l => l.length > 5 && l.length < 150)
    .slice(0, 10)
    .map(line => {
      const yearMatch = line.match(YEAR_RE);
      return {
        title: line.replace(YEAR_RE, "").replace(/^[-•●◦▪\s]+/, "").trim(),
        institution: "",
        date: yearMatch ? `${yearMatch[0]}-01-01` : "",
      };
    })
    .filter(c => c.title.length > 3);
}

export function parseExtractedText(text: string): ImportedCVData {
  const sections = splitIntoSections(text);

  const personal = extractPersonalInfo(text, sections);
  const educations = extractEducation(sections.education);
  const workExperiences = extractWorkExperience(sections.work);
  const languages = extractLanguages(sections.languages || [], text);
  const certifications = extractCertifications(sections.certifications);

  return { personal, educations, workExperiences, languages, certifications };
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n");
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
