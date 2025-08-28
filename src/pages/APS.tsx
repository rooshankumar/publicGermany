import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload } from 'lucide-react';
import Layout from '@/components/Layout';
import APSRequiredDocuments from '@/components/APSRequiredDocuments';

const APS = () => {
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    aps_pathway: '',
    german_level: '',
    ielts_toefl_score: '',
  });

  // Auto-save disabled. Use manual save instead.
  const saveAPS = async () => {
    if (!profile?.user_id) {
      toast({
        title: "Profile not loaded",
        description: "Cannot save APS details because user ID is missing.",
        variant: "destructive",
      });
      return;
    }
    const updateData = {
      aps_pathway: formData.aps_pathway === '' ? null : formData.aps_pathway as "stk" | "bachelor_2_semesters" | "master_applicants",
      german_level: formData.german_level === '' ? null : formData.german_level as "none" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2",
      ielts_toefl_score: formData.ielts_toefl_score,
    };
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', profile.user_id);
    if (error) throw error;
    setLastSaved(new Date());
    await refetchProfile();
    toast({
      title: "APS details saved",
      description: "Your changes have been saved.",
    });
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        aps_pathway: profile.aps_pathway || '',
        german_level: profile.german_level || '',
        ielts_toefl_score: profile.ielts_toefl_score || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!profile?.user_id) {
      toast({
        title: "Profile not loaded",
        description: "Cannot save APS details because user ID is missing.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    try {
      const updateData = {
        aps_pathway: formData.aps_pathway === '' ? null : formData.aps_pathway as "stk" | "bachelor_2_semesters" | "master_applicants",
        german_level: formData.german_level === '' ? null : formData.german_level as "none" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2",
        ielts_toefl_score: formData.ielts_toefl_score,
      };
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', profile.user_id);
      if (error) throw error;
      toast({
        title: "APS details updated!",
        description: "Your changes have been saved.",
      });
      await refetchProfile();
    } catch (error) {
      toast({
        title: "Error updating APS details",
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
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">APS & Language Details</h1>
              <p className="text-sm md:text-base text-foreground">Manage your APS pathway and language proficiency</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Save className="h-4 w-4" />
              <span>
                {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
              </span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>APS Pathway</CardTitle>
              <CardDescription>Select your APS pathway</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aps_pathway">APS Pathway</Label>
                <Select value={formData.aps_pathway} onValueChange={val => handleInputChange('aps_pathway', val)}>
                  <SelectTrigger id="aps_pathway">
                    <SelectValue placeholder="Select pathway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stk">STK (Studienkolleg)</SelectItem>
                    <SelectItem value="bachelor_2_semesters">Bachelor (2+ Semesters)</SelectItem>
                    <SelectItem value="master_applicants">Master Applicants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Language Proficiency</CardTitle>
              <CardDescription>Enter your language test details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="german_level">German Level</Label>
                <Select value={formData.german_level} onValueChange={val => handleInputChange('german_level', val)}>
                  <SelectTrigger id="german_level">
                    <SelectValue placeholder="Select German level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="a1">A1</SelectItem>
                    <SelectItem value="a2">A2</SelectItem>
                    <SelectItem value="b1">B1</SelectItem>
                    <SelectItem value="b2">B2</SelectItem>
                    <SelectItem value="c1">C1</SelectItem>
                    <SelectItem value="c2">C2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ielts_toefl_score">IELTS/TOEFL Score</Label>
                <Input
                  id="ielts_toefl_score"
                  value={formData.ielts_toefl_score}
                  onChange={e => handleInputChange('ielts_toefl_score', e.target.value)}
                  placeholder="Enter your score"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-primary" />
                <CardTitle>Document Upload</CardTitle>
              </div>
              <CardDescription>Upload your important documents for easy access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <APSRequiredDocuments />
            </CardContent>
          </Card>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default APS;
