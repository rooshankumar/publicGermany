import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Download, Loader2, ArrowLeft, Upload, Eye, EyeOff, Info, Bold, Italic, AlignLeft, AlignCenter, AlignRight, ChevronUp, ChevronDown } from "lucide-react";
import { buildCVHtml, CVPersonalInfo, CVEducation, CVWorkExperience, CVLanguage, CVPublication, CVCertification, CVCustomSection, CVRecommendation, CVBuildOptions } from "@/lib/cvTemplateBuilder";
import CVImportUpload from "@/components/CVImportUpload";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ImportedCVData } from "@/lib/cvImporter";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SUGGESTED_SECTIONS = ["Academic Research", "Technical Skills", "Academic Projects", "Digital & Research Skills"];

const HEADER_COLORS = [
  { label: "EU Blue", value: "#004494" },
  { label: "Professional Blue", value: "#1A5FB4" },
  { label: "Indigo", value: "#4B5D88" },
  { label: "Steel Blue", value: "#3A6EA5" },
  { label: "Light Blue", value: "#6C8EBF" },
  { label: "White", value: "#ffffff" },
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
  key_subjects: "", final_grade: "", max_scale: 10, total_credits: 0, credit_system: "Indian Scale",
});
const emptyWork = (): CVWorkExperience => ({
  job_title: "", organisation: "", city_country: "", start_date: "", end_date: "", is_current: false, description: "",
});
const emptyLanguage = (): CVLanguage => ({
  language_name: "", mother_tongue: false, listening: "", reading: "", writing: "", speaking: "",
});
const emptyPublication = (): CVPublication => ({ title: "", journal: "", year: undefined });
const emptyCertification = (): CVCertification => ({ title: "", institution: "", date: "" });
const emptyCustomSection = (): CVCustomSection => ({ title: "", items: [{ label: "", description: "" }] });
const emptyRecommendation = (): CVRecommendation => ({ name: "", designation: "", department: "", institution: "", email: "", contact: "" });

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

    if (endYear < startYear) {
      warnings.push(`${edu.degree_title || "Education entry"}: end year is before start year.`);
    }

    if (index > 0) {
      const prev = sorted[index - 1];
      const prevEndYear = parseYearFromMonthYear(prev.end_date) ?? prev.end_year;
      const currentStartYear = parseYearFromMonthYear(edu.start_date) ?? edu.start_year;
      const gap = currentStartYear - prevEndYear;
      if (gap > 2) warnings.push(`Gap of ${gap} years between ${prev.degree_title || "previous education"} and ${edu.degree_title || "next education"}.`);

      const prevScore = levelScore(prev.degree_title || "");
      const currentScore = levelScore(edu.degree_title || "");
      if (prevScore > 0 && currentScore > 0 && currentScore < prevScore) {
        warnings.push(`Education order may be inconsistent: ${prev.degree_title} appears before ${edu.degree_title}.`);
      }
    }
  });

  return warnings;
}

// Reorder helpers
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
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const [photoPosition, setPhotoPosition] = useState("center");
  const [photoZoom, setPhotoZoom] = useState(100);
  const [headerBgColor, setHeaderBgColor] = useState("#004494");

  const [personal, setPersonal] = useState<CVPersonalInfo>({
    full_name: "", passport_number: "", date_of_birth: "", nationality: "",
    gender: "", place_of_birth: "", phone: "", email: "", linkedin_url: "", address: "",
    avatar_url: "", signature_url: "",
  });
  const [educations, setEducations] = useState<CVEducation[]>([emptyEducation()]);
  const [workExperiences, setWorkExperiences] = useState<CVWorkExperience[]>([]);
  const [languages, setLanguages] = useState<CVLanguage[]>([emptyLanguage()]);
  const [publications, setPublications] = useState<CVPublication[]>([]);
  const [certifications, setCertifications] = useState<CVCertification[]>([]);
  const [customSections, setCustomSections] = useState<CVCustomSection[]>([]);
  const [recommendations, setRecommendations] = useState<CVRecommendation[]>([]);

  const updatePersonal = (field: keyof CVPersonalInfo, value: string) =>
    setPersonal(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = (field: 'avatar_url' | 'signature_url') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updatePersonal(field, reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCVImport = useCallback((data: ImportedCVData) => {
    if (data.personal) {
      setPersonal(prev => ({
        ...prev,
        full_name: data.personal?.full_name || prev.full_name,
        email: data.personal?.email || prev.email,
        phone: data.personal?.phone || prev.phone,
        address: data.personal?.address || prev.address,
        linkedin_url: data.personal?.linkedin_url || prev.linkedin_url,
        nationality: data.personal?.nationality || prev.nationality,
        date_of_birth: data.personal?.date_of_birth || prev.date_of_birth,
      }));
    }
    if (data.educations?.length) setEducations(data.educations);
    if (data.workExperiences?.length) setWorkExperiences(data.workExperiences);
    if (data.languages?.length) setLanguages(data.languages);
    if (data.certifications?.length) setCertifications(data.certifications);
    if (data.publications?.length) setPublications(data.publications);
    if (data.customSections?.length) setCustomSections(data.customSections);
    if (data.recommendations?.length) setRecommendations(data.recommendations);
    if (data.buildOptions) {
      if (data.buildOptions.headerBgColor) setHeaderBgColor(data.buildOptions.headerBgColor);
      if (data.buildOptions.photoPosition) setPhotoPosition(data.buildOptions.photoPosition);
      if (data.buildOptions.photoZoom) setPhotoZoom(data.buildOptions.photoZoom);
    }
  }, []);

  const buildOptions: CVBuildOptions = { headerBgColor, photoPosition, photoZoom };

  const rawHtml = useMemo(() =>
    buildCVHtml(personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations, buildOptions),
    [personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations, headerBgColor, photoPosition, photoZoom]
  );
  const previewHtml = useDebounce(rawHtml, 300);

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

  // Direct PDF export: generate and download automatically
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
    if (timelineWarnings.length > 0) {
      toast({ title: "Education timeline warning", description: timelineWarnings[0] });
    }

    setIsGenerating(true);
    try {
      const previewDoc = previewIframeRef.current?.contentDocument;
      const previewCv = previewDoc?.querySelector(".cv-container") as HTMLElement | null;

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-99999px";
      container.style.top = "0";

      let cvElement: HTMLElement | null = null;
      if (previewCv) {
        cvElement = previewCv.cloneNode(true) as HTMLElement;
        container.appendChild(cvElement);
      } else {
        const html = buildCVHtml(personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations, buildOptions);
        container.style.width = "210mm";
        container.innerHTML = html;
        cvElement = container.querySelector(".cv-container") as HTMLElement | null;
      }

      document.body.appendChild(container);
      if (!cvElement) {
        container.remove();
        throw new Error("Failed to render CV content for PDF export.");
      }

      const images = Array.from(cvElement.querySelectorAll("img"));
      await Promise.all(images.map(img => {
        if ((img as HTMLImageElement).complete) return Promise.resolve();
        return new Promise<void>(resolve => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      }));

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const canvas = await html2canvas(cvElement, {
        scale: 1,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: cvElement.scrollWidth,
        windowWidth: cvElement.scrollWidth,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      const imageData = canvas.toDataURL("image/jpeg", 1.0);

      let heightLeft = imageHeight;
      let position = 0;

      doc.addImage(imageData, "JPEG", 0, position, pageWidth, imageHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -(imageHeight - heightLeft);
        doc.addPage();
        doc.addImage(imageData, "JPEG", 0, position, pageWidth, imageHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

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
          buildOptions,
        },
      };
      const encodedMetadata = btoa(unescape(encodeURIComponent(JSON.stringify(metadataPayload))));
      doc.setPage(1);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(1);
      doc.text(`PGCVMETA:${encodedMetadata}`, 1, 296, { baseline: "bottom" });

      container.remove();

      const safeName = (personal.full_name || "candidate")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/^_+|_+$/g, "") || "candidate";
      doc.save(`${safeName}_CV.pdf`);
      container.remove();
      toast({ title: "Download started", description: "Your CV PDF has been generated and downloaded." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
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
    <div className="space-y-4">
      {/* Import CV */}
      <CVImportUpload onImport={handleCVImport} />

      {/* Header Color Picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">CV Style Options</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-xs mb-2 block">Header Background Color</Label>
          <div className="flex flex-wrap gap-2 items-center">
            {HEADER_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setHeaderBgColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${headerBgColor === c.value ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border"}`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
            {/* Custom color picker */}
            <label className="relative cursor-pointer" title="Custom color">
              <div className={`w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center text-xs font-bold text-muted-foreground ${!HEADER_COLORS.find(c => c.value === headerBgColor) ? "ring-2 ring-primary/30 scale-110" : ""}`}
                style={{ backgroundColor: !HEADER_COLORS.find(c => c.value === headerBgColor) ? headerBgColor : undefined }}>
                +
              </div>
              <input type="color" value={headerBgColor} onChange={e => setHeaderBgColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
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
                <div className="mt-2 space-y-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border" style={{ display: "inline-block" }}>
                    <img src={personal.avatar_url} alt="Profile" className="w-full h-full object-cover" style={{ objectPosition: photoPosition, transform: `scale(${photoZoom / 100})` }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Position:</Label>
                    <Select value={photoPosition} onValueChange={setPhotoPosition}>
                      <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Zoom:</Label>
                    <Slider value={[photoZoom]} onValueChange={v => setPhotoZoom(v[0])} min={100} max={200} step={5} className="w-32" />
                    <span className="text-xs text-muted-foreground">{photoZoom}%</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Upload className="w-3 h-3" /> Signature</Label>
              <Input type="file" accept="image/*" onChange={handleFileUpload('signature_url')} className="text-xs mt-1" />
              {personal.signature_url && <img src={personal.signature_url} alt="Signature" className="h-8 mt-2 border" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
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
                    <div><Label className="text-xs">Total Credits</Label><Input type="number" value={edu.total_credits || ""} onChange={e => { const n = [...educations]; n[i] = { ...n[i], total_credits: Number(e.target.value) }; setEducations(n); }} /></div>
                    <div><Label className="text-xs">Credit System</Label><Input value={edu.credit_system || ""} onChange={e => { const n = [...educations]; n[i] = { ...n[i], credit_system: e.target.value }; setEducations(n); }} placeholder="Indian Scale" /></div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-xs">Key Subjects / Focus</Label>
                    <RichTextField
                      value={edu.key_subjects || ""}
                      onChange={v => { const n = [...educations]; n[i] = { ...n[i], key_subjects: v }; setEducations(n); }}
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

      {/* Work Experience */}
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
                        <Switch
                          checked={w.is_current || false}
                          onCheckedChange={checked => { const n = [...workExperiences]; n[i] = { ...n[i], is_current: checked, end_date: checked ? "" : n[i].end_date }; setWorkExperiences(n); }}
                        />
                        <Label className="text-xs whitespace-nowrap">Ongoing</Label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-xs">Description</Label>
                    <RichTextField
                      value={w.description || ""}
                      onChange={v => { const n = [...workExperiences]; n[i] = { ...n[i], description: v }; setWorkExperiences(n); }}
                      placeholder="Key responsibilities and achievements"
                    />
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 flex-shrink-0" onClick={() => setWorkExperiences(workExperiences.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Publications */}
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
                  <div><Label className="text-xs">Year</Label><Input type="number" value={pub.year || ""} onChange={e => { const n = [...publications]; n[i] = { ...n[i], year: Number(e.target.value) || undefined }; setPublications(n); }} /></div>
                  <div className="sm:col-span-3"><Label className="text-xs">Journal / ISSN</Label><Input value={pub.journal || ""} onChange={e => { const n = [...publications]; n[i] = { ...n[i], journal: e.target.value }; setPublications(n); }} /></div>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 flex-shrink-0" onClick={() => setPublications(publications.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Languages */}
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

      {/* Certifications */}
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

      {/* Custom Sections */}
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
                  <Badge key={s} variant="outline" className="cursor-pointer text-xs hover:bg-primary/10" onClick={() => setCustomSections([...customSections, { title: s, items: [{ label: "", description: "" }] }])}>
                    + {s}
                  </Badge>
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
                      <RichTextField
                        value={item.description || ""}
                        onChange={v => { const n = [...customSections]; n[si].items[ii] = { ...n[si].items[ii], description: v }; setCustomSections([...n]); }}
                        placeholder="Description (optional)"
                      />
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="text-xs mt-1" onClick={() => { const n = [...customSections]; n[si].items.push({ label: "", description: "" }); setCustomSections([...n]); }}><Plus className="w-3 h-3 mr-1" />Add Item</Button>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={() => setCustomSections(customSections.filter((_, j) => j !== si))}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center">Recommendations / Referees <SectionTip tipKey="recommendations" /></CardTitle>
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
                  <div><Label className="text-xs">Department</Label><Input value={r.department || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], department: e.target.value }; setRecommendations(n); }} placeholder="Department of Computer Science" /></div>
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

      {/* Generate Button */}
      <div className="text-center space-y-4 mt-6">
        <Button size="lg" onClick={generatePDF} disabled={isGenerating} className="w-full sm:w-auto px-8">
          {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating PDF…</> : <><Download className="w-4 h-4 mr-2" />Download PDF</>}
        </Button>
        <p className="text-xs text-muted-foreground">
          Downloads the generated CV directly as a PDF file.
        </p>
        <p className="text-xs text-muted-foreground">
          Want to save your CV and access more features?{" "}
          <Link to="/auth" className="text-primary font-medium hover:underline">Sign up for free →</Link>
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-background overflow-hidden">
      <nav className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground shrink-0">
              <ArrowLeft className="w-4 h-4" /> publicgermany
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <p className="text-sm min-w-0 truncate">
              <span className="font-semibold">Europass CV Generator</span>
              <span className="text-muted-foreground"> — Create a professional Europass-format academic CV for German university applications.</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isMobile && (
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showPreview ? "Form" : "Preview"}
              </Button>
            )}
            <ThemeToggle variant="icon" />
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="german-stripe" />

      <main className="max-w-7xl mx-auto px-4 py-3 h-[calc(100vh-64px)] overflow-hidden">
        {isMobile ? (
          showPreview ? (
            <div ref={previewContainerRef} className="border rounded-lg overflow-auto bg-white h-full">
              <div style={{ width: 794, transform: `scale(${previewScale})`, transformOrigin: "top left", height: `${100 / previewScale}%` }}>
                <iframe ref={previewIframeRef} srcDoc={previewHtml} style={{ width: 794, height: "100%", border: "none" }} title="CV Preview" />
              </div>
            </div>
          ) : <div className="h-full overflow-y-auto pr-1">{formContent}</div>
        ) : (
          <div className="grid grid-cols-12 gap-4 h-full overflow-hidden">
            <div className="col-span-8 h-full overflow-y-auto pr-2">
              {formContent}
            </div>
            <div className="col-span-4 h-full overflow-hidden" ref={previewContainerRef}>
              <div className="border rounded-lg overflow-auto bg-white h-full shadow-sm">
                <div style={{ width: 794, transform: `scale(${previewScale})`, transformOrigin: "top left", height: `${100 / previewScale}%` }}>
                  <iframe ref={previewIframeRef} srcDoc={previewHtml} style={{ width: 794, height: "100%", border: "none" }} title="CV Preview" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
