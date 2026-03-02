import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Download, Loader2, GraduationCap, ArrowLeft, Upload, Eye, EyeOff } from "lucide-react";
import { buildCVHtml, CVPersonalInfo, CVEducation, CVWorkExperience, CVLanguage, CVPublication, CVCertification, CVCustomSection, CVRecommendation } from "@/lib/cvTemplateBuilder";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

declare global {
  interface Window {
    html2pdf?: any;
  }
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SUGGESTED_SECTIONS = ["Research Experience", "Technical Skills", "Academic Projects"];

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

export default function AcademicCVGenerator() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(!isMobile);

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

  // Build HTML for preview (debounced)
  const rawHtml = useMemo(() =>
    buildCVHtml(personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations),
    [personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations]
  );
  const previewHtml = useDebounce(rawHtml, 300);

  const generatePDF = async () => {
    if (!personal.full_name || !personal.email || educations.length === 0) {
      toast({ title: "Missing fields", description: "Please fill in at least your name, email, and one education entry.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      if (!window.html2pdf) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; document.head.appendChild(script); });
      }
      const html = buildCVHtml(personal, educations, workExperiences, languages, publications, certifications, customSections, recommendations);
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;min-height:1123px;border:none;';
      document.body.appendChild(iframe);
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) throw new Error('Could not access iframe');
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
        await new Promise(r => setTimeout(r, 1200));
        await window.html2pdf().set({
          margin: [12, 15, 12, 15],
          filename: `Academic_CV_${personal.full_name.replace(/\s+/g, "_")}_${new Date().getFullYear()}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff", allowTaint: true, windowWidth: 794 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        }).from(iframeDoc.body).save();
        toast({ title: "CV Generated!", description: "Your Academic CV has been downloaded." });
      } finally {
        document.body.removeChild(iframe);
      }
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
      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
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
              {personal.avatar_url && <img src={personal.avatar_url} alt="Profile" className="w-12 h-12 rounded-full object-cover mt-2 border" />}
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
          <CardTitle className="text-base">Education & Training *</CardTitle>
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
              <div><Label className="text-xs">Key Subjects / Focus</Label><Input value={edu.key_subjects || ""} onChange={e => { const n = [...educations]; n[i] = { ...n[i], key_subjects: e.target.value }; setEducations(n); }} placeholder="Research methods, Statistics" /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Publications */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Research Publications</CardTitle>
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
          <CardTitle className="text-base">Work Experience</CardTitle>
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
              <div><Label className="text-xs">Description</Label><Input value={w.description || ""} onChange={e => { const n = [...workExperiences]; n[i] = { ...n[i], description: e.target.value }; setWorkExperiences(n); }} /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Language Skills *</CardTitle>
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
          <CardTitle className="text-base">Certifications</CardTitle>
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
          <CardTitle className="text-base">Additional Sections</CardTitle>
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
                <div key={ii} className="flex gap-2 items-start">
                  <div className="flex-1"><Input value={item.label} onChange={e => { const n = [...customSections]; n[si].items[ii] = { ...n[si].items[ii], label: e.target.value }; setCustomSections([...n]); }} placeholder="Item label" className="text-xs" /></div>
                  <div className="flex-1"><Input value={item.description || ""} onChange={e => { const n = [...customSections]; n[si].items[ii] = { ...n[si].items[ii], description: e.target.value }; setCustomSections([...n]); }} placeholder="Description (optional)" className="text-xs" /></div>
                  {section.items.length > 1 && <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => { const n = [...customSections]; n[si].items = n[si].items.filter((_, j) => j !== ii); setCustomSections(n); }}><Trash2 className="w-3 h-3" /></Button>}
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
          <CardTitle className="text-base">Recommendations / Referees</CardTitle>
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
        <Button size="lg" onClick={generatePDF} disabled={isGenerating} className="w-full sm:w-auto px-8">
          {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating PDF...</> : <><Download className="w-4 h-4 mr-2" />Generate & Download CV</>}
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
            <div className="border rounded-lg overflow-hidden bg-white" style={{ height: "70vh" }}>
              <iframe srcDoc={previewHtml} className="w-full h-full border-0" title="CV Preview" />
            </div>
          ) : formContent
        ) : (
          <div className="flex gap-6">
            <div className="w-1/2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {formContent}
            </div>
            <div className="w-1/2 sticky top-28 h-[calc(100vh-200px)]">
              <div className="border rounded-lg overflow-hidden bg-white h-full shadow-sm">
                <iframe srcDoc={previewHtml} className="w-full h-full border-0" title="CV Preview" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
