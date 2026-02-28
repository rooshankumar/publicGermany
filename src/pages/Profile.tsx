import { useState, useEffect, useRef } from 'react';
import { useAuth, type Document } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, GraduationCap, Globe, Award, Briefcase, Upload, Save, FileText, Image as ImageIcon, AlertTriangle, BookOpen, Languages, Users, Briefcase as WorkIcon, Plus, Edit2, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { DocumentUpload } from '@/components/DocumentUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import EligibilityEvaluation from '@/components/EligibilityEvaluation';
import { useEducations } from '@/hooks/useEducations';
import { useWorkExperiences } from '@/hooks/useWorkExperiences';
import { useLanguageSkills } from '@/hooks/useLanguageSkills';
import { useCertifications } from '@/hooks/useCertifications';
import { usePublications } from '@/hooks/usePublications';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAdditionalSections } from '@/hooks/useAdditionalSections';
import { useGenerateEuropassCV } from '@/hooks/useGenerateEuropassCV';
import { ArrayEntryList } from '@/components/ArrayEntryList';
import { CVGenerationCard } from '@/components/CVGenerationCard';
import { InlineEducationForm } from '@/components/InlineEducationForm';
import { InlineWorkExperienceForm } from '@/components/InlineWorkExperienceForm';
import { InlineLanguageSkillForm } from '@/components/InlineLanguageSkillForm';
import { InlineCertificationForm } from '@/components/InlineCertificationForm';
import { InlinePublicationForm } from '@/components/InlinePublicationForm';
import { InlineRecommendationForm } from '@/components/InlineRecommendationForm';
import { InlineAdditionalSectionForm } from '@/components/InlineAdditionalSectionForm';

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
  const certifications = useCertifications(profile?.user_id || '');
  const publications = usePublications(profile?.user_id || '');
  const recommendations = useRecommendations(profile?.user_id || '');
  const additionalSections = useAdditionalSections(profile?.user_id || '');
  const { generateCV, isGenerating } = useGenerateEuropassCV();

  // Inline editing states
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineAddingType, setInlineAddingType] = useState<'education' | 'work' | 'language' | 'certification' | 'publication' | 'recommendation' | 'section' | null>(null);
  const [sectionEdit, setSectionEdit] = useState<any>(null);

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
        // @ts-expect-error - Supabase type resolver issue with profile fields
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
      certifications.fetchCertifications();
      publications.fetchPublications();
      recommendations.fetchRecommendations();
      additionalSections.fetchAdditionalSections();
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

  // Education handlers (inline editing)
  const handleAddEducation = async () => {
    setInlineAddingType('education');
  };

  const handleEditEducation = (entry: any) => {
    setInlineEditingId(entry.id);
  };

  const handleSaveEducation = async (entry: any) => {
    try {
      const editingEntry = educations.entries.find((e) => e.id === inlineEditingId);
      if (editingEntry?.id) {
        await educations.updateEducation(editingEntry.id, entry);
      } else {
        const withOrder = { ...entry, order_index: educations.entries.length };
        await educations.addEducation(withOrder);
        setInlineAddingType(null);
      }
      setInlineEditingId(null);
      toast({ title: 'Education saved', description: 'Your education entry has been saved.' });
    } catch (err) {
      console.error('Error saving education:', err);
      toast({ title: 'Error', description: 'Failed to save education', variant: 'destructive' });
    }
  };

  const handleCancelEducation = () => {
    setInlineEditingId(null);
    setInlineAddingType(null);
  };

  // Work Experience handlers (inline editing)
  const handleAddWorkExperience = async () => {
    setInlineAddingType('work');
  };

  const handleEditWorkExperience = (entry: any) => {
    setInlineEditingId(entry.id);
  };

  const handleSaveWorkExperience = async (entry: any) => {
    try {
      const editingEntry = workExperiences.entries.find((e) => e.id === inlineEditingId);
      if (editingEntry?.id) {
        await workExperiences.updateWorkExperience(editingEntry.id, entry);
      } else {
        const withOrder = { ...entry, order_index: workExperiences.entries.length };
        await workExperiences.addWorkExperience(withOrder);
        setInlineAddingType(null);
      }
      setInlineEditingId(null);
      toast({ title: 'Work experience saved', description: 'Your work experience has been saved.' });
    } catch (err) {
      console.error('Error saving work experience:', err);
      toast({ title: 'Error', description: 'Failed to save work experience', variant: 'destructive' });
    }
  };

  const handleCancelWorkExperience = () => {
    setInlineEditingId(null);
    setInlineAddingType(null);
  };

  // Language Skill handlers (inline editing)
  const handleAddLanguageSkill = async () => {
    setInlineAddingType('language');
  };

  const handleEditLanguageSkill = (entry: any) => {
    setInlineEditingId(entry.id);
  };

  const handleSaveLanguageSkill = async (entry: any) => {
    try {
      const editingEntry = languageSkills.entries.find((e) => e.id === inlineEditingId);
      if (editingEntry?.id) {
        await languageSkills.updateLanguageSkill(editingEntry.id, entry);
      } else {
        const withOrder = { ...entry, order_index: languageSkills.entries.length };
        await languageSkills.addLanguageSkill(withOrder);
        setInlineAddingType(null);
      }
      setInlineEditingId(null);
      toast({ title: 'Language skill saved', description: 'Your language skill has been saved.' });
    } catch (err) {
      console.error('Error saving language skill:', err);
      toast({ title: 'Error', description: 'Failed to save language skill', variant: 'destructive' });
    }
  };
  const handleCancelLanguageSkill = () => {
    setInlineEditingId(null);
    setInlineAddingType(null);
  };

  // Certification handlers (inline editing)
  const handleAddCertification = async () => {
    setInlineAddingType('certification');
  };

  const handleEditCertification = (entry: any) => {
    setInlineEditingId(entry.id);
  };

  const handleSaveCertification = async (entry: any) => {
    try {
      const editingEntry = certifications.entries.find((e) => e.id === inlineEditingId);
      if (editingEntry?.id) {
        await certifications.updateCertification(editingEntry.id, entry);
      } else {
        const withOrder = { ...entry, order_index: certifications.entries.length };
        await certifications.addCertification(withOrder);
        setInlineAddingType(null);
      }
      setInlineEditingId(null);
      toast({ title: 'Certification saved', description: 'Your certification has been saved.' });
    } catch (err) {
      console.error('Error saving certification:', err);
      toast({ title: 'Error', description: 'Failed to save certification', variant: 'destructive' });
    }
  };

  const handleCancelCertification = () => {
    setInlineEditingId(null);
    setInlineAddingType(null);
  };

  // Publication handlers (inline editing)
  const handleAddPublication = async () => {
    setInlineAddingType('publication');
  };

  const handleEditPublication = (entry: any) => {
    setInlineEditingId(entry.id);
  };

  const handleSavePublication = async (entry: any) => {
    try {
      const editingEntry = publications.entries.find((e) => e.id === inlineEditingId);
      if (editingEntry?.id) {
        await publications.updatePublication(editingEntry.id, entry);
      } else {
        const withOrder = { ...entry, order_index: publications.entries.length };
        await publications.addPublication(withOrder);
        setInlineAddingType(null);
      }
      setInlineEditingId(null);
      toast({ title: 'Publication saved', description: 'Your publication has been saved.' });
    } catch (err) {
      console.error('Error saving publication:', err);
      toast({ title: 'Error', description: 'Failed to save publication', variant: 'destructive' });
    }
  };

  const handleCancelPublication = () => {
    setInlineEditingId(null);
    setInlineAddingType(null);
  };

  // Recommendation handlers (inline editing)
  const handleAddRecommendation = async () => {
    setInlineAddingType('recommendation');
  };

  const handleEditRecommendation = (entry: any) => {
    setInlineEditingId(entry.id);
  };

  const handleSaveRecommendation = async (entry: any) => {
    try {
      const editingEntry = recommendations.entries.find((e) => e.id === inlineEditingId);
      if (editingEntry?.id) {
        await recommendations.updateRecommendation(editingEntry.id, entry);
      } else {
        const withOrder = { ...entry, order_index: recommendations.entries.length };
        await recommendations.addRecommendation(withOrder);
        setInlineAddingType(null);
      }
      setInlineEditingId(null);
      toast({ title: 'Recommender saved', description: 'Your recommender has been saved.' });
    } catch (err) {
      console.error('Error saving recommendation:', err);
      toast({ title: 'Error', description: 'Failed to save recommender', variant: 'destructive' });
    }
  };

  const handleCancelRecommendation = () => {
    setInlineEditingId(null);
    setInlineAddingType(null);
  };

  // Additional Section handlers (inline editing)
  const handleAddSection = async () => {
    setInlineAddingType('section');
  };

  const handleEditSection = (entry: any) => {
    setInlineEditingId(entry.id);
  };

  const handleSaveSection = async (entry: any) => {
    try {
      const editingEntry = additionalSections.entries.find((e) => e.id === inlineEditingId);
      if (editingEntry?.id) {
        await additionalSections.updateAdditionalSection(editingEntry.id, entry);
      } else {
        const withOrder = { ...entry, order_index: additionalSections.entries.length };
        await additionalSections.addAdditionalSection(withOrder);
        setInlineAddingType(null);
      }
      setInlineEditingId(null);
      toast({ title: 'Section saved', description: 'Your section has been saved.' });
    } catch (err) {
      console.error('Error saving section:', err);
      toast({ title: 'Error', description: 'Failed to save section', variant: 'destructive' });
    }
  };

  const handleCancelSection = () => {
    setInlineEditingId(null);
    setInlineAddingType(null);
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
        // @ts-expect-error - Supabase type resolver issue with extended profile fields
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

          {/* Academic History */}
          <Card>
            <SectionHeader 
              title="Academic History (Legacy)" 
              description="Your educational background details - syncs with Education & Training section"
              sectionName="academic"
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bachelor_university">Bachelor University</Label>
                  <Input
                    id="bachelor_university"
                    value={formData.bachelor_university}
                    onChange={(e) => handleInputChange('bachelor_university', e.target.value)}
                    placeholder="e.g., University of Delhi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intended_master_course">Intended Master Course</Label>
                  <Input
                    id="intended_master_course"
                    value={formData.intended_master_course}
                    onChange={(e) => handleInputChange('intended_master_course', e.target.value)}
                    placeholder="e.g., MSc Computer Science"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="intake">Intake</Label>
                  <Input
                    id="intake"
                    value={formData.intake}
                    onChange={(e) => handleInputChange('intake', e.target.value)}
                    placeholder="e.g., Winter 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_reference">Contract Reference</Label>
                  <Input
                    id="contract_reference"
                    value={formData.contract_reference}
                    onChange={(e) => handleInputChange('contract_reference', e.target.value)}
                    placeholder="e.g., REF-12345"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            <SectionHeader 
              title="Language Proficiency (Legacy)" 
              description="Your language test scores - syncs with Language Skills section"
              sectionName="language"
            />
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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

              {/* APS Certificate Toggle */}
              <div className="space-y-2">
                <Label>APS Certificate</Label>
                <Select value={formData.has_aps_certificate} onValueChange={(value) => handleInputChange('has_aps_certificate', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Do you have APS certificate?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                {formData.has_aps_certificate === 'no' && (
                  <div className="mt-3 p-3 sm:p-4 rounded-md border border-amber-300 bg-amber-50 text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Need to apply immediately</p>
                        <p className="text-xs mb-3">APS certificate is mandatory for most applications. Please apply as soon as possible.</p>
                        <div className="flex flex-wrap gap-2">
                          <Link to="/aps">
                            <Button size="sm" variant="default">Go to APS Guidance</Button>
                          </Link>
                          <Link to="/services">
                            <Button size="sm" variant="outline">Request APS Help</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <SectionHeader 
              title="Work Experience (Legacy)" 
              description="Your professional background - syncs with Work Experience section"
              sectionName="work"
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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

          {/* EUROPASS CV SECTIONS */}

          {/* CV Generation Card */}
          <CVGenerationCard
            profile={profile}
            educations={educations.entries}
            languages={languageSkills.entries}
            userEmail={userEmail}
            isGenerating={isGenerating}
            onGenerate={() => {
              if (profile?.full_name && profile?.user_id) {
                generateCV(profile.user_id, profile.full_name);
              }
            }}
            isLoading={educations.loading || languageSkills.loading}
          />

          {/* Education & Training - with inline editing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle>Education & Training</CardTitle>
                  <span className="text-sm text-muted-foreground">({educations.entries.length})</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddEducation}
                  disabled={educations.loading}
                  className={inlineAddingType === 'education' ? 'opacity-50' : ''}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {inlineAddingType === 'education' && (
                <InlineEducationForm
                  entry={null}
                  onSave={handleSaveEducation}
                  onCancel={handleCancelEducation}
                  isLoading={educations.loading}
                />
              )}
              {educations.entries.length === 0 && inlineAddingType !== 'education' ? (
                <p className="text-sm text-muted-foreground py-4">No entries yet. Click "Add" to create one.</p>
              ) : (
                educations.entries.map((entry, idx) => (
                  <div key={entry.id}>
                    {inlineEditingId === entry.id ? (
                      <InlineEducationForm
                        entry={entry}
                        onSave={handleSaveEducation}
                        onCancel={handleCancelEducation}
                        isLoading={educations.loading}
                      />
                    ) : (
                      <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition flex justify-between items-start group">
                        <div className="flex-1">
                          <div>
                            <p className="font-medium">{entry.degree_title} in {entry.field_of_study}</p>
                            <p className="text-sm text-muted-foreground">{entry.institution}, {entry.country}</p>
                            <p className="text-xs text-muted-foreground">{entry.start_year} - {entry.end_year}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditEducation(entry)}
                            disabled={educations.loading}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => educations.deleteEducation(entry.id)}
                            disabled={educations.loading}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Work Experience - with inline editing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <WorkIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Work Experience</CardTitle>
                  <span className="text-sm text-muted-foreground">({workExperiences.entries.length})</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddWorkExperience}
                  disabled={workExperiences.loading}
                  className={inlineAddingType === 'work' ? 'opacity-50' : ''}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {inlineAddingType === 'work' && (
                <InlineWorkExperienceForm
                  entry={null}
                  onSave={handleSaveWorkExperience}
                  onCancel={handleCancelWorkExperience}
                  isLoading={workExperiences.loading}
                />
              )}
              {workExperiences.entries.length === 0 && inlineAddingType !== 'work' ? (
                <p className="text-sm text-muted-foreground py-4">No entries yet. Click "Add" to create one.</p>
              ) : (
                workExperiences.entries.map((entry, idx) => (
                  <div key={entry.id}>
                    {inlineEditingId === entry.id ? (
                      <InlineWorkExperienceForm
                        entry={entry}
                        onSave={handleSaveWorkExperience}
                        onCancel={handleCancelWorkExperience}
                        isLoading={workExperiences.loading}
                      />
                    ) : (
                      <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition flex justify-between items-start group">
                        <div className="flex-1">
                          <div>
                            <p className="font-medium">{entry.job_title} at {entry.organisation}</p>
                            <p className="text-sm text-muted-foreground">{entry.city_country}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.start_date} {entry.is_current ? '- Present' : `- ${entry.end_date}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditWorkExperience(entry)}
                            disabled={workExperiences.loading}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => workExperiences.deleteWorkExperience(entry.id)}
                            disabled={workExperiences.loading}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Language Skills - with inline editing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Languages className="h-5 w-5 text-primary" />
                  <CardTitle>Language Skills</CardTitle>
                  <span className="text-sm text-muted-foreground">({languageSkills.entries.length})</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddLanguageSkill}
                  disabled={languageSkills.loading}
                  className={inlineAddingType === 'language' ? 'opacity-50' : ''}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {inlineAddingType === 'language' && (
                <InlineLanguageSkillForm
                  entry={null}
                  onSave={handleSaveLanguageSkill}
                  onCancel={handleCancelLanguageSkill}
                  isLoading={languageSkills.loading}
                />
              )}
              {languageSkills.entries.length === 0 && inlineAddingType !== 'language' ? (
                <p className="text-sm text-muted-foreground py-4">No entries yet. Click "Add" to create one.</p>
              ) : (
                languageSkills.entries.map((entry, idx) => (
                  <div key={entry.id}>
                    {inlineEditingId === entry.id ? (
                      <InlineLanguageSkillForm
                        entry={entry}
                        onSave={handleSaveLanguageSkill}
                        onCancel={handleCancelLanguageSkill}
                        isLoading={languageSkills.loading}
                      />
                    ) : (
                      <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition flex justify-between items-start group">
                        <div className="flex-1">
                          <div>
                            <p className="font-medium">
                              {entry.language_name} {entry.mother_tongue && '(Mother Tongue)'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {[
                                entry.listening && `L: ${entry.listening}`,
                                entry.reading && `R: ${entry.reading}`,
                                entry.writing && `W: ${entry.writing}`,
                                entry.speaking && `S: ${entry.speaking}`,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditLanguageSkill(entry)}
                            disabled={languageSkills.loading}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => languageSkills.deleteLanguageSkill(entry.id)}
                            disabled={languageSkills.loading}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Certifications - with inline editing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary" />
                  <CardTitle>Certifications</CardTitle>
                  <span className="text-sm text-muted-foreground">({certifications.entries.length})</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddCertification}
                  disabled={certifications.loading}
                  className={inlineAddingType === 'certification' ? 'opacity-50' : ''}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {inlineAddingType === 'certification' && (
                <InlineCertificationForm
                  entry={null}
                  onSave={handleSaveCertification}
                  onCancel={handleCancelCertification}
                  isLoading={certifications.loading}
                />
              )}
              {certifications.entries.length === 0 && inlineAddingType !== 'certification' ? (
                <p className="text-sm text-muted-foreground py-4">No entries yet. Click "Add" to create one.</p>
              ) : (
                certifications.entries.map((entry) => (
                  <div key={entry.id}>
                    {inlineEditingId === entry.id ? (
                      <InlineCertificationForm
                        entry={entry}
                        onSave={handleSaveCertification}
                        onCancel={handleCancelCertification}
                        isLoading={certifications.loading}
                      />
                    ) : (
                      <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition flex justify-between items-start group">
                        <div className="flex-1">
                          <div>
                            <p className="font-medium">{entry.title}</p>
                            <p className="text-sm text-muted-foreground">{entry.institution}</p>
                            <p className="text-xs text-muted-foreground">{entry.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCertification(entry)}
                            disabled={certifications.loading}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => certifications.deleteCertification(entry.id)}
                            disabled={certifications.loading}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Publications - with inline editing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Publications</CardTitle>
                  <span className="text-sm text-muted-foreground">({publications.entries.length})</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddPublication}
                  disabled={publications.loading}
                  className={inlineAddingType === 'publication' ? 'opacity-50' : ''}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {inlineAddingType === 'publication' && (
                <InlinePublicationForm
                  entry={null}
                  onSave={handleSavePublication}
                  onCancel={handleCancelPublication}
                  isLoading={publications.loading}
                />
              )}
              {publications.entries.length === 0 && inlineAddingType !== 'publication' ? (
                <p className="text-sm text-muted-foreground py-4">No entries yet. Click "Add" to create one.</p>
              ) : (
                publications.entries.map((entry) => (
                  <div key={entry.id}>
                    {inlineEditingId === entry.id ? (
                      <InlinePublicationForm
                        entry={entry}
                        onSave={handleSavePublication}
                        onCancel={handleCancelPublication}
                        isLoading={publications.loading}
                      />
                    ) : (
                      <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition flex justify-between items-start group">
                        <div className="flex-1">
                          <div>
                            <p className="font-medium">{entry.title}</p>
                            <p className="text-sm text-muted-foreground">{entry.journal} ({entry.year})</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPublication(entry)}
                            disabled={publications.loading}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => publications.deletePublication(entry.id)}
                            disabled={publications.loading}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recommendations - with inline editing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Recommendations / Referees</CardTitle>
                  <span className="text-sm text-muted-foreground">({recommendations.entries.length})</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddRecommendation}
                  disabled={recommendations.loading}
                  className={inlineAddingType === 'recommendation' ? 'opacity-50' : ''}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {inlineAddingType === 'recommendation' && (
                <InlineRecommendationForm
                  entry={null}
                  onSave={handleSaveRecommendation}
                  onCancel={handleCancelRecommendation}
                  isLoading={recommendations.loading}
                />
              )}
              {recommendations.entries.length === 0 && inlineAddingType !== 'recommendation' ? (
                <p className="text-sm text-muted-foreground py-4">No entries yet. Click "Add" to create one.</p>
              ) : (
                recommendations.entries.map((entry) => (
                  <div key={entry.id}>
                    {inlineEditingId === entry.id ? (
                      <InlineRecommendationForm
                        entry={entry}
                        onSave={handleSaveRecommendation}
                        onCancel={handleCancelRecommendation}
                        isLoading={recommendations.loading}
                      />
                    ) : (
                      <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition flex justify-between items-start group">
                        <div className="flex-1">
                          <div>
                            <p className="font-medium">{entry.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.designation} {entry.institution && `at ${entry.institution}`}
                            </p>
                            <p className="text-xs text-muted-foreground">{entry.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditRecommendation(entry)}
                            disabled={recommendations.loading}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => recommendations.deleteRecommendation(entry.id)}
                            disabled={recommendations.loading}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Additional Sections - with inline editing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Additional Sections</CardTitle>
                  <span className="text-sm text-muted-foreground">({additionalSections.entries.length})</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddSection}
                  disabled={additionalSections.loading}
                  className={inlineAddingType === 'section' ? 'opacity-50' : ''}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {inlineAddingType === 'section' && (
                <InlineAdditionalSectionForm
                  entry={null}
                  onSave={handleSaveSection}
                  onCancel={handleCancelSection}
                  isLoading={additionalSections.loading}
                />
              )}
              {additionalSections.entries.length === 0 && inlineAddingType !== 'section' ? (
                <p className="text-sm text-muted-foreground py-4">No entries yet. Click "Add" to create one.</p>
              ) : (
                additionalSections.entries.map((entry) => (
                  <div key={entry.id}>
                    {inlineEditingId === entry.id ? (
                      <InlineAdditionalSectionForm
                        entry={entry}
                        onSave={handleSaveSection}
                        onCancel={handleCancelSection}
                        isLoading={additionalSections.loading}
                      />
                    ) : (
                      <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition flex justify-between items-start group">
                        <div className="flex-1">
                          <div>
                            <p className="font-medium">{entry.section_title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{entry.section_content}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSection(entry)}
                            disabled={additionalSections.loading}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => additionalSections.deleteAdditionalSection(entry.id)}
                            disabled={additionalSections.loading}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* APS Pathway section removed, now on APS page */}

          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4">
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