import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StudentProfileForm } from '@/components/StudentProfileForm';
import EligibilityEvaluation from '@/components/EligibilityEvaluation';
import { type ProfileInput } from '@/lib/eligibilityEngine';
import { Button } from '@/components/ui/button';
import { ChevronLeft, GraduationCap } from 'lucide-react';

export default function ProfileEvaluationPage() {
  const [profileData, setProfileData] = useState<ProfileInput | null>(null);

  const handleFormSubmit = (data: ProfileInput) => {
    setProfileData(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setProfileData(null);
  };

  return (
    <div className="container py-10 px-4 max-w-5xl mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          Germany Master's Evaluation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get a professional assessment of your eligibility for public universities in Germany with our 3-layer screening engine.
        </p>
      </div>

      {!profileData ? (
        <StudentProfileForm onSubmit={handleFormSubmit} />
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={handleReset} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Edit Profile Information
            </Button>
            <div className="text-sm text-muted-foreground">
              Evaluation for: <span className="font-semibold text-foreground">{profileData.full_name}</span>
            </div>
          </div>
          
          <EligibilityEvaluation profile={profileData} />
          
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Need to change something? You can go back and edit your details to see how it affects your score.
              </p>
              <Button variant="outline" onClick={handleReset}>
                Start New Evaluation
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
