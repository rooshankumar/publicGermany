import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractEmbeddedCVDataFromPDF, ImportedCVData } from "@/lib/cvImporter";

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
    if (ext !== "pdf") {
      toast({ title: "Unsupported file", description: "Please upload a PDF exported from PublicGermany.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    setIsParsing(true);
    setImported(false);

    try {
      const embeddedData = await extractEmbeddedCVDataFromPDF(file);
      if (!embeddedData) {
        toast({
          title: "No embedded CV data found",
          description: "This PDF does not contain PublicGermany editable CV metadata. Please export your CV as PDF from this tool and try again.",
          variant: "destructive",
        });
        return;
      }

      onImport(embeddedData);
      setImported(true);
      toast({
        title: "CV Imported for Editing",
        description: "Restored your editable CV from embedded PDF metadata.",
      });
    } catch (err) {
      console.error("CV import error:", err);
      toast({ title: "Import Failed", description: "Could not read embedded CV data from this PDF.", variant: "destructive" });
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
                Upload a PublicGermany-exported PDF to restore your editable CV.
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
              accept=".pdf"
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
