import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  GraduationCap, 
  Calendar, 
  User, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { sendEmail } from '@/lib/sendEmail';

import useRealTimeSync from '@/hooks/useRealTimeSync';

type Application = Database['public']['Tables']['applications']['Row'] & {
  profiles?: any;
};

// Simple debounce hook
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles(full_name, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data as any[]) || []);
    } catch (error: any) {
      toast({
        title: "Error fetching applications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time sync for admin applications
  useRealTimeSync({
    table: 'applications',
    callback: fetchApplications
  });

  useEffect(() => {
    filterApplications();
  }, [applications, debouncedSearch, statusFilter, universityFilter]);

  const filterApplications = () => {
    let filtered = applications;

    const q = (debouncedSearch || '').toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(app => 
        (app.profiles?.full_name || '').toLowerCase().includes(q) ||
        (app.university_name || '').toLowerCase().includes(q) ||
        (app.program_name || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (universityFilter !== 'all') {
      filtered = filtered.filter(app => app.university_name === universityFilter);
    }

    setFilteredApplications(filtered);
  };

  const resolveEmail = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await (supabase as any).rpc('get_user_email', { p_user_id: userId });
      if (error) return null;
      return (data as string) || null;
    } catch {
      return null;
    }
  };

  const updateApplicationStatus = async (appId: string, status: string, updatedNotes?: string) => {
    try {
      const updates: any = { status };
      if (updatedNotes !== undefined) updates.notes = updatedNotes;

      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', appId);

      if (error) throw error;

      toast({
        title: "Application updated",
        description: "Application status updated successfully",
      });
      
      setSelectedApp(null);
      setNotes('');
      fetchApplications();

      // Add in-app notification for the student (bell)
      try {
        const app = applications.find(a => a.id === appId);
        const userId = app?.profiles?.user_id;
        if (userId) {
          const uni = app?.university_name || '';
          await (supabase as any).from('notifications').insert({ user_id: userId, title: `Application updated: ${uni} → ${status.replace('_',' ')}`, type: 'application', ref_id: appId });
        }
      } catch {}

      // Fire-and-forget email to student
      try {
        const app = applications.find(a => a.id === appId);
        const userId = app?.profiles?.user_id;
        const to = userId ? await resolveEmail(userId) : null;
        if (to) {
          const { wrapInEmailTemplate, getPersonalizedGreeting, signOffs } = await import('@/lib/emailTemplate');
          const contentParts: string[] = [];
          contentParts.push(`Your application for <strong>${app?.university_name || ''}</strong> — <em>${app?.program_name || ''}</em> is now <strong>${status.replace('_',' ')}</strong>.`);
          if (updatedNotes) contentParts.push(`<br/><br/><strong>Admin notes:</strong><br/>${(updatedNotes || '').replace(/\n/g, '<br/>')}`);
          const deadline = (app as any)?.application_end_date ? new Date((app as any).application_end_date) : null;
          if (deadline) {
            contentParts.push(`<br/><br/>Deadline: ${deadline.toLocaleDateString()}`);
          }
          const emailHtml = wrapInEmailTemplate(contentParts.join(''), {
            customGreeting: getPersonalizedGreeting(app?.profiles?.full_name || ''),
            signOff: signOffs.team
          });
          await sendEmail(to, 'Application update', emailHtml);
        }
      } catch {}
    } catch (error: any) {
      toast({
        title: "Error updating application",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted/10 text-muted-foreground';
      case 'submitted': return 'bg-primary/10 text-primary';
      case 'under_review': return 'bg-warning/10 text-warning';
      case 'accepted': return 'bg-success/10 text-success';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      case 'waitlisted': return 'bg-secondary/10 text-secondary';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'under_review': return <AlertTriangle className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'waitlisted': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (days: number | null) => {
    if (days === null) return 'text-muted-foreground';
    if (days < 0) return 'text-destructive';
    if (days <= 7) return 'text-warning';
    if (days <= 30) return 'text-primary';
    return 'text-success';
  };

  const uniqueUniversities = [...new Set(applications.map(app => app.university_name))];

  return (
    <Layout>
      <div className="space-y-3">
        <div>
          <h1 className="text-base font-bold text-foreground">Applications</h1>
          <p className="text-[10px] text-muted-foreground">Track and manage student applications</p>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-none"><CardContent className="p-2.5 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <Input placeholder="Search by name or university..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-7 text-xs" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={universityFilter} onValueChange={setUniversityFilter}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="University" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueUniversities.map(uni => uni && (
                    <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground">Showing {filteredApplications.length} of {applications.length}</p>
          </CardContent></Card>

        <Card className="shadow-none"><CardContent className="p-0">
            {loading ? (
              <InlineLoader label="Loading applications" />
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground">No applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/50 text-muted-foreground border-y">
                    <tr>
                      <th className="text-left p-1.5 font-medium">Student</th>
                      <th className="text-left p-1.5 font-medium">University</th>
                      <th className="text-left p-1.5 font-medium">Program</th>
                      <th className="text-left p-1.5 font-medium">Status</th>
                      <th className="text-left p-1.5 font-medium">Deadline</th>
                      <th className="text-left p-1.5 font-medium">Fees</th>
                      <th className="text-left p-1.5 font-medium">Applied</th>
                      <th className="text-left p-1.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => {
                      const daysUntilDeadline = getDaysUntilDeadline((app as any).application_end_date);
                      return (
                        <tr key={app.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <div className="max-w-[120px]">
                                <p className="text-[11px] font-medium truncate">{app.profiles?.full_name || 'Unknown'}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{app.profiles?.user_id?.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-1.5">
                            <span className="text-[11px] truncate block max-w-[120px]">{app.university_name}</span>
                          </td>
                          <td className="p-1.5">
                            <span className="text-[11px] truncate block max-w-[120px]">{app.program_name}</span>
                          </td>
                          <td className="p-1.5">
                            <Badge className={`${getStatusColor(app.status)} text-[8px] px-1 py-0 h-4`}>
                              {app.status?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-1.5">
                            <span className="text-[10px] whitespace-nowrap">
                              {(app as any).application_end_date ? new Date((app as any).application_end_date).toLocaleDateString() : '—'}
                            </span>
                          </td>
                          <td className="p-1.5">
                            <span className="text-[10px]">{app.fees_eur ? `€${app.fees_eur}` : '—'}</span>
                          </td>
                          <td className="p-1.5">
                            <span className="text-[10px] whitespace-nowrap">{new Date(app.created_at).toLocaleDateString()}</span>
                          </td>
                          <td className="p-1.5">
                            <Button size="sm" variant="outline" className="h-6 text-[9px] px-1.5"
                              onClick={() => { setSelectedApp(app); setNotes(app.notes || ''); }}>
                              Manage
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedApp && (
          <Card className="shadow-none">
            <CardContent className="p-2.5 space-y-2">
              <p className="text-[11px] font-semibold">Manage - {selectedApp.university_name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="space-y-1 text-muted-foreground">
                  <p><strong>Student:</strong> {selectedApp.profiles?.full_name}</p>
                  <p><strong>University:</strong> {selectedApp.university_name}</p>
                  <p><strong>Program:</strong> {selectedApp.program_name}</p>
                  <p><strong>Fees:</strong> {selectedApp.fees_eur ? `€${selectedApp.fees_eur}` : '—'}</p>
                  <p><strong>Deadline:</strong> {(selectedApp as any).application_end_date ? new Date((selectedApp as any).application_end_date).toLocaleDateString() : '—'}</p>
                </div>
                <div className="space-y-1.5">
                  <Select value={selectedApp.status} onValueChange={(status) => updateApplicationStatus(selectedApp.id, status)}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="waitlisted">Waitlisted</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Admin notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[60px] text-[10px]" />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-6 text-[9px]" onClick={() => updateApplicationStatus(selectedApp.id, selectedApp.status, notes)}>Save</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[9px]" onClick={() => { setSelectedApp(null); setNotes(''); }}>Cancel</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
