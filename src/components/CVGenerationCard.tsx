import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, AlertTriangle, Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileEducation {
  id?: string;
  degree_title?: string;
  field_of_study?: string;
  institution?: string;
  country?: string;
  start_year?: number;
  end_year?: number;
  final_grade?: string;
  max_scale?: number;
  total_credits?: number;
}

interface ProfileLanguageSkill {
  id?: string;
  language_name?: string;
}

interface Profile {
  id?: string;
  full_name?: string;
  nationality?: string;
  date_of_birth?: string;
}

interface CVGenerationCardProps {
  profile: Profile | null;
  educations: ProfileEducation[];
  languages: ProfileLanguageSkill[];
  userEmail?: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
  isLoading?: boolean;
}

export function CVGenerationCard({
  profile,
  educations,
  languages,
  userEmail,
  isGenerating,
  onGenerate,
  isLoading = false,
}: CVGenerationCardProps) {
  // Validate education entries have complete required information
  const hasCompleteEducation = educations.length > 0 &&
    educations.some(
      (e) =>
        e.degree_title &&
        e.institution &&
        e.country &&
        e.start_year &&
        e.end_year &&
        e.final_grade &&
        e.max_scale &&
        e.total_credits
    );

  // Check mandatory fields from correct sources
  const mandatoryFields = {
    name: !!profile?.full_name,
    nationality: !!profile?.nationality,
    dateOfBirth: !!profile?.date_of_birth,
    email: !!userEmail,
    hasEducation: educations.length > 0,
    educationComplete: hasCompleteEducation,
    hasLanguage: languages.length > 0,
  };

  // Calculate completion percentage
  const completionItems = Object.values(mandatoryFields).filter(Boolean).length;
  const totalItems = Object.keys(mandatoryFields).length;
  const completionPercentage = Math.round((completionItems / totalItems) * 100);

  // Determine status
  const isReadyToGenerate =
    mandatoryFields.name &&
    mandatoryFields.nationality &&
    mandatoryFields.dateOfBirth &&
    mandatoryFields.email &&
    mandatoryFields.educationComplete &&
    mandatoryFields.hasLanguage;

  const missingFields = Object.entries(mandatoryFields)
    .filter(([_, value]) => !value)
    .map(([key, _]) => {
      switch (key) {
        case "name":
          return "Full name";
        case "nationality":
          return "Nationality";
        case "dateOfBirth":
          return "Date of birth";
        case "email":
          return "Email";
        case "hasEducation":
          return "At least one education entry";
        case "educationComplete":
          return "Complete education (with grade & credits)";
        case "hasLanguage":
          return "At least one language";
        default:
          return key;
      }
    });

  // Determine color based on completion
  let statusColor = "bg-red-500";
  let statusIcon = <AlertCircle className="w-5 h-5" />;
  let statusLabel = "Incomplete";

  if (completionPercentage === 100) {
    statusColor = "bg-green-500";
    statusIcon = <CheckCircle2 className="w-5 h-5" />;
    statusLabel = "Ready";
  } else if (completionPercentage >= 60) {
    statusColor = "bg-yellow-500";
    statusIcon = <AlertTriangle className="w-5 h-5" />;
    statusLabel = "Almost ready";
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: statusColor }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              Europass CV
            </CardTitle>
            <CardDescription>Generate your professional CV in Europass format</CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <div className={`w-3 h-3 rounded-full ${statusColor}`} />
              {statusLabel}
            </div>
            <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Completion</span>
            <span>
              {completionItems} of {totalItems} fields
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Missing fields alert */}
        {missingFields.length > 0 && (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold text-sm mb-1">Missing fields:</div>
              <ul className="text-sm space-y-0.5 ml-0">
                {missingFields.map((field, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Generate button */}
        <Button
          onClick={onGenerate}
          disabled={!isReadyToGenerate || isGenerating || isLoading}
          size="lg"
          className="w-full"
          variant={isReadyToGenerate ? "default" : "secondary"}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate & Download CV
            </>
          )}
        </Button>

        {/* Info text */}
        <p className="text-xs text-muted-foreground">
          {isReadyToGenerate
            ? "Your CV is ready to generate. Click the button above to download your Europass CV as a PDF."
            : "Complete the highlighted fields above to generate your Europass CV."}
        </p>
      </CardContent>
    </Card>
  );
}
