import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractEmbeddedCVDataFromPDF, parseImportedCVJson, parseImportedCVMarkdown, buildCVMarkdownTemplate, ImportedCVData } from "@/lib/cvImporter";

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
    if (ext !== "pdf" && ext !== "json" && ext !== "md" && ext !== "markdown") {
      toast({ title: "Unsupported file", description: "Please upload a .pdf, .json, or .md file from PublicGermany.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    setIsParsing(true);
    setImported(false);

    try {
      if (ext === "json") {
        const text = await file.text();
        const data = parseImportedCVJson(text);
        if (!data) {
          toast({
            title: "Invalid JSON file",
            description: "This file doesn't look like a PublicGermany CV backup. Download the template, fill it in, and upload it again.",
            variant: "destructive",
          });
          return;
        }
        onImport(data);
        setImported(true);
        toast({
          title: "CV Imported for Editing",
          description: "Restored your CV from the JSON file. Review the fields and preview on the right.",
        });
        return;
      }

      if (ext === "md" || ext === "markdown") {
        const text = await file.text();
        const data = parseImportedCVMarkdown(text);
        if (!data) {        toast({
          title: "No CV data found",
          description: "The file needs to keep the template format — lines like 'Full Name: Jane Doe' under a heading such as 'Education'. Download the template, fill it in, and upload it again.",
          variant: "destructive",
        });
          return;
        }
        onImport(data);
        setImported(true);
        toast({
          title: "CV Imported for Editing",
          description: "Restored your CV from the markdown file. Review the fields and preview on the right.",
        });
        return;
      }

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
      toast({ title: "Import Failed", description: "Could not read CV data from this file.", variant: "destructive" });
    } finally {
      setIsParsing(false);
      // Reset input so same file can be re-uploaded
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    try {
      const data = buildCVMarkdownTemplate();
      const blob = new Blob([data], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "PublicGermany_CV_Template.md";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "Template downloaded",
        description: "Fill it in following the instructions inside, then upload the completed file here.",
      });
    } catch (err) {
      console.error("Template download error:", err);
      toast({ title: "Download failed", description: "Could not download the template.", variant: "destructive" });
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardContent className="py-4 px-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Import Existing CV</p>
              <p className="text-xs text-muted-foreground">
                Upload a PublicGermany PDF, a JSON backup, or a completed template. The template file includes fill-in instructions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {imported && (
              <span className="flex items-center gap-1 text-xs text-green-600 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" /> Imported
              </span>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.json,.md,.markdown,application/json,text/markdown"
              onChange={handleFile}
              className="hidden"
              id="cv-import-input"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isParsing}
              className="whitespace-nowrap flex-1 sm:flex-none"
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
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="whitespace-nowrap flex-1 sm:flex-none">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Template
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
