import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Download, Loader2, ArrowLeft, Upload, Eye, EyeOff, Info, Bold, Italic, AlignLeft, AlignCenter, AlignRight, List, ChevronUp, ChevronDown, User, GraduationCap, Briefcase, Languages, Award, Layout, CheckCircle2, Settings } from "lucide-react";
import { buildCVHtml, toLines, CVPersonalInfo, CVEducation, CVWorkExperience, CVLanguage, CVPublication, CVCertification, CVCustomSection, CVRecommendation, CVBuildOptions } from "@/lib/cvTemplateBuilder";
import CVImportUpload from "@/components/CVImportUpload";
import ThemeToggle from "@/components/ThemeToggle";
import { ImageCropper } from "@/components/ImageCropper";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ImportedCVData } from "@/lib/cvImporter";
import { extractEmbeddedCVDataFromText } from "@/lib/cvImporter";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SUGGESTED_SECTIONS = ["Academic Research", "Technical Skills", "Academic Projects", "Digital & Research Skills"];

const HEADER_COLORS = [
  { label: "Europass Blue", value: "#154a8a", hint: "Classic Europass academic blue theme." },
  { label: "Dark Academic Blue", value: "#1f4e79", hint: "Formal university-style blue for strong contrast." },
  { label: "Deep Navy", value: "#0f3a6d", hint: "Premium deep navy look for research-focused CVs." },
  { label: "Neutral Gray", value: "#4a4a4a", hint: "Minimal neutral style with understated tone." },
] as const;

const DENSITY_OPTIONS: Array<{ label: string; value: CVBuildOptions["density"]; hint: string }> = [
  { label: "Compact", value: "compact", hint: "Smaller font and tighter spacing to fit more content." },
  { label: "Standard", value: "standard", hint: "Balanced default academic layout." },
  { label: "Expanded", value: "expanded", hint: "Slightly larger text and spacing to fill short CVs." },
];

const REORDERABLE_SECTIONS: Array<{ key: string; label: string }> = [
  { key: "work", label: "Work Experience" },
  { key: "publications", label: "Research Publications" },
  { key: "languages", label: "Language Skills" },
  { key: "certifications", label: "Certifications" },
  { key: "custom", label: "Custom Sections" },
  { key: "recommendations", label: "Recommendations" },
];

const SECTION_TIPS: Record<string, string> = {
  personal: "Include all details as they appear on your passport. This helps universities verify your identity.",
  education: "List degrees in reverse chronological order. Include ECTS/credit equivalents and grading scale.",
  publications: "Include peer-reviewed papers, conference proceedings, and working papers.",
  work: "Include relevant professional experience, internships, and research positions.",
  languages: "Use CEFR levels (A1-C2). Mother tongue languages are listed separately.",
  certifications: "Include relevant certificates, MOOCs, and professional development courses.",
  custom: "Add sections like Research Experience, Technical Skills, or Academic Projects.",
  recommendations: "Include 2-3 academic referees who can vouch for your work.",
};

const emptyEducation = (): CVEducation => ({
  degree_title: "", field_of_study: "", institution: "", country: "",
  start_year: new Date().getFullYear() - 4, end_year: new Date().getFullYear(),
  start_date: "", end_date: "",
  key_subjects: [], final_grade: "", max_scale: 10, total_credits: 0, credit_system: "Indian Scale",
});
const emptyWork = (): CVWorkExperience => ({
  job_title: "", organisation: "", city_country: "", start_date: "", end_date: "", is_current: false, description: [],
});
const emptyLanguage = (): CVLanguage => ({
  language_name: "", mother_tongue: false, listening: "", reading: "", writing: "", speaking: "",
});
const emptyPublication = (): CVPublication => ({ title: "", year: String(new Date().getFullYear()), journal: "", doi_url: "" });
const emptyCertification = (): CVCertification => ({ title: "", institution: "", date: "" });
const emptyCustomSection = (): CVCustomSection => ({ title: "", items: [{ label: "", description: [] }] });
const emptyRecommendation = (): CVRecommendation => ({ name: "", designation: "", department: "", institution: "", email: "", contact: "", lor_link: "" });

function encodeCvPayloadBase64(payload: unknown): string {
  const json = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function embedCvMetaIntoHtml(html: string, data: ImportedCVData): string {
  const wrapper = { generator: "publicgermany-cv", version: 1, data };
  const encoded = encodeCvPayloadBase64(wrapper);
  const metaText = `PGCVMETA:${encoded}:ENDPGCVMETA`;
  const metaBlock = `\n<div id="pgcvmeta" style="display:block;position:fixed;left:0;bottom:0;opacity:0.01;font-size:2px;line-height:2px;color:#000000;background:transparent;white-space:pre-wrap;word-break:break-all;">${metaText}</div>\n`;
  if (html.includes("</body>")) return html.replace("</body>", `${metaBlock}</body>`);
  return `${html}${metaBlock}`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function SectionTip({ tipKey }: { tipKey: string }) {
  const tip = SECTION_TIPS[tipKey];
  if (!tip) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help ml-1.5 inline-block" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function RichTextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const execCmd = (cmd: string) => {
    document.execCommand(cmd, false);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-muted/50 border-b">
        <button type="button" className="p-1 rounded hover:bg-muted" title="Bold" onMouseDown={e => { e.preventDefault(); execCmd("bold"); }}><Bold className="w-3 h-3" /></button>
        <button type="button" className="p-1 rounded hover:bg-muted" title="Italic" onMouseDown={e => { e.preventDefault(); execCmd("italic"); }}><Italic className="w-3 h-3" /></button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button type="button" className="p-1 rounded hover:bg-muted" title="Left" onMouseDown={e => { e.preventDefault(); execCmd("justifyLeft"); }}><AlignLeft className="w-3 h-3" /></button>
        <button type="button" className="p-1 rounded hover:bg-muted" title="Center" onMouseDown={e => { e.preventDefault(); execCmd("justifyCenter"); }}><AlignCenter className="w-3 h-3" /></button>
        <button type="button" className="p-1 rounded hover:bg-muted" title="Right" onMouseDown={e => { e.preventDefault(); execCmd("justifyRight"); }}><AlignRight className="w-3 h-3" /></button>
        <button type="button" className="p-1 rounded hover:bg-muted" title="Bullets" onMouseDown={e => { e.preventDefault(); execCmd("insertUnorderedList"); }}><List className="w-3 h-3" /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="px-3 py-2 text-sm min-h-[36px] focus:outline-none"
        dangerouslySetInnerHTML={{ __html: value || "" }}
        onBlur={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        data-placeholder={placeholder}
        style={{ minHeight: 36 }}
      />
    </div>
  );
}

function isValidDOB(value: string): boolean {
  const d = parseDOB(value);
  if (!d) return false;
  const now = new Date();
  if (d > now) return false;
  const age = now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  return age >= 15 && age <= 100;
}

function normalizeMonthYearInput(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^\d{4}$/.test(v)) return v;
  const normalized = v.replace(/\./g, " ").replace(/\s+/g, " ").trim();
  const match = normalized.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (match) {
    const d = new Date(`${match[1]} 1, ${match[2]}`);
    if (!Number.isNaN(d.getTime())) return `${d.toLocaleString("en-US", { month: "short" })} ${match[2]}`;
  }
  if (/^\d{4}-\d{2}$/.test(v)) {
    const [year, month] = v.split("-").map(Number);
    if (month >= 1 && month <= 12) return `${new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short" })} ${year}`;
  }
  return value;
}

function parseYearFromMonthYear(value?: string): number | null {
  if (!value) return null;
  const normalized = normalizeMonthYearInput(value);
  const yearMatch = normalized.match(/(\d{4})$/);
  return yearMatch ? Number(yearMatch[1]) : null;
}

function parseDOB(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;
  const ddmmyyyy = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!Number.isNaN(d.getTime())) return d;
  }
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, yyyy, mm, dd] = iso;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!Number.isNaN(d.getTime())) return d;
  }
  const fallback = new Date(v);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function normalizeDOBInput(value: string): string {
  const parsed = parseDOB(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function validateEducationTimeline(educations: CVEducation[]): string[] {
  const warnings: string[] = [];
  const sorted = [...educations].sort((a, b) => (parseYearFromMonthYear(a.start_date) ?? a.start_year) - (parseYearFromMonthYear(b.start_date) ?? b.start_year));
  const levelScore = (degree: string) => {
    const value = degree.toLowerCase();
    if (value.includes("school") || value.includes("secondary") || value.includes("high school")) return 1;
    if (value.includes("bachelor") || value.includes("b.tech") || value.includes("bsc") || value.includes("ba")) return 2;
    if (value.includes("master") || value.includes("m.tech") || value.includes("msc") || value.includes("ma")) return 3;
    if (value.includes("phd") || value.includes("doctor")) return 4;
    return 0;
  };
  sorted.forEach((edu, index) => {
    const startYear = parseYearFromMonthYear(edu.start_date) ?? edu.start_year;
    const endYear = parseYearFromMonthYear(edu.end_date) ?? edu.end_year;
    if (endYear < startYear) warnings.push(`${edu.degree_title || "Education entry"}: end year is before start year.`);
    if (index > 0) {
      const prev = sorted[index - 1];
      const prevEndYear = parseYearFromMonthYear(prev.end_date) ?? prev.end_year;
      const currentStartYear = parseYearFromMonthYear(edu.start_date) ?? edu.start_year;
      const gap = currentStartYear - prevEndYear;
      if (gap > 2) warnings.push(`Gap of ${gap} years between ${prev.degree_title || "previous education"} and ${edu.degree_title || "next education"}.`);
      const prevScore = levelScore(prev.degree_title || "");
      const currentScore = levelScore(edu.degree_title || "");
      if (prevScore > 0 && currentScore > 0 && currentScore < prevScore)
        warnings.push(`Education order may be inconsistent: ${prev.degree_title} appears before ${edu.degree_title}.`);
    }
  });
  return warnings;
}

function moveUp<T>(arr: T[], index: number): T[] {
  if (index <= 0) return arr;
  const n = [...arr];
  [n[index - 1], n[index]] = [n[index], n[index - 1]];
  return n;
}
function moveDown<T>(arr: T[], index: number): T[] {
  if (index >= arr.length - 1) return arr;
  const n = [...arr];
  [n[index], n[index + 1]] = [n[index + 1], n[index]];
  return n;
}

function ReorderButtons({ index, length, onMove }: { index: number; length: number; onMove: (dir: "up" | "down") => void }) {
  if (length <= 1) return null;
  return (
    <div className="flex flex-col gap-0.5 mr-1">
      <button type="button" disabled={index === 0} onClick={() => onMove("up")} className="p-0.5 rounded hover:bg-muted disabled:opacity-30" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
      <button type="button" disabled={index === length - 1} onClick={() => onMove("down")} className="p-0.5 rounded hover:bg-muted disabled:opacity-30" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export default function AcademicCVGenerator() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(!isMobile);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [personal, setPersonal] = useState<CVPersonalInfo>({
    full_name: "", passport_number: "", date_of_birth: "", nationality: "",
    gender: "", place_of_birth: "", phone: "", email: "", linkedin_url: "", address: "",
    avatar_url: "", signature_url: "",
  });
  const [educations, setEducations] = useState<CVEducation[]>([emptyEducation()]);
  const [workExperiences, setWorkExperiences] = useState<CVWorkExperience[]>([emptyWork()]);
  const [languages, setLanguages] = useState<CVLanguage[]>([emptyLanguage()]);
  const [publications, setPublications] = useState<CVPublication[]>([emptyPublication()]);
  const [certifications, setCertifications] = useState<CVCertification[]>([emptyCertification()]);
  const [customSections, setCustomSections] = useState<CVCustomSection[]>([emptyCustomSection()]);
  const [recommendations, setRecommendations] = useState<CVRecommendation[]>([emptyRecommendation()]);

  const [headerBgColor, setHeaderBgColor] = useState("#154a8a");
  const [density, setDensity] = useState<CVBuildOptions["density"]>("standard");
  const [sectionOrder, setSectionOrder] = useState<NonNullable<CVBuildOptions["sectionOrder"]>>(
    ["work", "publications", "languages", "certifications", "custom", "recommendations"],
  );

  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewDocHeight, setPreviewDocHeight] = useState<number>(1200);
  const [activeStep, setActiveStep] = useState(0);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const STEPS = [
    { id: "personal", label: "Personal", icon: User },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "experience", label: "Work", icon: Briefcase },
    { id: "skills", label: "Skills", icon: Languages },
    { id: "extra", label: "Extra", icon: Award },
    { id: "style", label: "Style", icon: Settings },
  ];

  const buildOptions = useMemo<CVBuildOptions>(
    () => ({ headerBgColor, density, sectionOrder }),
    [headerBgColor, density, sectionOrder],
  );

  const rawHtml = useMemo(() =>
    buildCVHtml(personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations, buildOptions),
    [personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations, buildOptions]
  );

  const previewHtml = useMemo(() => rawHtml, [rawHtml]);

  const updatePreviewHeight = useCallback(() => {
    try {
      const iframe = previewIframeRef.current;
      if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body) return;
      const body = iframe.contentDocument.body;
      const container = body.querySelector('.cv-wrap') as HTMLElement;
      if (!container) return;
      const height = Math.max(container.scrollHeight, container.offsetHeight, 1200);
      setPreviewDocHeight(height + 40);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const iframe = previewIframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      updatePreviewHeight();
      if (iframe.contentDocument) {
        const observer = new MutationObserver(updatePreviewHeight);
        observer.observe(iframe.contentDocument.body, { childList: true, subtree: true, attributes: true, characterData: true });
        return () => observer.disconnect();
      }
    };
    iframe.addEventListener('load', onLoad);
    const t1 = window.setTimeout(updatePreviewHeight, 500);
    const t2 = window.setTimeout(updatePreviewHeight, 2000);
    return () => { iframe.removeEventListener('load', onLoad); window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [previewHtml, updatePreviewHeight]);

  const updatePersonal = (field: keyof CVPersonalInfo, value: string) =>
    setPersonal(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = (field: 'avatar_url' | 'signature_url') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File too large", description: "Max 2MB", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (field === 'avatar_url') { setTempImageUrl(result); setIsCropperOpen(true); }
      else updatePersonal(field, result);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    updatePersonal('avatar_url', croppedImage);
    setIsCropperOpen(false);
    setTempImageUrl(null);
  };

  const handleCVImport = useCallback((data: ImportedCVData) => {
    // Sanitize description fields — they may contain raw HTML blobs from rich-text
    // editors (e.g. Tailwind-styled <h1 style="--tw-*:..."> wrappers).
    // toLines() strips all tags/attrs and returns clean text; join with \n for textarea.
    const cleanLines = (v: unknown) => toLines(v).join("\n");

    if (data.personal) {
      setPersonal(prev => ({
        ...prev,
        full_name: data.personal?.full_name ?? prev.full_name,
        email: data.personal?.email ?? prev.email,
        phone: data.personal?.phone ?? prev.phone,
        address: data.personal?.address ?? prev.address,
        linkedin_url: data.personal?.linkedin_url ?? prev.linkedin_url,
        nationality: data.personal?.nationality ?? prev.nationality,
        date_of_birth: data.personal?.date_of_birth ?? prev.date_of_birth,
        passport_number: data.personal?.passport_number ?? prev.passport_number,
        gender: data.personal?.gender ?? prev.gender,
        place_of_birth: data.personal?.place_of_birth ?? prev.place_of_birth,
        avatar_url: data.personal?.avatar_url ?? prev.avatar_url,
        signature_url: data.personal?.signature_url ?? prev.signature_url,
      }));
    }
    if (data.educations) setEducations(data.educations.map(e => ({
      ...e,
      key_subjects: cleanLines(e.key_subjects),
    })));
    if (data.workExperiences) setWorkExperiences(data.workExperiences.map(w => ({
      ...w,
      description: cleanLines(w.description),
    })));
    if (data.languages) setLanguages(data.languages);
    if (data.certifications) setCertifications(data.certifications.map(c => ({
      ...c,
      description: cleanLines((c as any).description),
    })));
    if (data.publications) setPublications(data.publications.map(p => ({
      ...p,
      description: cleanLines((p as any).description),
    })));
    if (data.customSections) setCustomSections(data.customSections.map(s => ({
      ...s,
      items: s.items?.map((item: any) => ({
        ...item,
        description: cleanLines(item.description),
      })) ?? s.items,
    })));
    if (data.recommendations) setRecommendations(data.recommendations);
    if (data.buildOptions) {
      if (data.buildOptions.headerBgColor) setHeaderBgColor(data.buildOptions.headerBgColor);
      if (data.buildOptions.density) setDensity(data.buildOptions.density);
      if (data.buildOptions.sectionOrder?.length) setSectionOrder(data.buildOptions.sectionOrder);
    }

    const hasPhotos = !!(data.personal?.avatar_url || data.personal?.signature_url);
    if (hasPhotos) {
      toast({
        title: "CV imported successfully",
        description: "All data restored. Profile photo and signature were included in this file.",
      });
    } else {
      toast({
        title: "CV imported — photos not included",
        description: "All text data restored. Profile photo and signature are not stored in PDFs — please re-upload them. Use 'Download JSON' next time for a full backup.",
        duration: 8000,
      });
    }
  }, [toast]);

  // Full export for JSON download — includes images for complete backup
  const buildExportData = useCallback((): ImportedCVData => ({
    personal,  // full personal including avatar_url + signature_url
    educations, workExperiences, languages, certifications,
    publications, customSections, recommendations, buildOptions,
  }), [personal, educations, workExperiences, languages, certifications, publications, customSections, recommendations, buildOptions]);

  // Compact export for PDF metadata — strips images because base64 photos can be
  // 500KB–3MB, which silently truncates in PDF text extraction and breaks re-import.
  const buildMetadataPayload = useCallback((): ImportedCVData => ({
    personal: { ...personal, avatar_url: undefined, signature_url: undefined },
    educations, workExperiences, languages, certifications,
    publications, customSections, recommendations, buildOptions,
  }), [personal, educations, workExperiences, languages, certifications, publications, customSections, recommendations, buildOptions]);

  const downloadCVJson = useCallback(() => {
    try {
      const data = buildExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (personal.full_name || "Academic_CV").replace(/[^a-z0-9_-]+/gi, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
      a.download = `${safeName || "Academic_CV"}_Data.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "CV data downloaded", description: "Re-upload this JSON later to continue editing." });
    } catch (err) {
      console.error("CV JSON export error:", err);
      toast({ title: "Export failed", description: "Could not download CV JSON.", variant: "destructive" });
    }
  }, [buildExportData, personal.full_name, toast]);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        setPreviewScale(Math.min(containerWidth / 794, 1));
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [showPreview]);

  // ─────────────────────────────────────────────────────────────────────────
  // PDF generation
  //
  // THE KEY FIX: use raw fetch() instead of supabase.functions.invoke().
  //
  // supabase.functions.invoke() attempts to parse the HTTP response body as
  // JSON. When the edge function returns a binary PDF, the JSON parse fails
  // silently and `data` ends up as a corrupted / empty value. The resulting
  // Blob then opens as a blank white PDF even though it has the right size.
  //
  // Raw fetch() lets us call response.blob() directly, which reads the raw
  // binary stream without any JSON parsing — preserving every PDF byte.
  // ─────────────────────────────────────────────────────────────────────────
  const generatePDF = async () => {
    if (!personal.full_name || !personal.email || educations.length === 0) {
      toast({ title: "Missing fields", description: "Please fill in at least your name, email, and one education entry.", variant: "destructive" });
      return;
    }
    if (personal.date_of_birth && !isValidDOB(personal.date_of_birth)) {
      toast({ title: "Invalid Date of Birth", description: "Use a realistic date (age should be at least 15 and not in the future).", variant: "destructive" });
      return;
    }
    const timelineWarnings = validateEducationTimeline(educations);
    if (timelineWarnings.length > 0) toast({ title: "Education timeline warning", description: timelineWarnings[0] });

    try {
      setIsGenerating(true);
      toast({ title: "Generating PDF", description: "Sending to server renderer..." });

      const fileName = `${(personal.full_name || "CV").replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "_")}_CV.pdf`;

      // ── Get the project URL and anon key ──────────────────────────────
      // supabase client exposes these as public properties.
      // We cast to any because the typings don't always expose them directly.
      const supabaseUrl: string =
        (supabase as any).supabaseUrl ??
        (supabase as any).restUrl?.replace("/rest/v1", "") ??
        import.meta.env.VITE_SUPABASE_URL ?? "";

      const supabaseAnonKey: string =
        (supabase as any).supabaseKey ??
        (supabase as any).anonKey ??
        import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

      if (!supabaseUrl) throw new Error("Cannot resolve Supabase project URL");

      // ── Call the edge function with raw fetch ─────────────────────────
      const edgeResp = await fetch(
        `${supabaseUrl}/functions/v1/generate-academic-cv-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            personal,
            educations,
            workExperiences,
            languages,
            publications,
            certifications,
            customSections,
            recommendations,
            buildOptions,
            file_name: fileName,
          }),
        }
      );

      if (!edgeResp.ok) {
        const errText = await edgeResp.text().catch(() => edgeResp.statusText);
        console.warn("Edge Function HTTP error:", edgeResp.status, errText);
        throw new Error(`SERVER_FAILED: ${errText}`);
      }

      // ── Read the response as a raw binary Blob ────────────────────────
      // This is the critical step — .blob() preserves all PDF bytes.
      // Never use .json() or .text() on a binary response.
      const blob = await edgeResp.blob();
      console.log(`PDF blob received: ${blob.size} bytes, type: ${blob.type}`);

      if (blob.size < 15000) {
        console.warn(`PDF too small (${blob.size} bytes), falling back to client-side`);
        throw new Error("SERVER_BLANK");
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: "PDF downloaded", description: "Generated successfully." });

    } catch (err: any) {
      console.error("Server PDF error:", err);

      // ── Fallback: html2canvas + jsPDF ─────────────────────────────────
      try {
        toast({ title: "Generating PDF", description: "Using client-side renderer..." });

        const iframe = previewIframeRef.current;
        if (!iframe || !iframe.contentDocument?.body) throw new Error("Preview not ready");

        const container = iframe.contentDocument.body.querySelector('.cv-wrap') as HTMLElement;
        if (!container) throw new Error("CV container not found in preview");

        const canvas = await html2canvas(container, {
          scale: 2, useCORS: true, allowTaint: true, logging: false,
          backgroundColor: "#ffffff", windowWidth: 794,
        });

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

        // Embed metadata as invisible text — use compact payload (no images)
        const metaPayload = buildMetadataPayload();
        const wrapper = { generator: "publicgermany-cv", version: 1, data: metaPayload };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(wrapper)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
        pdf.setFontSize(1);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`PGCVMETA:${encoded}:ENDPGCVMETA`, 5, 5);

        const fileName = `${(personal.full_name || "CV").replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "_")}_CV.pdf`;
        pdf.save(fileName);
        toast({ title: "PDF downloaded", description: "Generated via client-side renderer." });

      } catch (clientErr) {
        console.error("Client-side PDF error:", clientErr);
        toast({ title: "Export failed", description: "Falling back to browser print — select 'Save as PDF'.", variant: "destructive" });

        const printWindow = window.open("", "_blank");
        if (printWindow) {
          const metaPayload = buildMetadataPayload();
          const htmlWithMeta = embedCvMetaIntoHtml(previewHtml, metaPayload);
          printWindow.document.write(htmlWithMeta);
          printWindow.document.close();
          printWindow.onload = () => setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    document.title = "Free Europass CV Generator for Germany | Academic CV";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Generate a professional academic CV in Europass format for German university applications. Free, no sign-up required.");
  }, []);

  const formContent = (
    <div className="space-y-4 pb-20">
      {/* Progress Stepper */}
      <div className="bg-muted/30 p-2 rounded-xl border flex justify-between items-center mb-6 overflow-x-auto no-scrollbar">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === idx;
          const isCompleted = activeStep > idx;
          return (
            <button key={step.id} onClick={() => setActiveStep(idx)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all min-w-[70px] ${isActive ? "bg-background shadow-sm border text-primary" : isCompleted ? "text-green-600 opacity-80" : "text-muted-foreground opacity-60 hover:opacity-100"}`}>
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                {isCompleted && <CheckCircle2 className="w-3 h-3 absolute -top-1 -right-1 bg-background rounded-full" />}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">{step.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {activeStep === 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CVImportUpload onImport={handleCVImport} />
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center">Personal Information <SectionTip tipKey="personal" /></CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Full Name *</Label><Input value={personal.full_name} onChange={e => updatePersonal("full_name", e.target.value)} placeholder="John Doe" /></div>
                  <div><Label className="text-xs">Email *</Label><Input type="email" value={personal.email} onChange={e => updatePersonal("email", e.target.value)} placeholder="john@example.com" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={personal.phone} onChange={e => updatePersonal("phone", e.target.value)} placeholder="+91 9876543210" /></div>
                  <div><Label className="text-xs">Date of Birth</Label><Input value={personal.date_of_birth} placeholder="15 Aug 1998" onBlur={e => updatePersonal("date_of_birth", normalizeDOBInput(e.target.value))} onChange={e => updatePersonal("date_of_birth", e.target.value)} /></div>
                  <div><Label className="text-xs">Nationality</Label><Input value={personal.nationality} onChange={e => updatePersonal("nationality", e.target.value)} placeholder="Indian" /></div>
                  <div><Label className="text-xs">Gender</Label><Input value={personal.gender} onChange={e => updatePersonal("gender", e.target.value)} placeholder="Male / Female" /></div>
                  <div><Label className="text-xs">Passport Number</Label><Input value={personal.passport_number} onChange={e => updatePersonal("passport_number", e.target.value)} /></div>
                  <div><Label className="text-xs">Place of Birth</Label><Input value={personal.place_of_birth} onChange={e => updatePersonal("place_of_birth", e.target.value)} placeholder="City, State, Country" /></div>
                  <div className="sm:col-span-2"><Label className="text-xs">Address</Label><Input value={personal.address} onChange={e => updatePersonal("address", e.target.value)} placeholder="Street, City, Postal Code, Country" /></div>
                  <div className="sm:col-span-2"><Label className="text-xs">LinkedIn URL</Label><Input value={personal.linkedin_url} onChange={e => updatePersonal("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/yourname" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t">
                  <div>
                    <Label className="text-xs flex items-center gap-1"><Upload className="w-3 h-3" /> Profile Photo</Label>
                    <Input type="file" accept="image/*" onChange={handleFileUpload('avatar_url')} className="text-xs mt-1" />
                    {personal.avatar_url && (
                      <div className="mt-2 flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border shadow-sm shrink-0">
                          <img src={personal.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { setTempImageUrl(personal.avatar_url); setIsCropperOpen(true); }} className="text-xs">Recrop Photo</Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1"><Upload className="w-3 h-3" /> Signature</Label>
                    <Input type="file" accept="image/*" onChange={handleFileUpload('signature_url')} className="text-xs mt-1" />
                    {personal.signature_url && <img src={personal.signature_url} alt="Signature" className="h-8 mt-2 border" />}
                  </div>
                </div>
                {tempImageUrl && (
                  <ImageCropper image={tempImageUrl} open={isCropperOpen} onCropComplete={handleCropComplete}
                    onCancel={() => { setIsCropperOpen(false); setTempImageUrl(null); }} />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">Education & Training * <SectionTip tipKey="education" /></CardTitle>
                <Button size="sm" variant="outline" onClick={() => setEducations([...educations, emptyEducation()])}><Plus className="w-3 h-3 mr-1" />Add</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {educations.map((edu, i) => (
                  <div key={i} className="border rounded-md p-3 space-y-2 relative">
                    <div className="flex items-start">
                      <ReorderButtons index={i} length={educations.length} onMove={dir => setEducations(dir === "up" ? moveUp(educations, i) : moveDown(educations, i))} />
                      <div className="flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div><Label className="text-xs">Degree Title *</Label><Input value={edu.degree_title} onChange={e => { const n = [...educations]; n[i] = { ...n[i], degree_title: e.target.value }; setEducations(n); }} placeholder="Bachelor of Arts (Honours)" /></div>
                          <div><Label className="text-xs">Field of Study *</Label><Input value={edu.field_of_study} onChange={e => { const n = [...educations]; n[i] = { ...n[i], field_of_study: e.target.value }; setEducations(n); }} placeholder="Applied Psychology" /></div>
                          <div><Label className="text-xs">Institution *</Label><Input value={edu.institution} onChange={e => { const n = [...educations]; n[i] = { ...n[i], institution: e.target.value }; setEducations(n); }} /></div>
                          <div><Label className="text-xs">Country *</Label><Input value={edu.country} onChange={e => { const n = [...educations]; n[i] = { ...n[i], country: e.target.value }; setEducations(n); }} placeholder="India" /></div>
                          <div><Label className="text-xs">Start Date (Mon YYYY)</Label><Input value={edu.start_date || ""} placeholder="Oct 2022" onBlur={e => { const normalized = normalizeMonthYearInput(e.target.value); const n = [...educations]; n[i] = { ...n[i], start_date: normalized, start_year: parseYearFromMonthYear(normalized) || n[i].start_year }; setEducations(n); }} onChange={e => { const n = [...educations]; n[i] = { ...n[i], start_date: e.target.value }; setEducations(n); }} /></div>
                          <div><Label className="text-xs">End Date (Mon YYYY)</Label><Input value={edu.end_date || ""} placeholder="Jul 2026" onBlur={e => { const normalized = normalizeMonthYearInput(e.target.value); const n = [...educations]; n[i] = { ...n[i], end_date: normalized, end_year: parseYearFromMonthYear(normalized) || n[i].end_year }; setEducations(n); }} onChange={e => { const n = [...educations]; n[i] = { ...n[i], end_date: e.target.value }; setEducations(n); }} /></div>
                          <div><Label className="text-xs">Grade</Label><Input value={edu.final_grade || ""} onChange={e => { const n = [...educations]; n[i] = { ...n[i], final_grade: e.target.value }; setEducations(n); }} placeholder="8.33" /></div>
                          <div><Label className="text-xs">Max Scale</Label><Input type="number" value={edu.max_scale || ""} onChange={e => { const n = [...educations]; n[i] = { ...n[i], max_scale: Number(e.target.value) }; setEducations(n); }} placeholder="10" /></div>
                        </div>
                        <div className="mt-2">
                          <Label className="text-xs">Key Subjects / Focus (Comma separated)</Label>
                          <Input
                            value={Array.isArray(edu.key_subjects) ? edu.key_subjects.join(", ") : edu.key_subjects || ""}
                            onChange={e => { const n = [...educations]; n[i] = { ...n[i], key_subjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }; setEducations(n); }}
                            placeholder="Research methods, Statistics, Clinical Psychology"
                          />
                        </div>
                      </div>
                      {educations.length > 1 && <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 flex-shrink-0" onClick={() => setEducations(educations.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">Work Experience <SectionTip tipKey="work" /></CardTitle>
                <Button size="sm" variant="outline" onClick={() => setWorkExperiences([...workExperiences, emptyWork()])}><Plus className="w-3 h-3 mr-1" />Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {workExperiences.length === 0 && <p className="text-xs text-muted-foreground">No work experience added (optional).</p>}
                {workExperiences.map((w, i) => (
                  <div key={i} className="border rounded-md p-3 space-y-2 relative">
                    <div className="flex items-start">
                      <ReorderButtons index={i} length={workExperiences.length} onMove={dir => setWorkExperiences(dir === "up" ? moveUp(workExperiences, i) : moveDown(workExperiences, i))} />
                      <div className="flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div><Label className="text-xs">Job Title *</Label><Input value={w.job_title} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], job_title: e.target.value }; setWorkExperiences(n); }} /></div>
                          <div><Label className="text-xs">Organisation *</Label><Input value={w.organisation} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], organisation: e.target.value }; setWorkExperiences(n); }} /></div>
                          <div><Label className="text-xs">City, Country</Label><Input value={w.city_country || ""} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], city_country: e.target.value }; setWorkExperiences(n); }} /></div>
                          <div><Label className="text-xs">Start Date (Mon YYYY)</Label><Input value={w.start_date} placeholder="Jun 2022" onBlur={e => { const n = [...workExperiences]; n[i] = { ...n[i], start_date: normalizeMonthYearInput(e.target.value) }; setWorkExperiences(n); }} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], start_date: e.target.value }; setWorkExperiences(n); }} /></div>
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <Label className="text-xs">End Date (Mon YYYY)</Label>
                              <Input value={w.end_date || ""} placeholder="Aug 2022" disabled={w.is_current} onBlur={e => { const n = [...workExperiences]; n[i] = { ...n[i], end_date: normalizeMonthYearInput(e.target.value) }; setWorkExperiences(n); }} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], end_date: e.target.value }; setWorkExperiences(n); }} />
                            </div>
                            <div className="flex items-center gap-1.5 pb-1.5">
                              <Switch checked={w.is_current || false} onCheckedChange={checked => { const n = [...workExperiences]; n[i] = { ...n[i], is_current: checked, end_date: checked ? "" : n[i].end_date }; setWorkExperiences(n); }} />
                              <Label className="text-xs whitespace-nowrap">Ongoing</Label>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Label className="text-xs">Description / Responsibilities (One per line)</Label>
                          <Textarea
                            value={Array.isArray(w.description) ? w.description.join("\n") : w.description || ""}
                            onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], description: toLines(e.target.value) }; setWorkExperiences(n); }}
                            placeholder="Developed React dashboards&#10;Optimized PostgreSQL queries"
                            className="text-xs min-h-[80px]"
                          />
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 flex-shrink-0" onClick={() => setWorkExperiences(workExperiences.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">Research Publications <SectionTip tipKey="publications" /></CardTitle>
                <Button size="sm" variant="outline" onClick={() => setPublications([...publications, emptyPublication()])}><Plus className="w-3 h-3 mr-1" />Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {publications.length === 0 && <p className="text-xs text-muted-foreground">No publications added (optional).</p>}
                {publications.map((pub, i) => (
                  <div key={i} className="border rounded-md p-3 space-y-2 relative">
                    <div className="flex items-start">
                      <ReorderButtons index={i} length={publications.length} onMove={dir => setPublications(dir === "up" ? moveUp(publications, i) : moveDown(publications, i))} />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2"><Label className="text-xs">Title *</Label><Input value={pub.title} onChange={e => { const n = [...publications]; n[i] = { ...n[i], title: e.target.value }; setPublications(n); }} /></div>
                        <div><Label className="text-xs">Year</Label><Input value={pub.year || ""} onChange={e => { const n = [...publications]; n[i] = { ...n[i], year: e.target.value }; setPublications(n); }} /></div>
                        <div className="sm:col-span-3"><Label className="text-xs">Journal / ISSN</Label><Input value={pub.journal || ""} onChange={e => { const n = [...publications]; n[i] = { ...n[i], journal: e.target.value }; setPublications(n); }} /></div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 flex-shrink-0" onClick={() => setPublications(publications.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">Language Skills * <SectionTip tipKey="languages" /></CardTitle>
                <Button size="sm" variant="outline" onClick={() => setLanguages([...languages, emptyLanguage()])}><Plus className="w-3 h-3 mr-1" />Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {languages.map((lang, i) => (
                  <div key={i} className="border rounded-md p-3 space-y-2 relative">
                    <div className="flex items-start">
                      <ReorderButtons index={i} length={languages.length} onMove={dir => setLanguages(dir === "up" ? moveUp(languages, i) : moveDown(languages, i))} />
                      <div className="flex-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div><Label className="text-xs">Language *</Label><Input value={lang.language_name} onChange={e => { const n = [...languages]; n[i] = { ...n[i], language_name: e.target.value }; setLanguages(n); }} placeholder="English" /></div>
                          <div className="flex items-end gap-2">
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <input type="checkbox" checked={lang.mother_tongue || false} onChange={e => { const n = [...languages]; n[i] = { ...n[i], mother_tongue: e.target.checked }; setLanguages(n); }} className="rounded" />
                              Mother Tongue
                            </label>
                          </div>
                        </div>
                        {!lang.mother_tongue && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                            {(["listening", "reading", "writing", "speaking"] as const).map(skill => (
                              <div key={skill}>
                                <Label className="text-xs capitalize">{skill}</Label>
                                <Select value={lang[skill] || ""} onValueChange={v => { const n = [...languages]; n[i] = { ...n[i], [skill]: v }; setLanguages(n); }}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Level" /></SelectTrigger>
                                  <SelectContent>{CEFR_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {languages.length > 1 && <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 flex-shrink-0" onClick={() => setLanguages(languages.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">Certifications <SectionTip tipKey="certifications" /></CardTitle>
                <Button size="sm" variant="outline" onClick={() => setCertifications([...certifications, emptyCertification()])}><Plus className="w-3 h-3 mr-1" />Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {certifications.length === 0 && <p className="text-xs text-muted-foreground">No certifications added (optional).</p>}
                {certifications.map((c, i) => (
                  <div key={i} className="border rounded-md p-3 relative">
                    <div className="flex items-start">
                      <ReorderButtons index={i} length={certifications.length} onMove={dir => setCertifications(dir === "up" ? moveUp(certifications, i) : moveDown(certifications, i))} />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div><Label className="text-xs">Title *</Label><Input value={c.title} onChange={e => { const n = [...certifications]; n[i] = { ...n[i], title: e.target.value }; setCertifications(n); }} /></div>
                        <div><Label className="text-xs">Institution</Label><Input value={c.institution || ""} onChange={e => { const n = [...certifications]; n[i] = { ...n[i], institution: e.target.value }; setCertifications(n); }} /></div>
                        <div><Label className="text-xs">Date (YYYY or Mon YYYY)</Label><Input value={c.date || ""} placeholder="2023 or Jun 2023" onBlur={e => { const n = [...certifications]; n[i] = { ...n[i], date: normalizeMonthYearInput(e.target.value) }; setCertifications(n); }} onChange={e => { const n = [...certifications]; n[i] = { ...n[i], date: e.target.value }; setCertifications(n); }} /></div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 flex-shrink-0" onClick={() => setCertifications(certifications.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">Additional Sections <SectionTip tipKey="custom" /></CardTitle>
                <Button size="sm" variant="outline" onClick={() => setCustomSections([...customSections, emptyCustomSection()])}><Plus className="w-3 h-3 mr-1" />Add Section</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {customSections.length === 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Add custom sections like:</p>
                    <div className="flex flex-wrap gap-1">
                      {SUGGESTED_SECTIONS.map(s => (
                        <Badge key={s} variant="outline" className="cursor-pointer text-xs hover:bg-primary/10" onClick={() => setCustomSections([...customSections, { title: s, items: [{ label: "", description: [] }] }])}>+ {s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {customSections.map((section, si) => (
                  <div key={si} className="border rounded-md p-3 space-y-2 relative">
                    <div className="flex items-start gap-1">
                      <ReorderButtons index={si} length={customSections.length} onMove={dir => setCustomSections(dir === "up" ? moveUp(customSections, si) : moveDown(customSections, si))} />
                      <div className="flex-1">
                        <div><Label className="text-xs">Section Title (editable)</Label><Input value={section.title} onChange={e => { const n = [...customSections]; n[si] = { ...n[si], title: e.target.value }; setCustomSections(n); }} placeholder="e.g. Research Experience" /></div>
                        {section.items.map((item, ii) => (
                          <div key={ii} className="space-y-1 mt-2">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1"><Input value={item.label} onChange={e => { const n = [...customSections]; n[si].items[ii] = { ...n[si].items[ii], label: e.target.value }; setCustomSections([...n]); }} placeholder="Item label" className="text-xs" /></div>
                              {section.items.length > 1 && <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => { const n = [...customSections]; n[si].items = n[si].items.filter((_, j) => j !== ii); setCustomSections(n); }}><Trash2 className="w-3 h-3" /></Button>}
                            </div>
                            <Textarea
                              className="text-xs min-h-[60px]"
                              value={Array.isArray(item.description) ? item.description.join("\n") : item.description || ""}
                              onChange={e => { const n = [...customSections]; n[si].items[ii] = { ...n[si].items[ii], description: toLines(e.target.value) }; setCustomSections([...n]); }}
                              placeholder="Description (One bullet per line)"
                            />
                          </div>
                        ))}
                        <Button size="sm" variant="ghost" className="text-xs mt-1" onClick={() => { const n = [...customSections]; n[si].items.push({ label: "", description: [] }); setCustomSections([...n]); }}><Plus className="w-3 h-3 mr-1" />Add Item</Button>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={() => setCustomSections(customSections.filter((_, j) => j !== si))}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center">Recommendations <SectionTip tipKey="recommendations" /></CardTitle>
                <Button size="sm" variant="outline" onClick={() => setRecommendations([...recommendations, emptyRecommendation()])}><Plus className="w-3 h-3 mr-1" />Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.length === 0 && <p className="text-xs text-muted-foreground">No referees added (optional).</p>}
                {recommendations.map((r, i) => (
                  <div key={i} className="border rounded-md p-3 space-y-2 relative">
                    <div className="flex items-start">
                      <ReorderButtons index={i} length={recommendations.length} onMove={dir => setRecommendations(dir === "up" ? moveUp(recommendations, i) : moveDown(recommendations, i))} />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div><Label className="text-xs">Name *</Label><Input value={r.name} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], name: e.target.value }; setRecommendations(n); }} /></div>
                        <div><Label className="text-xs">Designation</Label><Input value={r.designation || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], designation: e.target.value }; setRecommendations(n); }} /></div>
                        <div><Label className="text-xs">Department</Label><Input value={r.department || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], department: e.target.value }; setRecommendations(n); }} /></div>
                        <div><Label className="text-xs">Institution</Label><Input value={r.institution || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], institution: e.target.value }; setRecommendations(n); }} /></div>
                        <div><Label className="text-xs">Email</Label><Input value={r.email || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], email: e.target.value }; setRecommendations(n); }} /></div>
                        <div><Label className="text-xs">Contact</Label><Input value={r.contact || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], contact: e.target.value }; setRecommendations(n); }} /></div>
                        <div><Label className="text-xs">LOR Link</Label><Input value={r.lor_link || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], lor_link: e.target.value }; setRecommendations(n); }} placeholder="https://..." /></div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 flex-shrink-0" onClick={() => setRecommendations(recommendations.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeStep === 5 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">CV Appearance & Style</CardTitle></CardHeader>
              <CardContent>
                <Label className="text-xs mb-3 block">Header Background Color</Label>
                <div className="flex flex-wrap gap-2 mb-6">
                  {HEADER_COLORS.map(c => (
                    <TooltipProvider key={c.value}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" onClick={() => setHeaderBgColor(c.value)}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${headerBgColor.toLowerCase() === c.value.toLowerCase() ? "border-primary ring-2 ring-primary/20 scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c.value }} aria-label={c.label} />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">{c.label}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-muted hover:scale-110 transition-all">
                    <input type="color" value={headerBgColor} onChange={e => setHeaderBgColor(e.target.value)} className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer bg-transparent border-none" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px]">🎨</div>
                  </div>
                </div>

                <div className="mt-6">
                  <Label className="text-xs mb-3 block">Layout Density</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {DENSITY_OPTIONS.map(option => (
                      <button key={option.value} type="button" onClick={() => setDensity(option.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${density === option.value ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-muted bg-muted/20 hover:border-muted-foreground/30"}`}>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border shadow-sm">
                          <Layout className={`w-4 h-4 ${density === option.value ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-tight">{option.label}</div>
                        <div className="text-[9px] text-muted-foreground leading-tight text-center px-1">{option.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <Label className="text-xs mb-3 block">Section Order</Label>
                  <div className="space-y-2">
                    {(() => {
                      interface OrderedItem { key: string; label: string; originalKey: string; }
                      const orderedItems: OrderedItem[] = [];
                      for (const key of sectionOrder) {
                        if (key === "custom") {
                          customSections.forEach((s, idx) => orderedItems.push({ key: `custom-${idx}`, label: s.title || `Additional Section ${idx + 1}`, originalKey: "custom" }));
                          continue;
                        }
                        orderedItems.push({ key, label: REORDERABLE_SECTIONS.find(s => s.key === key)?.label || key, originalKey: key });
                      }
                      return orderedItems.map((item, index) => (
                        <div key={item.key} className="flex items-center justify-between border-2 border-muted/50 rounded-xl px-4 py-3 bg-background hover:border-primary/20 transition-colors shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center text-[10px] font-bold text-muted-foreground">{index + 1}</div>
                            <span className="text-xs font-semibold">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={index === 0} onClick={() => setSectionOrder(prev => moveUp(prev, prev.indexOf(item.originalKey as any)))}><ChevronUp className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={index === orderedItems.length - 1} onClick={() => setSectionOrder(prev => moveDown(prev, prev.indexOf(item.originalKey as any)))}><ChevronDown className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-40 lg:absolute lg:bg-transparent lg:border-none lg:p-0 lg:bottom-4 lg:right-12 lg:left-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:justify-end">
          <Button variant="outline" onClick={() => setActiveStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0} className="flex-1 lg:flex-none">Back</Button>
          {activeStep < STEPS.length - 1 ? (
            <Button onClick={() => setActiveStep(activeStep + 1)} className="flex-1 lg:flex-none bg-[#154a8a] hover:bg-[#0f3a6d]">Next: {STEPS[activeStep + 1].label}</Button>
          ) : (
            <div className="flex-1 lg:flex-none flex items-center gap-2">
              <Button variant="outline" onClick={downloadCVJson} className="flex-1 lg:flex-none">Download JSON</Button>
              <Button onClick={generatePDF} disabled={isGenerating} className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 shadow-lg">
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download CV
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-background overflow-hidden">
      <nav className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground shrink-0"><ArrowLeft className="w-4 h-4" /> publicgermany</Link>
            <span className="text-muted-foreground/50">|</span>
            <p className="text-sm min-w-0 truncate"><span className="font-semibold">Europass CV</span></p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isMobile && (
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showPreview ? "Form" : "Preview"}
              </Button>
            )}
            <ThemeToggle variant="icon" />
            <Button variant="outline" size="sm" asChild><Link to="/auth">Sign In</Link></Button>
          </div>
        </div>
      </nav>

      <div className="german-stripe" />

      <main className="max-w-7xl mx-auto px-4 py-3 h-[calc(100vh-64px)] overflow-hidden">
        {isMobile ? (
          showPreview ? (
            <div ref={previewContainerRef} className="border rounded-lg overflow-auto bg-white h-full">
              <div style={{ width: 794, transform: `scale(${previewScale})`, transformOrigin: "top left", height: previewDocHeight }}>
                <iframe ref={previewIframeRef} srcDoc={previewHtml} style={{ width: 794, height: previewDocHeight, border: "none" }} title="CV Preview" onLoad={updatePreviewHeight} />
              </div>
            </div>
          ) : <div className="h-full overflow-y-auto pr-1">{formContent}</div>
        ) : (
          <div className="grid grid-cols-12 gap-4 h-full overflow-hidden">
            <div className="col-span-8 h-full overflow-y-auto pr-2">{formContent}</div>
            <div className="col-span-4 h-full overflow-hidden" ref={previewContainerRef}>
              <div className="border rounded-lg overflow-auto bg-white h-full shadow-sm">
                <div style={{ width: 794, transform: `scale(${previewScale})`, transformOrigin: "top left", height: previewDocHeight }}>
                  <iframe ref={previewIframeRef} srcDoc={previewHtml} style={{ width: 794, height: previewDocHeight, border: "none" }} title="CV Preview" onLoad={updatePreviewHeight} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}