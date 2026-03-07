import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseExtractedText, extractTextFromPDF, extractTextFromDOCX, extractEmbeddedCVDataFromPDF, ImportedCVData } from "@/lib/cvImporter";

interface CVImportUploadProps {
  onImport: (data: ImportedCVData) => void;
}

export default function CVImportUpload({ onImport }: CVImportUploadProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [imported, setImported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      toast({ title: "Unsupported file", description: "Please upload a PDF or DOCX file.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    setIsParsing(true);
    setImported(false);

    try {
      let text: string;
      if (ext === "pdf") {
        const embeddedData = await extractEmbeddedCVDataFromPDF(file);
        if (embeddedData) {
          onImport(embeddedData);
          setImported(true);
          toast({
            title: "CV Imported for Editing",
            description: "Detected PublicGermany metadata and restored your editable CV data.",
          });
          setIsParsing(false);
          if (inputRef.current) inputRef.current.value = "";
          return;
        }
        text = await extractTextFromPDF(file);
      } else {
        text = await extractTextFromDOCX(file);
      }

      if (!text || text.trim().length < 20) {
        toast({ title: "Could not extract text", description: "The file appears to be empty or image-only. Try a text-based PDF or DOCX.", variant: "destructive" });
        setIsParsing(false);
        return;
      }

      const data = parseExtractedText(text);
      onImport(data);
      setImported(true);
      toast({
        title: "CV Imported Successfully",
        description: "We imported your CV. Please review and update any details.",
      });
    } catch (err) {
      console.error("CV import error:", err);
      toast({ title: "Import Failed", description: "Could not parse the file. Please try a different format.", variant: "destructive" });
    } finally {
      setIsParsing(false);
      // Reset input so same file can be re-uploaded
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardContent className="py-4 px-5">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Import Existing CV</p>
              <p className="text-xs text-muted-foreground">
                Upload your old CV (PDF or DOCX) and we'll fill the form automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {imported && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Imported
              </span>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFile}
              className="hidden"
              id="cv-import-input"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isParsing}
              className="whitespace-nowrap"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Parsing…
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload CV
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
