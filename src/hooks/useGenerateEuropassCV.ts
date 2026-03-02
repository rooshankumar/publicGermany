import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateCVCompletion, CVCompletionStatus, formatValidationErrors, formatValidationWarnings } from "@/lib/cvValidation";

declare global {
  interface Window {
    html2pdf?: any;
  }
}

export function useGenerateEuropassCV() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<CVCompletionStatus | null>(null);
  const { toast } = useToast();

  const validateCV = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      const [
        { data: educations },
        { data: workExperiences },
        { data: languages },
        { data: publications },
      ] = await Promise.all([
        supabase.from("profile_educations").select("*").eq("profile_id", userId),
        supabase.from("profile_work_experiences").select("*").eq("profile_id", userId),
        supabase.from("profile_language_skills").select("*").eq("profile_id", userId),
        supabase.from("profile_publications").select("*").eq("profile_id", userId),
      ]);

      const status = validateCVCompletion(profile, educations || [], workExperiences || [], languages || [], publications || []);
      setValidationStatus(status);
      return status;
    } catch (err) {
      console.error("Validation error:", err);
      toast({ title: "Validation Error", description: "Could not validate CV. Please try again.", variant: "destructive" });
      return null;
    }
  };

  const generateCVWithHtml2pdf = async (html: string, studentName: string) => {
    if (!window.html2pdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;min-height:1123px;border:none;';
    document.body.appendChild(iframe);

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe document');

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      await new Promise(resolve => setTimeout(resolve, 1200));

      const element = iframeDoc.body;

      const options = {
        margin: [12, 15, 12, 15],
        filename: `Academic_CV_${studentName.replace(/\s+/g, "_")}_${new Date().getFullYear()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          windowWidth: 794,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait" as const,
          compress: true,
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await window.html2pdf().set(options).from(element).save();
      console.log('✅ PDF generated successfully');
    } finally {
      document.body.removeChild(iframe);
    }
  };

  const generateCV = async (userId: string, studentName: string) => {
    setIsGenerating(true);
    try {
      const status = await validateCV(userId);
      if (!status) throw new Error("Validation failed");

      if (!status.isComplete) {
        const errors = formatValidationErrors(status);
        toast({ title: errors.title, description: errors.description, variant: "destructive" });
        setIsGenerating(false);
        return;
      }

      if (status.contentMetrics.mayExceedTwoPages) {
        const warnings = formatValidationWarnings(status);
        if (warnings.length > 0) {
          toast({ title: "Content Advisory", description: warnings[0] });
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-europass-cv", {
        body: { user_id: userId },
      });

      if (error) throw error;
      if (!data?.html) throw new Error("No HTML returned from generation function");

      await generateCVWithHtml2pdf(data.html, studentName);

      toast({ title: "Success", description: "Your Academic CV has been generated and downloaded." });
    } catch (err) {
      console.error("CV generation error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate CV",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateCV, isGenerating, validationStatus, validateCV };
}
