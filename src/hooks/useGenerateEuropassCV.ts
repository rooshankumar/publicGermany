import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateCVCompletion, CVCompletionStatus, formatValidationErrors, formatValidationWarnings } from "@/lib/cvValidation";

// Uses browser-native print for pixel-perfect PDF generation

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

  const generateCVWithPrint = (html: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Popup Blocked", description: "Please allow popups to download your CV as PDF.", variant: "destructive" });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 1500);
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
