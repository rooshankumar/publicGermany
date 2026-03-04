import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateCVCompletion, CVCompletionStatus, formatValidationErrors, formatValidationWarnings } from "@/lib/cvValidation";

declare global {
  interface Window {
    html2pdf?: any;
  }
}

const HTML2PDF_CDN = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
const PDF_TIMEOUT = 45000;
const MAX_RETRIES = 2;

async function loadHtml2Pdf(timeout = 15000): Promise<typeof window.html2pdf> {
  if (window.html2pdf) return window.html2pdf;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = HTML2PDF_CDN;
    script.async = true;
    
    const timeoutId = setTimeout(() => {
      script.remove();
      reject(new Error("CDN timeout - please check your internet connection"));
    }, timeout);
    
    script.onload = () => {
      clearTimeout(timeoutId);
      resolve(window.html2pdf);
    };
    script.onerror = () => {
      clearTimeout(timeoutId);
      script.remove();
      reject(new Error("Failed to load PDF library - please refresh and try again"));
    };
    document.head.appendChild(script);
  });
}

export function useGenerateEuropassCV() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<CVCompletionStatus | null>(null);
  const { toast } = useToast();

  const validateCV = useCallback(async (userId: string) => {
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
  }, [toast]);

  const generateCVWithHtml2pdf = async (html: string, studentName: string): Promise<void> => {
    let html2pdfLib: typeof window.html2pdf;
    
    try {
      html2pdfLib = await loadHtml2Pdf(15000);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to load PDF library");
    }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;min-height:1123px;border:none;';
    document.body.appendChild(iframe);

    try {
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) throw new Error('Could not access iframe document');

          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();

          await new Promise(resolve => setTimeout(resolve, 1200));

          const element = iframeDoc.body;

          const options = {
            margin: 0,
            filename: `Academic_CV_${studentName.replace(/\s+/g, "_")}_${new Date().getFullYear()}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: "#ffffff",
              allowTaint: true,
              width: 794,
              windowWidth: 794,
              scrollX: 0,
              scrollY: 0,
            },
            jsPDF: {
              unit: "mm",
              format: "a4",
              orientation: "portrait" as const,
              compress: true,
            },
            pagebreak: { mode: ["avoid-all", "css", "legacy"] },
          };

          await Promise.race([
            html2pdfLib().set(options).from(element).save(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("PDF generation timed out")), PDF_TIMEOUT))
          ]);
          
          console.log(`✅ PDF generated successfully (attempt ${attempt})`);
          return;
        } catch (err) {
          console.warn(`PDF generation attempt ${attempt} failed:`, err);
          lastError = err instanceof Error ? err : new Error(String(err));
          
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      throw lastError || new Error("PDF generation failed after all retries");
    } finally {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
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
      if (!data?.html) throw new Error("Server returned empty response. Please try again.");

      await generateCVWithHtml2pdf(data.html, studentName);

      toast({ title: "Success", description: "Your Europass CV has been generated and downloaded successfully!" });
    } catch (err) {
      console.error("CV generation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      
      let userMessage = "Failed to generate CV. Please try again.";
      if (errorMessage.includes("timeout")) {
        userMessage = "PDF generation took too long. Please try again with less content.";
      } else if (errorMessage.includes("CDN") || errorMessage.includes("load")) {
        userMessage = "Unable to load PDF library. Please check your internet connection and refresh.";
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        userMessage = "Network error. Please check your internet connection.";
      }
      
      toast({
        title: "Error Generating CV",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateCV, isGenerating, validationStatus, validateCV };
}
