import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateCVCompletion, CVCompletionStatus, formatValidationErrors, formatValidationWarnings } from "@/lib/cvValidation";

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

      // Open in new window and print (browser-native PDF)
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast({ title: "Pop-up blocked", description: "Please allow pop-ups to download the PDF.", variant: "destructive" });
        setIsGenerating(false);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(data.html);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      };

      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch { /* ignore */ }
      }, 3000);

      toast({ title: "Print Dialog Opened", description: "Select 'Save as PDF' to download your CV." });
    } catch (err) {
      console.error("CV generation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      
      let userMessage = "Failed to generate CV. Please try again.";
      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
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
