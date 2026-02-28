import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateCVCompletion, CVCompletionStatus, formatValidationErrors, formatValidationWarnings } from "@/lib/cvValidation";

declare global {
  interface Window {
    html2pdf?: any;
  }
}

export interface CVGenerationConfig {
  useCompactMode?: boolean;
  forceHtml2pdf?: boolean; // Force client-side fallback
}

export function useGenerateEuropassCV() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<CVCompletionStatus | null>(null);
  const { toast } = useToast();

  /**
   * Validate CV before generation
   */
  const validateCV = async (userId: string) => {
    try {
      // Fetch all CV data for validation
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
      toast({
        title: "Validation Error",
        description: "Could not validate CV. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  /**
   * Download PDF blob to user's device
   */
  const downloadPDF = (pdfBlob: Blob, filename: string) => {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('✅ PDF downloaded:', filename);
  };

  /**
   * Fallback: Generate PDF using client-side html2pdf
   */
  const generateCVWithHtml2pdf = async (
    html: string,
    studentName: string
  ) => {
    try {
      console.log('📦 Using client-side html2pdf fallback');

      // Load html2pdf library from CDN
      if (!window.html2pdf) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Create hidden container for rendering
      const iframeContainer = document.createElement("div");
      iframeContainer.style.position = "absolute";
      iframeContainer.style.left = "-9999px";
      iframeContainer.style.top = "-9999px";
      iframeContainer.style.width = "210mm";
      iframeContainer.style.height = "297mm";
      iframeContainer.innerHTML = html;
      document.body.appendChild(iframeContainer);

      // Wait for DOM paint
      await new Promise(resolve => setTimeout(resolve, 300));

      const options = {
        margin: [10, 10, 10, 10],
        filename: `Europass_CV_${studentName.replace(/\s+/g, "_")}_${new Date().getFullYear()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          windowHeight: 1200,
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait",
          compress: true,
        },
        pagebreak: { 
          mode: ["avoid-all", "css", "legacy"],
          before: ".section-title",
          avoid: [".entry", ".language-table"],
        },
      };

      // Generate PDF
      const element = iframeContainer.querySelector(".container") || iframeContainer;
      await window.html2pdf().set(options).from(element).save();

      // Cleanup
      document.body.removeChild(iframeContainer);

      console.log('✅ Fallback PDF generated with html2pdf');
    } catch (err) {
      console.error('❌ Fallback html2pdf error:', err);
      throw new Error('PDF generation failed with both methods');
    }
  };

  /**
   * Generate PDF with Puppeteer (server-side) or fallback to html2pdf
   */
  const generateCV = async (
    userId: string, 
    studentName: string,
    config: CVGenerationConfig = {}
  ) => {
    setIsGenerating(true);
    try {
      // Validate CV first
      const status = await validateCV(userId);
      if (!status) throw new Error("Validation failed");

      if (!status.isComplete) {
        const errors = formatValidationErrors(status);
        toast({
          title: errors.title,
          description: errors.description,
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Show content advisory if CV may exceed 2 pages
      if (status.contentMetrics.mayExceedTwoPages) {
        const warnings = formatValidationWarnings(status);
        if (warnings.length > 0) {
          toast({
            title: "Content Advisory",
            description: warnings[0],
            variant: "default",
          });
        }
      }

      // Call the edge function to generate HTML
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke("generate-europass-cv", {
        body: { user_id: userId },
      });

      if (edgeFunctionError) throw edgeFunctionError;
      if (!edgeFunctionData?.html) throw new Error("No HTML returned from generation function");

      const html = edgeFunctionData.html;

      // Try server-side Puppeteer first (unless forced to html2pdf)
      if (!config.forceHtml2pdf) {
        try {
          console.log('🚀 Attempting server-side PDF generation with Puppeteer');
          
          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              html,
              studentName,
              config,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.warn('⚠️ Puppeteer failed, will use fallback:', errorData);
            
            // If response indicates fallback is needed, use html2pdf
            if (errorData.fallback) {
              throw new Error('Puppeteer unavailable');
            }
            throw new Error(errorData.error || 'PDF generation failed');
          }

          // Get PDF as blob
          const pdfBlob = await response.blob();
          if (pdfBlob.size === 0) throw new Error('Empty PDF received');

          // Download PDF
          const filename = `Europass_CV_${studentName.replace(/\s+/g, "_")}_${new Date().getFullYear()}.pdf`;
          downloadPDF(pdfBlob, filename);

          toast({
            title: "Success",
            description: `Europass CV generated with Puppeteer (${status.contentMetrics.estimatedPages} pages) - Server-rendered for maximum quality`,
          });

          console.log('✅ Server-side PDF completed');
          return;
        } catch (puppeteerError) {
          console.warn('⚠️ Puppeteer endpoint failed, falling back to html2pdf:', puppeteerError);
          // Fall through to html2pdf
        }
      }

      // Fallback to client-side html2pdf
      console.log('🔄 Falling back to client-side html2pdf');
      await generateCVWithHtml2pdf(html, studentName);

      toast({
        title: "Success",
        description: `Europass CV generated with html2pdf (${status.contentMetrics.estimatedPages} pages)`,
      });

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

  return { 
    generateCV, 
    isGenerating,
    validationStatus,
    validateCV,
  };
}
