import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type ProfileInput } from '@/lib/eligibilityEngine';
import { GraduationCap, BookOpen, Globe, Briefcase, FileCheck, Send } from 'lucide-react';

interface StudentProfileFormProps {
  onSubmit: (data: ProfileInput) => void;
  initialData?: Partial<ProfileInput>;
}

export function StudentProfileForm({ onSubmit, initialData }: StudentProfileFormProps) {
  const [formData, setFormData] = useState<Partial<ProfileInput>>(initialData || {
    english_test_type: 'IELTS',
    english_test_status: 'Completed',
    german_level: 'None',
    has_aps_certificate: 'Not Applied',
  });

  const handleChange = (field: keyof ProfileInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as ProfileInput);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input 
              id="full_name" 
              placeholder="Enter your full name" 
              value={formData.full_name || ''} 
              onChange={e => handleChange('full_name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email"
              placeholder="your@email.com" 
              value={formData.email || ''} 
              onChange={e => handleChange('email', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="citizenship">Country of Citizenship</Label>
            <Input 
              id="citizenship" 
              placeholder="e.g. India" 
              value={formData.citizenship || ''} 
              onChange={e => handleChange('citizenship', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="residence_country">Current Country of Residence</Label>
            <Input 
              id="residence_country" 
              placeholder="e.g. India" 
              value={formData.residence_country || ''} 
              onChange={e => handleChange('residence_country', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Academic Background */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Academic Background
          </CardTitle>
          <CardDescription>Details about your Bachelor's degree</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bachelor_degree_name">Bachelor Degree Title</Label>
            <Input 
              id="bachelor_degree_name" 
              placeholder="e.g. Bachelor of Technology" 
              value={formData.bachelor_degree_name || ''} 
              onChange={e => handleChange('bachelor_degree_name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bachelor_field">Field of Study</Label>
            <Input 
              id="bachelor_field" 
              placeholder="e.g. Computer Science" 
              value={formData.bachelor_field || ''} 
              onChange={e => handleChange('bachelor_field', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="university_name">University Name</Label>
            <Input 
              id="university_name" 
              placeholder="Enter university name" 
              value={formData.university_name || ''} 
              onChange={e => handleChange('university_name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country_of_education">Country of University</Label>
            <Input 
              id="country_of_education" 
              placeholder="e.g. India" 
              value={formData.country_of_education || ''} 
              onChange={e => handleChange('country_of_education', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bachelor_duration_years">Degree Duration (Years)</Label>
            <Select 
              value={String(formData.bachelor_duration_years || '4')} 
              onValueChange={v => handleChange('bachelor_duration_years', Number(v))}
            >
              <SelectTrigger id="bachelor_duration_years">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Years</SelectItem>
                <SelectItem value="4">4 Years</SelectItem>
                <SelectItem value="5">5+ Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bachelor_credits_ects">Total Credits (ECTS if known)</Label>
            <Input 
              id="bachelor_credits_ects" 
              type="number"
              placeholder="e.g. 180 or 240" 
              value={formData.bachelor_credits_ects || ''} 
              onChange={e => handleChange('bachelor_credits_ects', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bachelor_cgpa_percentage">Final CGPA / Percentage</Label>
            <Input 
              id="bachelor_cgpa_percentage" 
              placeholder="e.g. 8.5 or 85" 
              value={formData.bachelor_cgpa_percentage || ''} 
              onChange={e => handleChange('bachelor_cgpa_percentage', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="min_passing_grade">Min Pass Grade</Label>
              <Input 
                id="min_passing_grade" 
                placeholder="e.g. 4.0" 
                value={formData.min_passing_grade || ''} 
                onChange={e => handleChange('min_passing_grade', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_grade">Max Grade</Label>
              <Input 
                id="max_grade" 
                placeholder="e.g. 10.0" 
                value={formData.max_grade || ''} 
                onChange={e => handleChange('max_grade', e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Proficiency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Language Proficiency
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="english_test_type">English Test Type</Label>
            <Select 
              value={formData.english_test_type || 'IELTS'} 
              onValueChange={v => handleChange('english_test_type', v)}
            >
              <SelectTrigger id="english_test_type">
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IELTS">IELTS</SelectItem>
                <SelectItem value="TOEFL">TOEFL</SelectItem>
                <SelectItem value="None">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ielts_toefl_score">Overall Score</Label>
            <Input 
              id="ielts_toefl_score" 
              placeholder="e.g. 7.5 or 105" 
              value={formData.ielts_toefl_score || ''} 
              onChange={e => handleChange('ielts_toefl_score', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="english_test_status">Test Status</Label>
            <Select 
              value={formData.english_test_status || 'Completed'} 
              onValueChange={v => handleChange('english_test_status', v)}
            >
              <SelectTrigger id="english_test_status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="german_level">German Language Level</Label>
            <Select 
              value={formData.german_level || 'None'} 
              onValueChange={v => handleChange('german_level', v)}
            >
              <SelectTrigger id="german_level">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Intended Program */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Intended Program
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="intended_master_course">Desired Field of Study (Master's)</Label>
            <Input 
              id="intended_master_course" 
              placeholder="e.g. Data Science" 
              value={formData.intended_master_course || ''} 
              onChange={e => handleChange('intended_master_course', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intake">Target Intake</Label>
            <Select 
              value={formData.intake || ''} 
              onValueChange={v => handleChange('intake', v)}
            >
              <SelectTrigger id="intake">
                <SelectValue placeholder="Select intake" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Winter 2024">Winter 2024</SelectItem>
                <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                <SelectItem value="Winter 2025">Winter 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Experience & Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Experience & Status
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="work_experience_years">Work Experience (Years)</Label>
            <Input 
              id="work_experience_years" 
              type="number"
              placeholder="0" 
              value={formData.work_experience_years || ''} 
              onChange={e => handleChange('work_experience_years', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="has_aps_certificate">APS Certificate Status (India)</Label>
            <Select 
              value={String(formData.has_aps_certificate || 'Not Applied')} 
              onValueChange={v => handleChange('has_aps_certificate', v)}
            >
              <SelectTrigger id="has_aps_certificate">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Applied">Not Applied</SelectItem>
                <SelectItem value="Applied">Applied</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full py-6 text-lg font-bold gap-2">
        <Send className="h-5 w-5" />
        Generate Eligibility Report
      </Button>
    </form>
  );
}
