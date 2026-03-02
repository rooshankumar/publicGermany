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
import { Plus, ExternalLink, Edit, Trash2, Download, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react';
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

  // Sort: submitted/Applied at top, then by nearest start date
  const sortedApplications = [...applications].sort((a, b) => {
    const aSubmitted = ['submitted', 'Applied'].includes(a.status) ? 0 : 1;
    const bSubmitted = ['submitted', 'Applied'].includes(b.status) ? 0 : 1;
    if (aSubmitted !== bSubmitted) return aSubmitted - bSubmitted;
    const aDate = a.application_start_date ? new Date(a.application_start_date).getTime() : Infinity;
    const bDate = b.application_start_date ? new Date(b.application_start_date).getTime() : Infinity;
    return aDate - bDate;
  });

  return (
    <Layout>
       <div className="space-y-3">
         {/* German stripe */}
         <div className="german-stripe w-full" />

         {/* COMPACT HEADER */}
         <div className="flex items-center justify-between flex-wrap gap-2">
           <div className="flex items-center gap-2">
             <h1 className="text-lg font-bold text-foreground">Applications</h1>
             <span className="text-xs text-muted-foreground">({applications.length})</span>
           </div>
           <div className="flex gap-1.5 flex-wrap">
             <ExcelTemplate />
             <ExcelUpload onUpload={handleExcelUpload} />
              <Button size="sm" className="h-7 text-xs" onClick={() => setShowAddDialog(!showAddDialog)}>
                <Plus className="mr-1 h-3 w-3" /> {showAddDialog ? 'Close' : 'Add'}
              </Button>
            </div>
          </div>

          {/* Inline Add Form */}
          {showAddDialog && (
            <Card>
              <CardContent className="pt-4">
                <form onSubmit={handleAddApplication} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">University Name *</Label><Input name="university_name" required className="h-8 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">Program Name *</Label><Input name="program_name" required className="h-8 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">IELTS</Label><Input name="ielts_requirement" className="h-8 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">German</Label><Input name="german_requirement" className="h-8 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">Fees (EUR)</Label><Input name="fees_eur" type="number" className="h-8 text-xs" /></div>
                    <div className="space-y-1">
                      <Label className="text-xs">Application Method</Label>
                      <Select name="application_method">
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Uni-assist">Uni-assist</SelectItem>
                          <SelectItem value="Direct">Direct</SelectItem>
                          <SelectItem value="VPD + University">VPD + University</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input name="application_start_date" type="date" className="h-8 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">End Date</Label><Input name="application_end_date" type="date" className="h-8 text-xs" /></div>
                    <div className="col-span-2 space-y-1"><Label className="text-xs">Portal Link</Label><Input name="portal_link" type="url" className="h-8 text-xs" /></div>
                    <div className="col-span-2 space-y-1"><Label className="text-xs">Notes</Label><Input name="notes" className="h-8 text-xs" /></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button type="submit" size="sm">Add Application</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

         {/* TABLE SECTION */}
         <Card>
           <CardContent className="p-0">
             {applications.length === 0 ? (
               <div className="text-center py-8 text-sm text-muted-foreground">No applications found.</div>
             ) : (
               <div className="overflow-x-auto">
                 <Table className="compact-table">
                   <TableHeader>
                     <TableRow>
                       <TableHead className="w-8"></TableHead>
                       <TableHead>University</TableHead>
                       <TableHead>Program</TableHead>
                       <TableHead>IELTS</TableHead>
                       <TableHead>German</TableHead>
                       <TableHead>Fees</TableHead>
                       <TableHead>Start</TableHead>
                       <TableHead>Deadline</TableHead>
                       <TableHead>Method</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="w-16"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {sortedApplications.map((app) => {
                       const hasCredentials = app.show_credentials_to_student && 
                         (app.portal_link || app.portal_login_id || app.portal_password);
                       const isSubmitted = ['submitted', 'Applied'].includes(app.status);
                       
                       return (
                         <>
                           <TableRow key={app.id}>
                             <TableCell>
                               <div className="flex items-center gap-0.5">
                                 {isSubmitted && (
                                   <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                                 )}
                                 {hasCredentials && (
                                   <Button size="icon" variant="ghost" onClick={() => toggleRowExpand(app.id)} className="h-5 w-5 p-0">
                                     {expandedRows.has(app.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                   </Button>
                                 )}
                               </div>
                             </TableCell>
                             <TableCell className="font-medium whitespace-nowrap">{app.university_name}</TableCell>
                             <TableCell className="whitespace-nowrap">{app.program_name}</TableCell>
                             <TableCell>{app.ielts_requirement || '-'}</TableCell>
                             <TableCell>{app.german_requirement || '-'}</TableCell>
                             <TableCell>{app.fees_eur ? `€${app.fees_eur}` : '-'}</TableCell>
                             <TableCell className="whitespace-nowrap">
                               {app.application_start_date ? new Date(app.application_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
                             </TableCell>
                             <TableCell className="whitespace-nowrap">
                               {app.application_end_date ? new Date(app.application_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
                             </TableCell>
                             <TableCell>{app.application_method || '-'}</TableCell>
                             <TableCell>
                               <Select value={app.status} onValueChange={(val) => updateApplicationStatus(app.id, val as Application['status'])}>
                                 <SelectTrigger className="h-6 w-24 text-[10px] border-0 p-0">
                                   <Badge variant={getStatusBadgeVariant(app.status)} className="text-[10px] px-1.5 py-0">{app.status}</Badge>
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
                             <TableCell>
                               <div className="flex items-center gap-0.5">
                                 <Button size="icon" variant="ghost" className="h-5 w-5 p-0" onClick={() => openEditDialog(app)}><Edit className="h-3 w-3" /></Button>
                                 <Button size="icon" variant="ghost" className="h-5 w-5 p-0" asChild>
                                   <a href={app.portal_link || '#'} target="_blank" rel="noopener noreferrer" className={!app.portal_link ? 'opacity-20 pointer-events-none' : ''}>
                                     <ExternalLink className="h-3 w-3" />
                                   </a>
                                 </Button>
                                 <Button size="icon" variant="ghost" className="h-5 w-5 p-0" onClick={() => deleteApplication(app.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                               </div>
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
    </Layout>
  );
};

export default Applications;
