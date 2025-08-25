import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, GraduationCap, Award, ExternalLink } from 'lucide-react';

interface PathwayOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  requirements: string[];
  recommended?: boolean;
  pdfGuide?: string;
}

interface APSPathwaySelectorProps {
  selectedPathway?: string;
  onSelectPathway: (pathwayId: string) => void;
}

const APSPathwaySelector = ({ selectedPathway, onSelectPathway }: APSPathwaySelectorProps) => {
  const pathwayOptions: PathwayOption[] = [
    {
      id: 'stk',
      title: 'STK (Studienkolleg Route)',
      subtitle: 'For XII Grade students',
      description: 'Complete a foundation year at Studienkolleg before starting your bachelor\'s degree',
      requirements: [
        'Class XII certificates',
        'All academic transcripts',
        'Passport copies',
        'Statement of Purpose',
        'Schedule APS interview'
      ],
      recommended: true,
      pdfGuide: '#'
    },
    {
      id: 'bachelor_2_semesters',
      title: 'Bachelor with 2 Semesters',
      subtitle: 'For undergraduates with 2 semesters completed',
      description: 'Direct admission to German universities with completed undergraduate semesters',
      requirements: [
        'University transcripts (2 semesters)',
        'Class XII certificates',
        'Provisional degree certificate',
        'Passport copies',
        'Statement of Purpose',
        'Schedule APS interview'
      ],
      pdfGuide: '#'
    },
    {
      id: 'master_applicants',
      title: 'Master Applicants',
      subtitle: 'For BA graduates',
      description: 'Direct admission to master\'s programs with completed bachelor\'s degree',
      requirements: [
        'Bachelor\'s degree certificate',
        'Complete academic transcripts',
        'Class XII certificates',
        'Passport copies',
        'Statement of Purpose',
        'Schedule APS interview'
      ],
      pdfGuide: '#'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle>Choose Your APS Pathway</CardTitle>
        </div>
        <CardDescription>
          Select the appropriate APS pathway based on your current education level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {pathwayOptions.map((pathway) => (
            <Card
              key={pathway.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedPathway === pathway.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onSelectPathway(pathway.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{pathway.title}</CardTitle>
                    {pathway.recommended && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <GraduationCap className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <CardDescription className="text-sm font-medium text-foreground">
                  {pathway.subtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-muted-foreground">{pathway.description}</p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Required Documents:</p>
                  <ul className="text-xs space-y-1">
                    {pathway.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-primary">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle PDF guide download
                    }}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    PDF Guide
                  </Button>
                  {selectedPathway === pathway.id && (
                    <Badge variant="default" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPathway && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Next Steps</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Based on your selection, we'll customize your checklist and provide relevant guidance.
            </p>
            <Button size="sm" className="w-full">
              Continue with Selected Pathway
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default APSPathwaySelector;