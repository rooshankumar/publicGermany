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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Download, GraduationCap, ArrowLeft, Upload, Eye, EyeOff, Info, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { buildCVHtml, CVPersonalInfo, CVEducation, CVWorkExperience, CVLanguage, CVPublication, CVCertification, CVCustomSection, CVRecommendation, CVBuildOptions } from "@/lib/cvTemplateBuilder";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import CVImportUpload from "@/components/CVImportUpload";
import type { ImportedCVData } from "@/lib/cvImporter";

// No html2pdf needed — we use browser-native print for pixel-perfect PDF

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SUGGESTED_SECTIONS = ["Research Experience", "Technical Skills", "Academic Projects"];

const HEADER_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Light Gray", value: "#f5f5f5" },
  { label: "Light Blue", value: "#e8f0fe" },
  { label: "Navy Subtle", value: "#f0f4f8" },
  { label: "Cream", value: "#faf8f5" },
  { label: "Light Sage", value: "#f0f5f0" },
];

const SECTION_TIPS: Record<string, string> = {
  personal: "Include all details as they appear on your passport. This helps universities verify your identity.",
  education: "List degrees in reverse chronological order. Include ECTS/credit equivalents and grading scale.",
  publications: "Include peer-reviewed papers, conference proceedings, and working papers. Use standard citation format.",
  work: "Include relevant professional experience, internships, and research positions.",
  languages: "Use CEFR levels (A1-C2). Mother tongue languages are listed separately.",
  certifications: "Include relevant certificates, MOOCs, and professional development courses.",
  custom: "Add sections like Research Experience, Technical Skills, or Academic Projects.",
  recommendations: "Include 2-3 academic referees who can vouch for your work.",
};

const emptyEducation = (): CVEducation => ({
  degree_title: "", field_of_study: "", institution: "", country: "",
  start_year: new Date().getFullYear() - 4, end_year: new Date().getFullYear(),
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
const emptyRecommendation = (): CVRecommendation => ({ name: "", designation: "", institution: "", email: "", contact: "" });

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Info tooltip component
function SectionTip({ tipKey }: { tipKey: string }) {
  const tip = SECTION_TIPS[tipKey];
  if (!tip) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help ml-1.5 inline-block" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Rich text mini-toolbar + contenteditable field
function RichTextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
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

export default function AcademicCVGenerator() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showPreview, setShowPreview] = useState(!isMobile);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Photo controls
  const [photoPosition, setPhotoPosition] = useState("center");
  const [photoZoom, setPhotoZoom] = useState(100);
  // Header color
  const [headerBgColor, setHeaderBgColor] = useState("#ffffff");

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

  // Handle CV import
  const handleCVImport = (data: ImportedCVData) => {
    if (data.personal) {
      setPersonal(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(data.personal).filter(([_, v]) => v !== undefined && v !== "")
        ),
      }));
    }
    if (data.educations.length > 0) setEducations(data.educations);
    if (data.workExperiences.length > 0) setWorkExperiences(data.workExperiences);
    if (data.languages.length > 0) setLanguages(data.languages);
    if (data.certifications.length > 0) setCertifications(data.certifications);
  };

  const buildOptions: CVBuildOptions = { headerBgColor, photoPosition, photoZoom };

  // Build HTML for preview (debounced)
  const rawHtml = useMemo(() =>
    buildCVHtml(personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations, buildOptions),
    [personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations, headerBgColor, photoPosition, photoZoom]
  );
  const previewHtml = useDebounce(rawHtml, 300);

  // Calculate preview scale to fit container
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

  const generatePDF = () => {
    if (!personal.full_name || !personal.email || educations.length === 0) {
      toast({ title: "Missing fields", description: "Please fill in at least your name, email, and one education entry.", variant: "destructive" });
      return;
    }

    const html = buildCVHtml(personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations, buildOptions);

    // Open a new window with the CV HTML and trigger the browser's native print dialog
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Popup Blocked", description: "Please allow popups for this site to download your CV as PDF.", variant: "destructive" });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for images to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };

    // Fallback if onload already fired
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 1500);

    toast({ title: "Print Dialog Opened", description: "Select 'Save as PDF' in the print dialog to download your CV." });
  };

  useEffect(() => {
    document.title = "Free Europass CV Generator for Germany | Academic CV";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Generate a professional academic CV in Europass format for German university applications. Free, no sign-up required.");
  }, []);

  const formContent = (
    <div className="space-y-4">
      {/* Header Color Picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">CV Style Options</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-xs mb-2 block">Header Background Color</Label>
          <div className="flex flex-wrap gap-2">
            {HEADER_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setHeaderBgColor(c.value)}
                className={`w-8 h-8 rounded-md border-2 transition-all ${headerBgColor === c.value ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
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
            <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={personal.date_of_birth} onChange={e => updatePersonal("date_of_birth", e.target.value)} /></div>
            <div><Label className="text-xs">Nationality</Label><Input value={personal.nationality} onChange={e => updatePersonal("nationality", e.target.value)} placeholder="Indian" /></div>
            <div><Label className="text-xs">Gender</Label><Input value={personal.gender} onChange={e => updatePersonal("gender", e.target.value)} placeholder="Male / Female" /></div>
            <div><Label className="text-xs">Passport Number</Label><Input value={personal.passport_number} onChange={e => updatePersonal("passport_number", e.target.value)} /></div>
            <div><Label className="text-xs">Place of Birth</Label><Input value={personal.place_of_birth} onChange={e => updatePersonal("place_of_birth", e.target.value)} placeholder="City, State, Country" /></div>
            <div className="sm:col-span-2"><Label className="text-xs">Address</Label><Input value={personal.address} onChange={e => updatePersonal("address", e.target.value)} placeholder="Street, City, Postal Code, Country" /></div>
            <div className="sm:col-span-2"><Label className="text-xs">LinkedIn URL</Label><Input value={personal.linkedin_url} onChange={e => updatePersonal("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/yourname" /></div>
          </div>
          {/* Photo & Signature uploads */}
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
              {educations.length > 1 && <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setEducations(educations.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><Label className="text-xs">Degree Title *</Label><Input value={edu.degree_title} onChange={e => { const n = [...educations]; n[i] = { ...n[i], degree_title: e.target.value }; setEducations(n); }} placeholder="Bachelor of Arts (Honours)" /></div>
                <div><Label className="text-xs">Field of Study *</Label><Input value={edu.field_of_study} onChange={e => { const n = [...educations]; n[i] = { ...n[i], field_of_study: e.target.value }; setEducations(n); }} placeholder="Applied Psychology" /></div>
                <div><Label className="text-xs">Institution *</Label><Input value={edu.institution} onChange={e => { const n = [...educations]; n[i] = { ...n[i], institution: e.target.value }; setEducations(n); }} /></div>
                <div><Label className="text-xs">Country *</Label><Input value={edu.country} onChange={e => { const n = [...educations]; n[i] = { ...n[i], country: e.target.value }; setEducations(n); }} placeholder="India" /></div>
                <div><Label className="text-xs">Start Year</Label><Input type="number" value={edu.start_year} onChange={e => { const n = [...educations]; n[i] = { ...n[i], start_year: Number(e.target.value) }; setEducations(n); }} /></div>
                <div><Label className="text-xs">End Year</Label><Input type="number" value={edu.end_year} onChange={e => { const n = [...educations]; n[i] = { ...n[i], end_year: Number(e.target.value) }; setEducations(n); }} /></div>
                <div><Label className="text-xs">Grade</Label><Input value={edu.final_grade || ""} onChange={e => { const n = [...educations]; n[i] = { ...n[i], final_grade: e.target.value }; setEducations(n); }} placeholder="8.33" /></div>
                <div><Label className="text-xs">Max Scale</Label><Input type="number" value={edu.max_scale || ""} onChange={e => { const n = [...educations]; n[i] = { ...n[i], max_scale: Number(e.target.value) }; setEducations(n); }} placeholder="10" /></div>
                <div><Label className="text-xs">Total Credits</Label><Input type="number" value={edu.total_credits || ""} onChange={e => { const n = [...educations]; n[i] = { ...n[i], total_credits: Number(e.target.value) }; setEducations(n); }} /></div>
                <div><Label className="text-xs">Credit System</Label><Input value={edu.credit_system || ""} onChange={e => { const n = [...educations]; n[i] = { ...n[i], credit_system: e.target.value }; setEducations(n); }} placeholder="Indian Scale" /></div>
              </div>
              <div>
                <Label className="text-xs">Key Subjects / Focus</Label>
                <RichTextField
                  value={edu.key_subjects || ""}
                  onChange={v => { const n = [...educations]; n[i] = { ...n[i], key_subjects: v }; setEducations(n); }}
                  placeholder="Research methods, Statistics, Clinical Psychology"
                />
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
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setPublications(publications.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2"><Label className="text-xs">Title *</Label><Input value={pub.title} onChange={e => { const n = [...publications]; n[i] = { ...n[i], title: e.target.value }; setPublications(n); }} /></div>
                <div><Label className="text-xs">Year</Label><Input type="number" value={pub.year || ""} onChange={e => { const n = [...publications]; n[i] = { ...n[i], year: Number(e.target.value) || undefined }; setPublications(n); }} /></div>
              </div>
              <div><Label className="text-xs">Journal / ISSN</Label><Input value={pub.journal || ""} onChange={e => { const n = [...publications]; n[i] = { ...n[i], journal: e.target.value }; setPublications(n); }} /></div>
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
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setWorkExperiences(workExperiences.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><Label className="text-xs">Job Title *</Label><Input value={w.job_title} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], job_title: e.target.value }; setWorkExperiences(n); }} /></div>
                <div><Label className="text-xs">Organisation *</Label><Input value={w.organisation} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], organisation: e.target.value }; setWorkExperiences(n); }} /></div>
                <div><Label className="text-xs">City, Country</Label><Input value={w.city_country || ""} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], city_country: e.target.value }; setWorkExperiences(n); }} /></div>
                <div><Label className="text-xs">Start Date</Label><Input type="date" value={w.start_date} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], start_date: e.target.value }; setWorkExperiences(n); }} /></div>
                <div><Label className="text-xs">End Date</Label><Input type="date" value={w.end_date || ""} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], end_date: e.target.value }; setWorkExperiences(n); }} /></div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <RichTextField
                  value={w.description || ""}
                  onChange={v => { const n = [...workExperiences]; n[i] = { ...n[i], description: v }; setWorkExperiences(n); }}
                  placeholder="Key responsibilities and achievements"
                />
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
              {languages.length > 1 && <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setLanguages(languages.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setCertifications(certifications.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><Label className="text-xs">Title *</Label><Input value={c.title} onChange={e => { const n = [...certifications]; n[i] = { ...n[i], title: e.target.value }; setCertifications(n); }} /></div>
                <div><Label className="text-xs">Institution</Label><Input value={c.institution || ""} onChange={e => { const n = [...certifications]; n[i] = { ...n[i], institution: e.target.value }; setCertifications(n); }} /></div>
                <div><Label className="text-xs">Date</Label><Input type="date" value={c.date || ""} onChange={e => { const n = [...certifications]; n[i] = { ...n[i], date: e.target.value }; setCertifications(n); }} /></div>
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
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setCustomSections(customSections.filter((_, j) => j !== si))}><Trash2 className="w-3 h-3" /></Button>
              <div><Label className="text-xs">Section Title</Label><Input value={section.title} onChange={e => { const n = [...customSections]; n[si] = { ...n[si], title: e.target.value }; setCustomSections(n); }} placeholder="e.g. Research Experience" /></div>
              {section.items.map((item, ii) => (
                <div key={ii} className="space-y-1">
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
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => { const n = [...customSections]; n[si].items.push({ label: "", description: "" }); setCustomSections([...n]); }}><Plus className="w-3 h-3 mr-1" />Add Item</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations / LOR */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center">Recommendations / Referees <SectionTip tipKey="recommendations" /></CardTitle>
          <Button size="sm" variant="outline" onClick={() => setRecommendations([...recommendations, emptyRecommendation()])}><Plus className="w-3 h-3 mr-1" />Add</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.length === 0 && <p className="text-xs text-muted-foreground">No referees added (optional).</p>}
          {recommendations.map((r, i) => (
            <div key={i} className="border rounded-md p-3 space-y-2 relative">
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setRecommendations(recommendations.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><Label className="text-xs">Name *</Label><Input value={r.name} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], name: e.target.value }; setRecommendations(n); }} /></div>
                <div><Label className="text-xs">Designation</Label><Input value={r.designation || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], designation: e.target.value }; setRecommendations(n); }} /></div>
                <div><Label className="text-xs">Institution</Label><Input value={r.institution || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], institution: e.target.value }; setRecommendations(n); }} /></div>
                <div><Label className="text-xs">Email</Label><Input value={r.email || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], email: e.target.value }; setRecommendations(n); }} /></div>
                <div><Label className="text-xs">Contact</Label><Input value={r.contact || ""} onChange={e => { const n = [...recommendations]; n[i] = { ...n[i], contact: e.target.value }; setRecommendations(n); }} /></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="text-center space-y-4 mt-6">
        <Button size="lg" onClick={generatePDF} className="w-full sm:w-auto px-8">
          <Download className="w-4 h-4 mr-2" />Download CV as PDF
        </Button>
        <p className="text-xs text-muted-foreground">
          Want to save your CV and access more features?{" "}
          <Link to="/auth" className="text-primary font-medium hover:underline">Sign up for free →</Link>
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Slim nav */}
      <nav className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> publicgermany
          </Link>
          <div className="flex items-center gap-2">
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

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Europass CV Generator</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Create a professional Europass-format academic CV for German university applications.
          Your data stays in your browser — nothing is stored on our servers.
        </p>
      </div>

      {/* Split layout: form left, preview right (desktop) */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {isMobile ? (
          showPreview ? (
            <div ref={previewContainerRef} className="border rounded-lg overflow-hidden bg-white" style={{ height: "70vh" }}>
              <div style={{ width: 794, transform: `scale(${previewScale})`, transformOrigin: "top left", height: `${100 / previewScale}%` }}>
                <iframe srcDoc={previewHtml} style={{ width: 794, height: "100%", border: "none" }} title="CV Preview" />
              </div>
            </div>
          ) : formContent
        ) : (
          <div className="flex gap-6">
            <div className="w-1/2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {formContent}
            </div>
            <div className="w-1/2 sticky top-28 h-[calc(100vh-200px)]" ref={previewContainerRef}>
              <div className="border rounded-lg overflow-hidden bg-white h-full shadow-sm">
                <div style={{ width: 794, transform: `scale(${previewScale})`, transformOrigin: "top left", height: `${100 / previewScale}%` }}>
                  <iframe srcDoc={previewHtml} style={{ width: 794, height: "100%", border: "none" }} title="CV Preview" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
