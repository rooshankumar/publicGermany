import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, GraduationCap, Globe, Award, Briefcase, Upload, Save } from 'lucide-react';
import Layout from '@/components/Layout';
import { DocumentUpload } from '@/components/DocumentUpload';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveIndicator } from '@/components/AutoSaveIndicator';

const Profile = () => {
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    country_of_education: '',
    class_10_marks: '',
    class_12_marks: '',
    class_12_stream: '',
    bachelor_degree_name: '',
    bachelor_field: '',
    bachelor_cgpa_percentage: '',
    bachelor_credits_ects: '',
    bachelor_duration_years: '',
    master_degree_name: '',
    master_field: '',
    master_cgpa_percentage: '',
    work_experience_years: '',
    work_experience_field: '',
    ielts_toefl_score: '',
    aps_pathway: '',
    german_level: '',
  });

  // Initialize auto-save
  const autoSave = useAutoSave({
    tableName: 'profiles',
    userId: profile?.user_id,
    onSuccess: () => {
      refetchProfile();
    }
  });

  // Auto-save disabled. Use manual save instead.
  const saveProfile = async () => {
    if (!profile?.user_id) {
      toast({
        title: "Profile not loaded",
        description: "Cannot save profile because user ID is missing.",
        variant: "destructive",
      });
      return;
    }
    const updateData = {
      ...formData,
      bachelor_credits_ects: formData.bachelor_credits_ects ? parseInt(formData.bachelor_credits_ects) : null,
      bachelor_duration_years: formData.bachelor_duration_years ? parseInt(formData.bachelor_duration_years) : null,
      work_experience_years: formData.work_experience_years ? parseInt(formData.work_experience_years) : null,
      aps_pathway: formData.aps_pathway === '' ? null : formData.aps_pathway as "stk" | "bachelor_2_semesters" | "master_applicants",
      german_level: formData.german_level === '' ? null : formData.german_level as "none" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2",
      };
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', profile.user_id);
      if (error) throw error;
      await refetchProfile();
      toast({
        title: "Profile saved",
        description: "Your changes have been saved.",
      });
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        date_of_birth: profile.date_of_birth || '',
        country_of_education: profile.country_of_education || '',
        class_10_marks: profile.class_10_marks || '',
        class_12_marks: profile.class_12_marks || '',
        class_12_stream: profile.class_12_stream || '',
        bachelor_degree_name: profile.bachelor_degree_name || '',
        bachelor_field: profile.bachelor_field || '',
        bachelor_cgpa_percentage: profile.bachelor_cgpa_percentage || '',
        bachelor_credits_ects: profile.bachelor_credits_ects?.toString() || '',
        bachelor_duration_years: profile.bachelor_duration_years?.toString() || '',
        master_degree_name: profile.master_degree_name || '',
        master_field: profile.master_field || '',
        master_cgpa_percentage: profile.master_cgpa_percentage || '',
        work_experience_years: profile.work_experience_years?.toString() || '',
        work_experience_field: profile.work_experience_field || '',
        ielts_toefl_score: profile.ielts_toefl_score || '',
        aps_pathway: profile.aps_pathway || '',
        german_level: profile.german_level || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Trigger auto-save with processed data
    const updateData = {
      ...newData,
      bachelor_credits_ects: newData.bachelor_credits_ects ? parseInt(newData.bachelor_credits_ects) : null,
      bachelor_duration_years: newData.bachelor_duration_years ? parseInt(newData.bachelor_duration_years) : null,
      work_experience_years: newData.work_experience_years ? parseInt(newData.work_experience_years) : null,
      aps_pathway: newData.aps_pathway === '' ? null : newData.aps_pathway as "stk" | "bachelor_2_semesters" | "master_applicants",
      german_level: newData.german_level === '' ? null : newData.german_level as "none" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2",
    };
    
    autoSave.debouncedSave(updateData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!profile?.user_id) {
      toast({
        title: "Profile not loaded",
        description: "Cannot save profile because user ID is missing.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        ...formData,
        bachelor_credits_ects: formData.bachelor_credits_ects ? parseInt(formData.bachelor_credits_ects) : null,
        bachelor_duration_years: formData.bachelor_duration_years ? parseInt(formData.bachelor_duration_years) : null,
        work_experience_years: formData.work_experience_years ? parseInt(formData.work_experience_years) : null,
        aps_pathway: formData.aps_pathway === '' ? null : formData.aps_pathway as 'stk' | 'bachelor_2_semesters' | 'master_applicants' | null,
        german_level: formData.german_level === '' ? null : formData.german_level as 'none' | 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2' | null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      });

      await refetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-mobile space-y-6">
        
        <div className="bg-gradient-to-r from-primary/10 to-accent/5 p-4 md:p-6 rounded-lg border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Profile Settings</h1>
              <p className="text-sm md:text-base text-foreground">Manage your personal information and academic details</p>
            </div>
            <AutoSaveIndicator 
              status={autoSave.status} 
              lastSaved={autoSave.lastSaved}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>Your basic personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country_of_education">Country of Education</Label>
                <Input
                  id="country_of_education"
                  value={formData.country_of_education}
                  onChange={(e) => handleInputChange('country_of_education', e.target.value)}
                  placeholder="e.g., India, Pakistan, Bangladesh"
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic History */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle>Academic History</CardTitle>
              </div>
              <CardDescription>Your educational background details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class_10_marks">Class 10 Marks (%)</Label>
                  <Input
                    id="class_10_marks"
                    value={formData.class_10_marks}
                    onChange={(e) => handleInputChange('class_10_marks', e.target.value)}
                    placeholder="e.g., 85%"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_12_marks">Class 12 Marks (%)</Label>
                  <Input
                    id="class_12_marks"
                    value={formData.class_12_marks}
                    onChange={(e) => handleInputChange('class_12_marks', e.target.value)}
                    placeholder="e.g., 90%"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class_12_stream">Class 12 Stream</Label>
                <Select value={formData.class_12_stream} onValueChange={(value) => handleInputChange('class_12_stream', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your stream" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="commerce">Commerce</SelectItem>
                    <SelectItem value="arts">Arts/Humanities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bachelor_degree_name">Bachelor's Degree</Label>
                  <Input
                    id="bachelor_degree_name"
                    value={formData.bachelor_degree_name}
                    onChange={(e) => handleInputChange('bachelor_degree_name', e.target.value)}
                    placeholder="e.g., B.Tech, B.Sc, B.Com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bachelor_field">Field of Study</Label>
                  <Input
                    id="bachelor_field"
                    value={formData.bachelor_field}
                    onChange={(e) => handleInputChange('bachelor_field', e.target.value)}
                    placeholder="e.g., Computer Science, Mechanical Engineering"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bachelor_cgpa_percentage">CGPA/Percentage</Label>
                  <Input
                    id="bachelor_cgpa_percentage"
                    value={formData.bachelor_cgpa_percentage}
                    onChange={(e) => handleInputChange('bachelor_cgpa_percentage', e.target.value)}
                    placeholder="e.g., 8.5 CGPA or 85%"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bachelor_credits_ects">Credits/ECTS</Label>
                  <Input
                    id="bachelor_credits_ects"
                    type="number"
                    value={formData.bachelor_credits_ects}
                    onChange={(e) => handleInputChange('bachelor_credits_ects', e.target.value)}
                    placeholder="e.g., 180"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bachelor_duration_years">Duration (Years)</Label>
                  <Input
                    id="bachelor_duration_years"
                    type="number"
                    value={formData.bachelor_duration_years}
                    onChange={(e) => handleInputChange('bachelor_duration_years', e.target.value)}
                    placeholder="e.g., 4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Proficiency */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Language Proficiency</CardTitle>
              </div>
              <CardDescription>Your language test scores and proficiency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ielts_toefl_score">IELTS/TOEFL Score</Label>
                  <Input
                    id="ielts_toefl_score"
                    value={formData.ielts_toefl_score}
                    onChange={(e) => handleInputChange('ielts_toefl_score', e.target.value)}
                    placeholder="e.g., IELTS 7.5 or TOEFL 100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="german_level">German Level</Label>
                  <Select value={formData.german_level} onValueChange={(value) => handleInputChange('german_level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select German level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="a1">A1 - Beginner</SelectItem>
                      <SelectItem value="a2">A2 - Elementary</SelectItem>
                      <SelectItem value="b1">B1 - Intermediate</SelectItem>
                      <SelectItem value="b2">B2 - Upper Intermediate</SelectItem>
                      <SelectItem value="c1">C1 - Advanced</SelectItem>
                      <SelectItem value="c2">C2 - Proficient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle>Work Experience (Optional)</CardTitle>
              </div>
              <CardDescription>Your professional background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work_experience_years">Years of Experience</Label>
                  <Input
                    id="work_experience_years"
                    type="number"
                    value={formData.work_experience_years}
                    onChange={(e) => handleInputChange('work_experience_years', e.target.value)}
                    placeholder="e.g., 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_experience_field">Field of Work</Label>
                  <Input
                    id="work_experience_field"
                    value={formData.work_experience_field}
                    onChange={(e) => handleInputChange('work_experience_field', e.target.value)}
                    placeholder="e.g., Software Development, Marketing"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* APS Pathway section removed, now on APS page */}

          {/* Document Upload section removed, now on APS page */}

          <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
            <Button type="submit" disabled={loading} className="min-w-32 w-full sm:w-auto">
              {loading ? 'Saving...' : 'Save Changes Now'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Profile;