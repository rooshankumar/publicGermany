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
import { Plus, ExternalLink, Edit, Trash2, Download, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import useRealTimeSync from '@/hooks/useRealTimeSync';
import { ExcelUpload } from '@/components/ExcelUpload';
import { ExcelTemplate } from '@/components/ExcelTemplate';
import { sendEmail } from '@/lib/sendEmail';
import StudentPortalCredentials from '@/components/StudentPortalCredentials';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Application {
  id: string;
  university_name: string;
  program_name: string;
  ielts_requirement: string | null;
  german_requirement: string | null;
  fees_eur: string | null;
  start_date: string | null; // Keep for legacy if needed
  end_date: string | null;   // Keep for legacy if needed
  application_method: string | null;
  required_tests: string | null;
  portal_link: string | null;
  portal_login_id: string | null;
  portal_password: string | null;
  show_credentials_to_student: boolean;
  status: 'draft' | 'submitted' | 'interview' | 'offer' | 'rejected';
  notes: string | null;
  created_at: string;
  application_start_date: string | null; // ADDED
  application_end_date: string | null;   // UPDATED
}

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [importing, setImporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { profile } = useAuth();

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExcelUpload = async (data: any[]) => {
    if (!profile?.user_id) {
      toast({ title: 'Error', description: 'You must be logged in to upload applications', variant: 'destructive' });
      return;
    }

    try {
      const applicationsToInsert = data.map(row => ({
        user_id: profile.user_id,
        university_name: row.university_name,
        program_name: row.program_name,
        ielts_requirement: row.ielts_requirement,
        german_requirement: row.german_requirement,
        fees_eur: row.fees_eur ? String(row.fees_eur) : null,
        application_start_date: row.application_start_date || row.start_date || null, // Fallback logic
        application_end_date: row.application_end_date || row.end_date || null,     // Fallback logic
        application_method: row.application_method,
        required_tests: row.required_tests,
        portal_link: row.portal_link,
        notes: row.notes,
        status: row.status || 'draft'
      }));

      const { error } = await supabase
        .from('applications')
        .insert(applicationsToInsert);

      if (error) throw error;

      toast({ title: 'Success', description: `${applicationsToInsert.length} applications imported successfully` });
      fetchApplications();
    } catch (err) {
      console.error('Error importing applications:', err);
      toast({ title: 'Error', description: 'Failed to import applications', variant: 'destructive' });
    }
  };

  const fetchApplications = async () => {
    try {
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
      setApplications((data || []) as Application[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({ title: "Error", description: "Failed to fetch applications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (app: Application) => {
    setEditApp(app);
    setEditValues({
      ...app,
      // Ensure date inputs get YYYY-MM-DD format
      application_start_date: app.application_start_date ? app.application_start_date.substring(0, 10) : '',
      application_end_date: app.application_end_date ? app.application_end_date.substring(0, 10) : '',
    });
    setShowEditDialog(true);
  };

  const handleEditApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp || !profile?.user_id) return;
    try {
      const payload = {
        university_name: editValues.university_name,
        program_name: editValues.program_name,
        ielts_requirement: editValues.ielts_requirement || null,
        german_requirement: editValues.german_requirement || null,
        fees_eur: editValues.fees_eur === '' ? null : String(editValues.fees_eur),
        application_start_date: editValues.application_start_date || null,
        application_end_date: editValues.application_end_date || null,
        application_method: editValues.application_method === 'none' ? null : editValues.application_method,
        required_tests: editValues.required_tests || null,
        portal_link: editValues.portal_link || null,
        notes: editValues.notes || null,
        status: editValues.status || editApp.status,
      };

      const { error } = await supabase
        .from('applications')
        .update(payload)
        .eq('id', editApp.id);

      if (error) throw error;

      toast({ title: 'Updated', description: 'Application updated successfully' });
      setShowEditDialog(false);
      fetchApplications();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [profile?.user_id]);

  useRealTimeSync({
    table: 'applications',
    callback: fetchApplications,
    filter: { column: 'user_id', value: profile?.user_id || null }
  });

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (!profile?.user_id) return;

    const applicationData = {
      user_id: profile.user_id,
      university_name: formData.get('university_name') as string,
      program_name: formData.get('program_name') as string,
      ielts_requirement: formData.get('ielts_requirement') as string || null,
      german_requirement: formData.get('german_requirement') as string || null,
      fees_eur: formData.get('fees_eur') ? String(formData.get('fees_eur')) : null,
      application_start_date: formData.get('application_start_date') as string || null,
      application_end_date: formData.get('application_end_date') as string || null,
      application_method: formData.get('application_method') as string || null,
      required_tests: formData.get('required_tests') as string || null,
      portal_link: formData.get('portal_link') as string || null,
      status: 'draft' as const,
      notes: formData.get('notes') as string || null,
    };

    try {
      const { error } = await supabase.from('applications').insert([applicationData]);
      if (error) throw error;
      toast({ title: "Success", description: "Application added successfully" });
      setShowAddDialog(false);
      fetchApplications();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add application", variant: "destructive" });
    }
  };

  const updateApplicationStatus = async (id: string, status: Application['status']) => {
    await supabase.from('applications').update({ status }).eq('id', id);
    fetchApplications();
  };

  const deleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    await supabase.from('applications').delete().eq('id', id);
    fetchApplications();
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

  if (loading) return <Layout><div className="animate-pulse p-8">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground">Track your university applications</p>
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-2 text-xs">
                <span className="font-medium text-blue-900 dark:text-blue-100">📋 Quick Import:</span>
                <span className="text-blue-800 dark:text-blue-200 ml-1">Download → Fill → Upload</span>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-2 text-xs">
                <span className="font-medium text-green-900 dark:text-green-100">📧 Auto Reminders:</span>
                <span className="text-green-800 dark:text-green-200 ml-1">Get email alerts before deadlines</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap justify-end">
              <ExcelTemplate />
              <ExcelUpload onUpload={handleExcelUpload} />
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" /> Add Application</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Application</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddApplication} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>University Name *</Label>
                        <Input name="university_name" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Program Name *</Label>
                        <Input name="program_name" required />
                      </div>
                      <div className="space-y-2">
                        <Label>IELTS</Label>
                        <Input name="ielts_requirement" />
                      </div>
                      <div className="space-y-2">
                        <Label>German</Label>
                        <Input name="german_requirement" />
                      </div>
                      <div className="space-y-2">
                        <Label>Fees (EUR)</Label>
                        <Input name="fees_eur" type="number" />
                      </div>
                      <div className="space-y-2">
                        <Label>Application Method</Label>
                        <Select name="application_method">
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Uni-assist">Uni-assist</SelectItem>
                            <SelectItem value="Direct">Direct</SelectItem>
                            <SelectItem value="VPD + University">VPD + University</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input name="application_start_date" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input name="application_end_date" type="date" />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Portal Link</Label>
                        <Input name="portal_link" type="url" />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Notes</Label>
                        <Input name="notes" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                      <Button type="submit">Add Application</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
            <CardDescription>{applications.length} applications tracked</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-10">No applications found.</div>
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => {
                      const hasCredentials = app.show_credentials_to_student && 
                        (app.portal_link || app.portal_login_id || app.portal_password);
                      
                      return (
                        <>
                          <TableRow key={app.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {hasCredentials && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => toggleRowExpand(app.id)}
                                    className="p-1"
                                  >
                                    {expandedRows.has(app.id) ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(app)}><Edit className="h-4 w-4" /></Button>
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={app.portal_link || '#'} target="_blank" rel="noopener noreferrer" className={!app.portal_link ? 'opacity-20 pointer-events-none' : ''}>
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteApplication(app.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{app.university_name}</TableCell>
                            <TableCell>{app.program_name}</TableCell>
                            <TableCell>{app.ielts_requirement || '-'}</TableCell>
                            <TableCell>{app.german_requirement || '-'}</TableCell>
                            <TableCell>{app.fees_eur ? `€${app.fees_eur}` : '-'}</TableCell>
                            <TableCell>
                              {app.application_start_date ? new Date(app.application_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                            </TableCell>
                            <TableCell>
                              {app.application_end_date ? new Date(app.application_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                            </TableCell>
                            <TableCell>{app.application_method || '-'}</TableCell>
                            <TableCell>
                              <Select value={app.status} onValueChange={(val) => updateApplicationStatus(app.id, val as Application['status'])}>
                                <SelectTrigger className="w-32">
                                  <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
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
                          {hasCredentials && expandedRows.has(app.id) && (
                            <TableRow key={`${app.id}-creds`} className="bg-muted/30">
                              <TableCell colSpan={10} className="py-0">
                                <StudentPortalCredentials
                                  portalLink={app.portal_link}
                                  loginId={app.portal_login_id}
                                  password={app.portal_password}
                                  showCredentials={app.show_credentials_to_student}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* EDIT DIALOG */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Application</DialogTitle></DialogHeader>
            {editApp && (
              <form onSubmit={handleEditApplication} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>University Name</Label>
                    <Input value={editValues.university_name} onChange={e => setEditValues({...editValues, university_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Program Name</Label>
                    <Input value={editValues.program_name} onChange={e => setEditValues({...editValues, program_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={editValues.application_start_date} onChange={e => setEditValues({...editValues, application_start_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={editValues.application_end_date} onChange={e => setEditValues({...editValues, application_end_date: e.target.value})} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <Input value={editValues.notes || ''} onChange={e => setEditValues({...editValues, notes: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                  <Button type="submit">Update Application</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Applications;
