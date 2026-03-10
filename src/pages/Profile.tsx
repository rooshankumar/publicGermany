import { useState, useEffect, useRef } from 'react';
import { useAuth, type Document } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, Save, FileText, Image as ImageIcon, AlertTriangle, BookOpen, Languages, Users, Briefcase, Plus, Edit2, Trash2, GraduationCap } from 'lucide-react';
import Layout from '@/components/Layout';
import { DocumentUpload } from '@/components/DocumentUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import EligibilityEvaluation from '@/components/EligibilityEvaluation';
import { useEducations } from '@/hooks/useEducations';
import { useWorkExperiences } from '@/hooks/useWorkExperiences';
import { useLanguageSkills } from '@/hooks/useLanguageSkills';

// Small helper to handle avatar click-to-upload
function AvatarUpload({ avatarUrl, fullName, onUpload }: { avatarUrl?: string; fullName?: string; onUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex items-center gap-4">
      <div
        role="button"
        aria-label="Upload profile photo"
        className="relative"
        onClick={() => inputRef.current?.click()}
      >
        <Avatar className="h-16 w-16 ring-2 ring-accent/50 cursor-pointer hover:ring-primary transition">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{(fullName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </div>
    </div>
  );
}

const Profile = () => {
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch authenticated user email from auth.users
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUserEmail(user?.email || null);
      } catch (err) {
        console.error('Error fetching user email:', err);
      }
    };
    fetchUserEmail();
  }, []);

  // Europass CV hooks
  const educations = useEducations(profile?.user_id || '');
  const workExperiences = useWorkExperiences(profile?.user_id || '');
  const languageSkills = useLanguageSkills(profile?.user_id || '');

  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    passport_number: '',
    place_of_birth: '',
    gender: '',
    nationality: '',
    phone: '',
    email: '',
    linkedin_url: '',
    address_street: '',
    address_city: '',
    address_postal_code: '',
    address_country: '',
    signature_url: '',
    signature_date: '',
    digital_research_skills: '',
    country_of_education: '',
    state_of_education: '',
    class_10_marks: '',
    class_12_marks: '',
    class_12_stream: '',
    bachelor_degree_name: '',
    bachelor_university: '',
    bachelor_field: '',
    bachelor_cgpa_percentage: '',
    bachelor_credits_ects: '',
    bachelor_duration_years: '',
    intended_master_course: '',
    intake: '',
    contract_reference: '',
    master_degree_name: '',
    master_field: '',
    master_cgpa_percentage: '',
    work_experience_years: '',
    work_experience_field: '',
    ielts_toefl_score: '',
    aps_pathway: '',
    german_level: '',
    has_aps_certificate: '',
    avatar_url: '',
  });

  // Track unsaved changes per section
  const [unsavedSections, setUnsavedSections] = useState<Set<string>>(new Set());
  const [savedFormData, setSavedFormData] = useState(formData);

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
      // Normalize empty strings to null for typed columns
      date_of_birth: formData.date_of_birth === '' ? null : formData.date_of_birth,
      passport_number: formData.passport_number || null,
      place_of_birth: formData.place_of_birth || null,
      gender: formData.gender || null,
      nationality: formData.nationality || null,
      phone: formData.phone || null,
      linkedin_url: formData.linkedin_url || null,
      address_street: formData.address_street || null,
      address_city: formData.address_city || null,
      address_postal_code: formData.address_postal_code || null,
      address_country: formData.address_country || null,
      signature_url: formData.signature_url || null,
      signature_date: formData.signature_date === '' ? null : formData.signature_date,
      digital_research_skills:
        formData.digital_research_skills !== ''
          ? JSON.parse(formData.digital_research_skills)
          : null,
      bachelor_credits_ects: formData.bachelor_credits_ects ? parseInt(formData.bachelor_credits_ects) : null,
      bachelor_duration_years: formData.bachelor_duration_years ? parseInt(formData.bachelor_duration_years) : null,
      work_experience_years: formData.work_experience_years ? parseInt(formData.work_experience_years) : null,
      bachelor_university: formData.bachelor_university || null,
      intended_master_course: formData.intended_master_course || null,
      intake: formData.intake || null,
      contract_reference: formData.contract_reference || null,
      aps_pathway: formData.aps_pathway === '' ? null : formData.aps_pathway as "stk" | "bachelor_2_semesters" | "master_applicants",
      german_level: formData.german_level === '' ? null : formData.german_level as "none" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2",
      has_aps_certificate: formData.has_aps_certificate === '' ? null : formData.has_aps_certificate === 'yes',
      country_of_education: formData.country_of_education || null,
      state_of_education: formData.state_of_education || null,
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
      console.log('Loading profile data:', profile);
      setFormData({
        full_name: profile.full_name || '',
        date_of_birth: profile.date_of_birth || '',
        passport_number: (profile as any).passport_number || '',
        place_of_birth: (profile as any).place_of_birth || '',
        gender: (profile as any).gender || '',
        nationality: (profile as any).nationality || '',
        phone: (profile as any).phone || '',
        email: (profile as any).email || '',
        linkedin_url: (profile as any).linkedin_url || '',
        address_street: (profile as any).address_street || '',
        address_city: (profile as any).address_city || '',
        address_postal_code: (profile as any).address_postal_code || '',
        address_country: (profile as any).address_country || '',
        signature_url: (profile as any).signature_url || '',
        signature_date: (profile as any).signature_date || '',
        digital_research_skills: profile && (profile as any).digital_research_skills ? JSON.stringify((profile as any).digital_research_skills) : '',
        country_of_education: profile.country_of_education || '',
        state_of_education: (profile as any).state_of_education || '',
        class_10_marks: profile.class_10_marks || '',
        class_12_marks: profile.class_12_marks || '',
        class_12_stream: profile.class_12_stream || '',
        bachelor_degree_name: profile.bachelor_degree_name || '',
        bachelor_university: (profile as any).bachelor_university || '',
        bachelor_field: profile.bachelor_field || '',
        bachelor_cgpa_percentage: profile.bachelor_cgpa_percentage || '',
        bachelor_credits_ects: profile.bachelor_credits_ects?.toString() || '',
        bachelor_duration_years: profile.bachelor_duration_years?.toString() || '',
        intended_master_course: (profile as any).intended_master_course || '',
        intake: (profile as any).intake || '',
        contract_reference: (profile as any).contract_reference || '',
        master_degree_name: profile.master_degree_name || '',
        master_field: profile.master_field || '',
        master_cgpa_percentage: profile.master_cgpa_percentage || '',
        work_experience_years: profile.work_experience_years?.toString() || '',
        work_experience_field: profile.work_experience_field || '',
        ielts_toefl_score: profile.ielts_toefl_score || '',
        aps_pathway: profile.aps_pathway || '',
        german_level: profile.german_level || '',
        has_aps_certificate: typeof (profile as any).has_aps_certificate === 'boolean' 
          ? ((profile as any).has_aps_certificate ? 'yes' : 'no')
          : '',
        avatar_url: (profile as any).avatar_url || '',
      });
    }
  }, [profile]);

  // Fetch all CV data when profile loads
  useEffect(() => {
    if (profile?.user_id) {
      educations.fetchEducations();
      workExperiences.fetchWorkExperiences();
      languageSkills.fetchLanguageSkills();
    }
  }, [profile?.user_id]);

  // Auto-sync personal info and Europass data in real-time
  // Retry sync with improved timeout handling
  useEffect(() => {
    if (!profile) return;

    const syncTimer = setTimeout(() => {
      try {
        console.log('🔄 AUTO-SYNC TRIGGERED:', {
          profile_id: profile.user_id,
          educations_count: educations.entries.length,
          workExperiences_count: workExperiences.entries.length,
          languages_count: languageSkills.entries.length,
          formData_sample: { bachelor_degree_name: formData.bachelor_degree_name, bachelor_field: formData.bachelor_field },
        });

        const updates: any = {};
        let shouldUpdate = false;

        // PERSONAL INFO SYNC
        // Map address fields to country/state fields if needed
        if (!formData.country_of_education && (profile as any).address_country) {
          updates.country_of_education = (profile as any).address_country;
          shouldUpdate = true;
          console.log('📍 Syncing country:', updates.country_of_education);
        }
        if (!formData.state_of_education && (profile as any).address_city) {
          updates.state_of_education = (profile as any).address_city;
          shouldUpdate = true;
          console.log('📍 Syncing state:', updates.state_of_education);
        }

        // EDUCATION SYNC - watch entry count to trigger real-time updates
        if (educations.entries.length > 0) {
          const firstEdu = educations.entries[0];
          console.log('📚 First education entry:', firstEdu);
          
          if ((!formData.bachelor_degree_name || formData.bachelor_degree_name === '') && firstEdu.degree_title) {
            updates.bachelor_degree_name = firstEdu.degree_title;
            shouldUpdate = true;
            console.log('✏️ Syncing bachelor_degree_name:', firstEdu.degree_title);
          }
          if ((!formData.bachelor_field || formData.bachelor_field === '') && firstEdu.field_of_study) {
            updates.bachelor_field = firstEdu.field_of_study;
            shouldUpdate = true;
            console.log('✏️ Syncing bachelor_field:', firstEdu.field_of_study);
          }
          if ((!formData.bachelor_university || formData.bachelor_university === '') && firstEdu.institution) {
            updates.bachelor_university = firstEdu.institution;
            shouldUpdate = true;
            console.log('✏️ Syncing bachelor_university:', firstEdu.institution);
          }
          if ((!formData.bachelor_cgpa_percentage || formData.bachelor_cgpa_percentage === '') && firstEdu.final_grade) {
            updates.bachelor_cgpa_percentage = firstEdu.final_grade;
            shouldUpdate = true;
            console.log('✏️ Syncing bachelor_cgpa_percentage:', firstEdu.final_grade);
          }
          if ((!formData.bachelor_credits_ects || formData.bachelor_credits_ects === '') && firstEdu.total_credits) {
            updates.bachelor_credits_ects = firstEdu.total_credits.toString();
            shouldUpdate = true;
            console.log('✏️ Syncing bachelor_credits_ects:', firstEdu.total_credits);
          }
          if ((!formData.bachelor_duration_years || formData.bachelor_duration_years === '') && firstEdu.start_year && firstEdu.end_year) {
            updates.bachelor_duration_years = (firstEdu.end_year - firstEdu.start_year).toString();
            shouldUpdate = true;
            console.log('✏️ Syncing bachelor_duration_years:', firstEdu.end_year - firstEdu.start_year);
          }

          // Sync second education if available (Master's)
          if (educations.entries.length > 1) {
            const secondEdu = educations.entries[1];
            if ((!formData.master_degree_name || formData.master_degree_name === '') && secondEdu.degree_title) {
              updates.master_degree_name = secondEdu.degree_title;
              shouldUpdate = true;
              console.log('✏️ Syncing master_degree_name:', secondEdu.degree_title);
            }
            if ((!formData.master_field || formData.master_field === '') && secondEdu.field_of_study) {
              updates.master_field = secondEdu.field_of_study;
              shouldUpdate = true;
              console.log('✏️ Syncing master_field:', secondEdu.field_of_study);
            }
            if ((!formData.master_cgpa_percentage || formData.master_cgpa_percentage === '') && secondEdu.final_grade) {
              updates.master_cgpa_percentage = secondEdu.final_grade;
              shouldUpdate = true;
              console.log('✏️ Syncing master_cgpa_percentage:', secondEdu.final_grade);
            }
          }
        }

        // LANGUAGE SYNC - English language proficiency
        const englishLang = languageSkills.entries.find((l) => l.language_name?.toLowerCase() === 'english');
        if (englishLang) {
          console.log('🌐 English language entry:', englishLang);
          if ((!formData.ielts_toefl_score || formData.ielts_toefl_score === '') && englishLang.ielts_score) {
            updates.ielts_toefl_score = `IELTS ${englishLang.ielts_score}`;
            shouldUpdate = true;
            console.log('✏️ Syncing ielts_toefl_score:', englishLang.ielts_score);
          }
        }

        // WORK EXPERIENCE SYNC
        if (workExperiences.entries.length > 0) {
          console.log('💼 First work experience:', workExperiences.entries[0]);
          if ((!formData.work_experience_years || formData.work_experience_years === '')) {
            updates.work_experience_years = workExperiences.entries.length.toString();
            shouldUpdate = true;
            console.log('✏️ Syncing work_experience_years:', workExperiences.entries.length);
          }
          if ((!formData.work_experience_field || formData.work_experience_field === '') && workExperiences.entries[0].job_title) {
            updates.work_experience_field = workExperiences.entries[0].job_title;
            shouldUpdate = true;
            console.log('✏️ Syncing work_experience_field:', workExperiences.entries[0].job_title);
          }
        }

        if (shouldUpdate) {
          console.log('✅ FINAL UPDATES OBJECT:', updates);
          setFormData((prev) => {
            const newFormData = { ...prev, ...updates };
            console.log('📝 formData AFTER sync:', newFormData);
            return newFormData;
          });
        } else {
          console.log('⏭️ NO UPDATES NEEDED - Fields already populated or no data');
        }
      } catch (err) {
        console.error('❌ ERROR IN AUTO-SYNC:', err);
      }
    }, 0); // Run synchronously after hydration

    return () => clearTimeout(syncTimer);
  }, [
    profile,
    educations.entries.length, 
    workExperiences.entries.length, 
    languageSkills.entries.length,
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Mark section as unsaved
    const sectionName = getSectionFromField(field);
    setUnsavedSections(prev => new Set([...prev, sectionName]));
  };

  // Map fields to their section names
  const getSectionFromField = (field: string): string => {
    if (['full_name', 'date_of_birth', 'passport_number', 'place_of_birth', 'gender', 'nationality', 'phone', 'linkedin_url', 'address_street', 'address_city', 'address_postal_code', 'address_country'].includes(field)) return 'personal';
    if (['class_10_marks', 'class_12_marks', 'class_12_stream', 'bachelor_degree_name', 'bachelor_university', 'bachelor_field', 'bachelor_cgpa_percentage', 'bachelor_credits_ects', 'bachelor_duration_years', 'intended_master_course', 'intake', 'contract_reference', 'master_degree_name', 'master_field', 'master_cgpa_percentage'].includes(field)) return 'academic';
    if (['work_experience_years', 'work_experience_field'].includes(field)) return 'work';
    if (['ielts_toefl_score', 'german_level', 'aps_pathway', 'has_aps_certificate'].includes(field)) return 'language';
    if (['country_of_education', 'state_of_education'].includes(field)) return 'education_location';
    return 'other';
  };

  // Save specific section
  const saveSection = async (sectionName: string) => {
    await saveProfile();
    setSavedFormData(formData);
    setUnsavedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionName);
      return newSet;
    });
  };

  // Cancel changes for specific section
  const cancelSection = (sectionName: string) => {
    setFormData(savedFormData);
    setUnsavedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionName);
      return newSet;
    });
    toast({
      title: "Changes cancelled",
      description: "Your changes have been discarded.",
    });
  };

  // Check if section has unsaved changes
  const isSectionDirty = (sectionName: string): boolean => unsavedSections.has(sectionName);

  // Render section header with Save/Cancel buttons
  const SectionHeader = ({ title, description, sectionName }: { title: string; description?: string; sectionName: string }) => (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {isSectionDirty(sectionName) && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelSection(sectionName)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => saveSection(sectionName)}
              >
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
    </>
  );

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
        full_name: formData.full_name || null,
        date_of_birth: formData.date_of_birth === '' ? null : formData.date_of_birth,
        country_of_education: formData.country_of_education || null,
        state_of_education: formData.state_of_education || null,
        class_10_marks: formData.class_10_marks || null,
        class_12_marks: formData.class_12_marks || null,
        class_12_stream: formData.class_12_stream || null,
        bachelor_degree_name: formData.bachelor_degree_name || null,
        bachelor_university: formData.bachelor_university || null,
        bachelor_field: formData.bachelor_field || null,
        bachelor_cgpa_percentage: formData.bachelor_cgpa_percentage || null,
        bachelor_credits_ects: formData.bachelor_credits_ects ? parseInt(formData.bachelor_credits_ects) : null,
        bachelor_duration_years: formData.bachelor_duration_years ? parseInt(formData.bachelor_duration_years) : null,
        intended_master_course: formData.intended_master_course || null,
        intake: formData.intake || null,
        contract_reference: formData.contract_reference || null,
        master_degree_name: formData.master_degree_name || null,
        master_field: formData.master_field || null,
        master_cgpa_percentage: formData.master_cgpa_percentage || null,
        work_experience_years: formData.work_experience_years ? parseInt(formData.work_experience_years) : null,
        work_experience_field: formData.work_experience_field || null,
        ielts_toefl_score: formData.ielts_toefl_score || null,
        aps_pathway: formData.aps_pathway === '' ? null : formData.aps_pathway as 'stk' | 'bachelor_2_semesters' | 'master_applicants' | null,
        german_level: formData.german_level === '' ? null : formData.german_level as 'none' | 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2' | null,
        has_aps_certificate: formData.has_aps_certificate === '' ? null : formData.has_aps_certificate === 'yes',
      };

      console.log('Saving profile with data:', updateData);

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', profile.user_id)
        .select();

      console.log('Save result:', { data, error });

      if (error) throw error;

      // Refetch profile to get updated data
      await refetchProfile();

      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
       <div className="container-mobile space-y-3">
         {/* German stripe */}
         <div className="german-stripe w-full" />
         
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-lg font-bold text-foreground">Profile Settings</h1>
             <p className="text-xs text-muted-foreground">Manage your personal information and academic details</p>
           </div>
         </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Eligibility Evaluation */}
          <EligibilityEvaluation profile={formData as any} />
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your basic personal details</CardDescription>
                  </div>
                </div>
                {isSectionDirty('personal') && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => cancelSection('personal')}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => saveSection('personal')}>
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Profile Photo */}
              <AvatarUpload
                avatarUrl={formData.avatar_url}
                fullName={formData.full_name}
                onUpload={async (file: File) => {
                  if (!profile?.user_id) return;
                  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                  const path = `${profile.user_id}/${fileName}`;
                  const { error: uploadErr } = await supabase.storage
                    .from('avatars')
                    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
                  if (uploadErr) {
                    toast({ title: 'Upload failed', description: uploadErr.message || 'Could not upload image', variant: 'destructive' });
                    return;
                  }
                  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
                  handleInputChange('avatar_url', publicUrl);
                }}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state_of_education">State/Region</Label>
                  <Input
                    id="state_of_education"
                    value={formData.state_of_education}
                    onChange={(e) => handleInputChange('state_of_education', e.target.value)}
                    placeholder="e.g., Maharashtra, Punjab"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country_of_education">Country</Label>
                  <Input
                    id="country_of_education"
                    value={formData.country_of_education}
                    onChange={(e) => handleInputChange('country_of_education', e.target.value)}
                    placeholder="e.g., India"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unified Academic & Professional Background */}
          <Card>
            <SectionHeader 
              title="Academic & Professional Background" 
              description="Complete your educational and work details for eligibility screening"
              sectionName="academic"
            />
            <CardContent className="space-y-6">
              {/* Schooling */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Schooling & Secondary Education
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="class_10_marks">Class 10 Marks (%)</Label>
                    <Input id="class_10_marks" value={formData.class_10_marks} onChange={(e) => handleInputChange('class_10_marks', e.target.value)} placeholder="e.g., 85%" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class_12_marks">Class 12 Marks (%)</Label>
                    <Input id="class_12_marks" value={formData.class_12_marks} onChange={(e) => handleInputChange('class_12_marks', e.target.value)} placeholder="e.g., 90%" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class_12_stream">Class 12 Stream</Label>
                    <Select value={formData.class_12_stream} onValueChange={(value) => handleInputChange('class_12_stream', value)}>
                      <SelectTrigger><SelectValue placeholder="Select stream" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="commerce">Commerce</SelectItem>
                        <SelectItem value="arts">Arts/Humanities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Bachelor's Degree */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Bachelor's Degree Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bachelor_degree_name">Degree Title</Label>
                    <Input id="bachelor_degree_name" value={formData.bachelor_degree_name} onChange={(e) => handleInputChange('bachelor_degree_name', e.target.value)} placeholder="e.g., Bachelor of Arts (Honours)" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bachelor_field">Field of Study</Label>
                    <Input id="bachelor_field" value={formData.bachelor_field} onChange={(e) => handleInputChange('bachelor_field', e.target.value)} placeholder="e.g., Applied Psychology" />
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <Label htmlFor="bachelor_university">University</Label>
                    <Input id="bachelor_university" value={formData.bachelor_university} onChange={(e) => handleInputChange('bachelor_university', e.target.value)} placeholder="e.g., Amity University Rajasthan" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bachelor_cgpa_percentage">CGPA/Percentage</Label>
                    <Input id="bachelor_cgpa_percentage" value={formData.bachelor_cgpa_percentage} onChange={(e) => handleInputChange('bachelor_cgpa_percentage', e.target.value)} placeholder="e.g., 8.64" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bachelor_credits_ects">Credits/ECTS</Label>
                    <Input id="bachelor_credits_ects" type="number" value={formData.bachelor_credits_ects} onChange={(e) => handleInputChange('bachelor_credits_ects', e.target.value)} placeholder="e.g., 161" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bachelor_duration_years">Duration (Years)</Label>
                    <Input id="bachelor_duration_years" type="number" value={formData.bachelor_duration_years} onChange={(e) => handleInputChange('bachelor_duration_years', e.target.value)} placeholder="e.g., 3" />
                  </div>
                </div>
              </div>

              {/* Masters & Intent */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                  <Users className="h-4 w-4 text-primary" />
                  Intended Master's & Contract
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="lg:col-span-1 space-y-2">
                    <Label htmlFor="intended_master_course">Intended Master Course</Label>
                    <Input id="intended_master_course" value={formData.intended_master_course} onChange={(e) => handleInputChange('intended_master_course', e.target.value)} placeholder="e.g., MSc Computer Science" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intake">Intake</Label>
                    <Input id="intake" value={formData.intake} onChange={(e) => handleInputChange('intake', e.target.value)} placeholder="e.g., Winter 2026" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contract_reference">Contract Reference</Label>
                    <Input id="contract_reference" value={formData.contract_reference} onChange={(e) => handleInputChange('contract_reference', e.target.value)} placeholder="e.g., REF-12345" />
                  </div>
                </div>
              </div>

              {/* Language Proficiency */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                  <Languages className="h-4 w-4 text-primary" />
                  Language Proficiency
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ielts_toefl_score">IELTS/TOEFL Score</Label>
                    <Input id="ielts_toefl_score" value={formData.ielts_toefl_score} onChange={(e) => handleInputChange('ielts_toefl_score', e.target.value)} placeholder="e.g., IELTS 9" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="german_level">German Level</Label>
                    <Select value={formData.german_level} onValueChange={(ドイツ語) => handleInputChange('german_level', ドイツ語)}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="a1">A1</SelectItem><SelectItem value="a2">A2</SelectItem>
                        <SelectItem value="b1">B1</SelectItem><SelectItem value="b2">B2</SelectItem>
                        <SelectItem value="c1">C1</SelectItem><SelectItem value="c2">C2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>APS Certificate</Label>
                  <Select value={formData.has_aps_certificate} onValueChange={(v) => handleInputChange('has_aps_certificate', v)}>
                    <SelectTrigger><SelectValue placeholder="APS certificate?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.has_aps_certificate === 'no' && (
                    <div className="mt-2 p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium">APS certificate is mandatory. Please apply as soon as possible.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Experience */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Work Experience
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="work_experience_years">Years of Experience</Label>
                    <Input id="work_experience_years" type="number" value={formData.work_experience_years} onChange={(e) => handleInputChange('work_experience_years', e.target.value)} placeholder="e.g., 1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work_experience_field">Field of Work</Label>
                    <Input id="work_experience_field" value={formData.work_experience_field} onChange={(e) => handleInputChange('work_experience_field', e.target.value)} placeholder="e.g., Psychotherapist" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Save Button (for desktop) */}
          <div className="hidden lg:flex justify-end pt-4 pb-10">
            <Button 
              type="submit" 
              size="lg" 
              disabled={loading}
              className="px-8 shadow-lg"
            >
              {loading ? 'Saving...' : 'Save All Profile Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Profile;