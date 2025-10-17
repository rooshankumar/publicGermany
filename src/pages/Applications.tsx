import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ExternalLink, Edit, Trash2, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import useRealTimeSync from '@/hooks/useRealTimeSync';
import { ExcelUpload } from '@/components/ExcelUpload';
import { ExcelTemplate } from '@/components/ExcelTemplate';

interface Application {
  id: string;
  university_name: string;
  program_name: string;
  ielts_requirement: string | null;
  german_requirement: string | null;
  fees_eur: number | null;
  start_date: string | null;
  end_date: string | null;
  application_method: string | null;
  required_tests: string | null;
  portal_link: string | null;
  status: 'draft' | 'submitted' | 'interview' | 'offer' | 'rejected';
  notes: string | null;
  created_at: string;
  application_end_date: string | null; // Added property
}

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleExcelUpload = async (data: any[]) => {
    if (!profile?.user_id) {
      toast({ title: 'Error', description: 'You must be logged in to upload applications', variant: 'destructive' });
      return;
    }

    try {
      const applications = data.map(row => ({
        user_id: profile.user_id,
        university_name: row.university_name,
        program_name: row.program_name,
        ielts_requirement: row.ielts_requirement,
        german_requirement: row.german_requirement,
        fees_eur: row.fees_eur,
        start_date: row.start_date,
        end_date: row.end_date,
        application_method: row.application_method,
        required_tests: row.required_tests,
        portal_link: row.portal_link,
        notes: row.notes,
        status: row.status || 'draft'
      }));

      const { error } = await supabase
        .from('applications')
        .insert(applications);

      if (error) throw error;

      toast({ title: 'Success', description: `${applications.length} applications imported successfully` });
      fetchApplications();
    } catch (err) {
      console.error('Error importing applications:', err);
      toast({ title: 'Error', description: 'Failed to import applications', variant: 'destructive' });
    }
  };

  const fetchApplications = async () => {
    try {
      // Guard: if user profile not ready yet, avoid empty uuid filter
      if (!profile?.user_id) {
        setApplications([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Open the Edit dialog with prefilled values
  const openEditDialog = (app: Application) => {
    setEditApp(app);
    setEditValues({
      university_name: app.university_name || '',
      program_name: app.program_name || '',
      ielts_requirement: app.ielts_requirement || '',
      german_requirement: app.german_requirement || '',
      fees_eur: app.fees_eur ?? '',
      start_date: app.start_date ? app.start_date.substring(0, 10) : '',
      end_date: app.end_date ? app.end_date.substring(0, 10) : '',
      application_method: app.application_method || 'none',
      required_tests: app.required_tests || '',
      portal_link: app.portal_link || '',
      notes: app.notes || '',
      status: app.status,
    });
    setShowEditDialog(true);
  };

  // Save changes from Edit dialog
  const handleEditApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp) return;
    if (!profile?.user_id) {
      toast({ title: 'Error', description: 'Not signed in', variant: 'destructive' });
      return;
    }
    try {
      const payload: Partial<Application> & Record<string, any> = {
        university_name: editValues.university_name,
        program_name: editValues.program_name,
        ielts_requirement: editValues.ielts_requirement || null,
        german_requirement: editValues.german_requirement || null,
        fees_eur: editValues.fees_eur === '' ? null : Number(editValues.fees_eur),
        start_date: editValues.start_date || null,
        end_date: editValues.end_date || null,
        application_method: editValues.application_method === 'none' ? null : (editValues.application_method || null),
        required_tests: editValues.required_tests || null,
        portal_link: editValues.portal_link || null,
        notes: editValues.notes || null,
        status: (editValues.status as Application['status']) || editApp.status,
      };

      const { error } = await supabase
        .from('applications')
        .update(payload)
        .eq('id', editApp.id)
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast({ title: 'Updated', description: 'Application updated successfully' });
      // Add in-app notification for the student (self-edit)
      try {
        const uni = editApp.university_name || '';
        const statusLabel = ((payload.status as string) || editApp.status).toString();
        await (supabase as any).from('notifications').insert({ user_id: profile.user_id, title: `Application updated: ${uni} → ${statusLabel}`, type: 'application', ref_id: editApp.id });
      } catch {}
      setShowEditDialog(false);
      setEditApp(null);
      setEditValues({});
      fetchApplications();
    } catch (err) {
      console.error('Error updating application:', err);
      toast({ title: 'Error', description: 'Failed to update application', variant: 'destructive' });
    }
  };

  const handleImportUniversities = async () => {
    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('import-universities', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Import Complete",
        description: `Imported ${data.inserted} applications, updated ${data.updated}, skipped ${data.skipped}`,
      });

      fetchApplications();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // Helper to check if application is complete
  const isApplicationComplete = (app: Application): boolean => {
    return !!(
      app.university_name &&
      app.program_name &&
      app.ielts_requirement &&
      app.german_requirement &&
      app.fees_eur !== null &&
      app.application_end_date &&
      app.application_method &&
      app.portal_link
    );
  };

  useEffect(() => {
    fetchApplications();
  }, [profile?.user_id]);

  // Set up real-time sync
  useRealTimeSync({
    table: 'applications',
    callback: fetchApplications,
    filter: { column: 'user_id', value: profile?.user_id || null }
  });

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add applications",
        variant: "destructive",
      });
      return;
    }
    
    const applicationData = {
      user_id: user.id,
      university_name: formData.get('university_name') as string,
      program_name: formData.get('program_name') as string,
      ielts_requirement: formData.get('ielts_requirement') as string || null,
      german_requirement: formData.get('german_requirement') as string || null,
      fees_eur: formData.get('fees_eur') ? parseInt(formData.get('fees_eur') as string) : null,
      start_date: formData.get('start_date') as string || null,
      end_date: formData.get('end_date') as string || null,
      application_method: formData.get('application_method') as string || null,
      required_tests: formData.get('required_tests') as string || null,
      portal_link: formData.get('portal_link') as string || null,
      status: 'draft' as const,
      notes: formData.get('notes') as string || null,
    };

    try {
      const { error } = await supabase
        .from('applications')
        .insert([applicationData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application added successfully",
      });

      setShowAddDialog(false);
      fetchApplications();
    } catch (error) {
      console.error('Error adding application:', error);
      toast({
        title: "Error",
        description: "Failed to add application",
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (id: string, status: Application['status']) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application status updated",
      });

      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application deleted",
      });

      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: Application['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'interview': return 'outline';
      case 'offer': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground">Track your university applications</p>
          </div>
          
          <div className="space-y-3">
            
            {/* Import Tips */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">📋 Quick Import:</p>
              <p className="text-blue-800 dark:text-blue-200 text-xs">
                1. Download template → 2. Fill in your applications → 3. Upload Excel file
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <ExcelTemplate />
              <ExcelUpload onUpload={handleExcelUpload} />
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Application
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Application</DialogTitle>
                <DialogDescription>
                  Track a new university application
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddApplication} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="university_name">University Name *</Label>
                    <Input id="university_name" name="university_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program_name">Program Name *</Label>
                    <Input id="program_name" name="program_name" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ielts_requirement">IELTS Requirement</Label>
                    <Input id="ielts_requirement" name="ielts_requirement" placeholder="e.g., 6.5 overall" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="german_requirement">German Requirement</Label>
                    <Input id="german_requirement" name="german_requirement" placeholder="e.g., B2 level" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fees_eur">Fees (EUR per semester)</Label>
                    <Input id="fees_eur" name="fees_eur" type="number" placeholder="e.g., 500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="application_method">Application Method</Label>
                    <Select name="application_method">
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Uni-assist">Uni-assist</SelectItem>
                        <SelectItem value="Direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Application Start Date</Label>
                    <Input id="start_date" name="start_date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Application End Date</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="required_tests">Required Tests</Label>
                    <Input id="required_tests" name="required_tests" placeholder="e.g., TestAS, GRE" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portal_link">Portal Link</Label>
                    <Input id="portal_link" name="portal_link" type="url" placeholder="https://..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" placeholder="Additional notes..." />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Application</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>

          {/* Edit Application Dialog */}
          <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) { setEditApp(null); setEditValues({}); } }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Application</DialogTitle>
                <DialogDescription>Update your saved application details</DialogDescription>
              </DialogHeader>
              {editApp && (
                <form onSubmit={handleEditApplication} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_university_name">University Name *</Label>
                      <Input id="edit_university_name" value={editValues.university_name || ''} onChange={(e) => setEditValues(v => ({ ...v, university_name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_program_name">Program Name *</Label>
                      <Input id="edit_program_name" value={editValues.program_name || ''} onChange={(e) => setEditValues(v => ({ ...v, program_name: e.target.value }))} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_ielts">IELTS Requirement</Label>
                      <Input id="edit_ielts" value={editValues.ielts_requirement || ''} onChange={(e) => setEditValues(v => ({ ...v, ielts_requirement: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_german">German Requirement</Label>
                      <Input id="edit_german" value={editValues.german_requirement || ''} onChange={(e) => setEditValues(v => ({ ...v, german_requirement: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_fees">Fees (EUR per semester)</Label>
                      <Input id="edit_fees" type="number" value={editValues.fees_eur ?? ''} onChange={(e) => setEditValues(v => ({ ...v, fees_eur: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_application_method">Application Method</Label>
                      <Select value={editValues.application_method || ''} onValueChange={(val) => setEditValues(v => ({ ...v, application_method: val }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Uni-assist">Uni-assist</SelectItem>
                          <SelectItem value="Direct">Direct</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_start">Application Start Date</Label>
                      <Input id="edit_start" type="date" value={editValues.start_date || ''} onChange={(e) => setEditValues(v => ({ ...v, start_date: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_end">Application End Date</Label>
                      <Input id="edit_end" type="date" value={editValues.end_date || ''} onChange={(e) => setEditValues(v => ({ ...v, end_date: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_tests">Required Tests</Label>
                      <Input id="edit_tests" value={editValues.required_tests || ''} onChange={(e) => setEditValues(v => ({ ...v, required_tests: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_portal">Portal Link</Label>
                      <Input id="edit_portal" type="url" value={editValues.portal_link || ''} onChange={(e) => setEditValues(v => ({ ...v, portal_link: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_status">Status</Label>
                      <Select value={editValues.status || 'draft'} onValueChange={(val) => setEditValues(v => ({ ...v, status: val }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_notes">Notes</Label>
                      <Input id="edit_notes" value={editValues.notes || ''} onChange={(e) => setEditValues(v => ({ ...v, notes: e.target.value }))} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); setEditApp(null); setEditValues({}); }}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
            <CardDescription>
              {applications.length} application{applications.length !== 1 ? 's' : ''} tracked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No applications tracked yet</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Application
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Actions</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>IELTS</TableHead>
                      <TableHead>German</TableHead>
                      <TableHead>Fees (EUR)</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Tests</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => openEditDialog(app)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {app.portal_link ? (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                asChild
                                title="Open Portal"
                              >
                                <a 
                                  href={app.portal_link.startsWith('http') ? app.portal_link : `https://${app.portal_link}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                disabled
                                title="No portal link"
                              >
                                <ExternalLink className="h-4 w-4 opacity-30" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => deleteApplication(app.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{app.university_name}</TableCell>
                        <TableCell>{app.program_name}</TableCell>
                        <TableCell>{app.ielts_requirement || '-'}</TableCell>
                        <TableCell>{app.german_requirement || '-'}</TableCell>
                        <TableCell>{app.fees_eur ? `€${app.fees_eur}` : '-'}</TableCell>
                        <TableCell>
                          {app.start_date ? new Date(app.start_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {app.end_date ? new Date(app.end_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>{app.application_method || '-'}</TableCell>
                        <TableCell>{app.required_tests || '-'}</TableCell>
                        <TableCell>
                          <Select 
                            value={app.status} 
                            onValueChange={(value) => updateApplicationStatus(app.id, value as Application['status'])}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue>
                                <Badge variant={getStatusBadgeVariant(app.status)}>
                                  {app.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="offer">Offer</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Applications;