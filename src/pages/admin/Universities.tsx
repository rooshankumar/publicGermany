import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, ExternalLink, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface University {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  website_url: string | null;
  is_public: boolean | null;
  has_tuition_fees: boolean | null;
  fields: string[] | null;
  languages: string[] | null;
  created_at: string;
}

export default function Universities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchUniversities();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('universities-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'universities' }, () => {
        fetchUniversities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setUniversities(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching universities",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const fieldsStr = formData.get('fields') as string;
    const languagesStr = formData.get('languages') as string;
    
    const universityData = {
      name: formData.get('name') as string,
      city: formData.get('city') as string || null,
      country: formData.get('country') as string || 'Germany',
      website_url: formData.get('website_url') as string || null,
      is_public: formData.get('is_public') === 'true',
      has_tuition_fees: formData.get('has_tuition_fees') === 'true',
      fields: fieldsStr ? fieldsStr.split(',').map(f => f.trim()) : null,
      languages: languagesStr ? languagesStr.split(',').map(l => l.trim()) : null,
    };

    try {
      const { error } = await supabase
        .from('universities')
        .insert([universityData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "University added successfully",
      });

      setShowAddDialog(false);
    } catch (error: any) {
      toast({
        title: "Error adding university",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUniversity) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    
    const fieldsStr = formData.get('fields') as string;
    const languagesStr = formData.get('languages') as string;
    
    const universityData = {
      name: formData.get('name') as string,
      city: formData.get('city') as string || null,
      country: formData.get('country') as string || 'Germany',
      website_url: formData.get('website_url') as string || null,
      is_public: formData.get('is_public') === 'true',
      has_tuition_fees: formData.get('has_tuition_fees') === 'true',
      fields: fieldsStr ? fieldsStr.split(',').map(f => f.trim()) : null,
      languages: languagesStr ? languagesStr.split(',').map(l => l.trim()) : null,
    };

    try {
      const { error } = await supabase
        .from('universities')
        .update(universityData)
        .eq('id', editingUniversity.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "University updated successfully",
      });

      setEditingUniversity(null);
    } catch (error: any) {
      toast({
        title: "Error updating university",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteUniversity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this university?')) return;

    try {
      const { error } = await supabase
        .from('universities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "University deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting university",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         uni.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilter === 'all' || uni.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const UniversityForm = ({ university, onSubmit }: { university?: University; onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">University Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={university?.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            defaultValue={university?.city || ''}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            defaultValue={university?.country || 'Germany'}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            id="website_url"
            name="website_url"
            type="url"
            defaultValue={university?.website_url || ''}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="is_public">University Type</Label>
          <Select name="is_public" defaultValue={university?.is_public?.toString() || 'true'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Public</SelectItem>
              <SelectItem value="false">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="has_tuition_fees">Tuition Fees</Label>
          <Select name="has_tuition_fees" defaultValue={university?.has_tuition_fees?.toString() || 'false'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Has Tuition Fees</SelectItem>
              <SelectItem value="false">No Tuition Fees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fields">Fields of Study (comma-separated)</Label>
        <Input
          id="fields"
          name="fields"
          defaultValue={university?.fields?.join(', ') || ''}
          placeholder="e.g., Computer Science, Engineering, Business"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="languages">Languages (comma-separated)</Label>
        <Input
          id="languages"
          name="languages"
          defaultValue={university?.languages?.join(', ') || ''}
          placeholder="e.g., German, English"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => {
          setShowAddDialog(false);
          setEditingUniversity(null);
        }}>
          Cancel
        </Button>
        <Button type="submit">
          {university ? 'Update' : 'Add'} University
        </Button>
      </div>
    </form>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Universities Management</h1>
            <p className="text-muted-foreground">Manage university database for student applications</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add University
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New University</DialogTitle>
                <DialogDescription>
                  Add a new university to the database
                </DialogDescription>
              </DialogHeader>
              <UniversityForm onSubmit={handleAddUniversity} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search universities or cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="Austria">Austria</SelectItem>
                  <SelectItem value="Switzerland">Switzerland</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Universities List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Universities ({filteredUniversities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading universities...</p>
              </div>
            ) : filteredUniversities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No universities found</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First University
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>University</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Fees</TableHead>
                      <TableHead>Fields</TableHead>
                      <TableHead>Languages</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUniversities.map((uni) => (
                      <TableRow key={uni.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[220px] md:max-w-[320px]">{uni.name}</span>
                            {uni.website_url && (
                              <a
                                href={uni.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Website
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="truncate max-w-[160px] md:max-w-[220px]">{uni.city}, {uni.country}</TableCell>
                        <TableCell>
                          <Badge variant={uni.is_public ? 'default' : 'secondary'}>
                            {uni.is_public ? 'Public' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={uni.has_tuition_fees ? 'destructive' : 'default'}>
                            {uni.has_tuition_fees ? 'Paid' : 'Free'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {uni.fields?.slice(0, 2).join(', ')}
                            {uni.fields && uni.fields.length > 2 && ` (+${uni.fields.length - 2})`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {uni.languages?.join(', ') || 'Not specified'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingUniversity(uni)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteUniversity(uni.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingUniversity} onOpenChange={(open) => !open && setEditingUniversity(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit University</DialogTitle>
              <DialogDescription>
                Update university information
              </DialogDescription>
            </DialogHeader>
            {editingUniversity && (
              <UniversityForm
                university={editingUniversity}
                onSubmit={handleEditUniversity}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}