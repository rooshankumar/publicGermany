import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  }, [applications, searchTerm, statusFilter, universityFilter]);

  const filterApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.university_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.program_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

      // Fire-and-forget email to student
      try {
        const app = applications.find(a => a.id === appId);
        const userId = app?.profiles?.user_id;
        const to = userId ? await resolveEmail(userId) : null;
        if (to) {
          const parts: string[] = [];
          parts.push(`<p>Hi ${app?.profiles?.full_name || ''},</p>`);
          parts.push(`<p>Your application for <strong>${app?.university_name || ''}</strong> — <em>${app?.program_name || ''}</em> is now <strong>${status.replace('_',' ')}</strong>.</p>`);
          if (updatedNotes) parts.push(`<p><strong>Admin notes:</strong><br/>${(updatedNotes || '').replace(/\n/g, '<br/>')}</p>`);
          const deadline = (app as any)?.application_end_date ? new Date((app as any).application_end_date) : null;
          if (deadline) {
            parts.push(`<p>Deadline: ${deadline.toLocaleDateString()}</p>`);
          }
          parts.push('<p>— publicGermany Team</p>');
          await sendEmail(to, 'Application update', parts.join('\n'));
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Applications Management</h1>
            <p className="text-muted-foreground">Track and manage all student university applications with live updates</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by student name, university, or program..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={universityFilter} onValueChange={setUniversityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {uniqueUniversities.map(uni => uni && (
                    <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredApplications.length} of {applications.length} applications
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>University Applications ({filteredApplications.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No applications found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Student</th>
                      <th className="text-left p-3 font-medium">University</th>
                      <th className="text-left p-3 font-medium">Program</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Deadline</th>
                      <th className="text-left p-3 font-medium">Fees</th>
                      <th className="text-left p-3 font-medium">Applied</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => {
                      const daysUntilDeadline = getDaysUntilDeadline((app as any).application_end_date);
                      return (
                        <tr key={app.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{app.profiles?.full_name || 'Unknown Student'}</p>
                                <p className="text-sm text-muted-foreground">
                                  ID: {app.profiles?.user_id?.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium truncate max-w-[160px] md:max-w-[220px]">{app.university_name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm truncate block max-w-[160px] md:max-w-[220px]">{app.program_name}</span>
                          </td>
                          <td className="p-3">
                            <Badge className={`${getStatusColor(app.status)} flex items-center gap-1`}>
                              {getStatusIcon(app.status)}
                              {app.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {(app as any).application_end_date ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{new Date((app as any).application_end_date).toLocaleDateString()}</p>
                                  <p className={`text-xs ${getDeadlineColor(daysUntilDeadline)}`}>
                                    {daysUntilDeadline !== null && (
                                      daysUntilDeadline < 0 ? 'Overdue' :
                                      daysUntilDeadline === 0 ? 'Today' :
                                      `${daysUntilDeadline} days`
                                    )}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No deadline set</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-medium">
                              {app.fees_eur ? `€${app.fees_eur}` : 'Not set'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedApp(app);
                                setNotes(app.notes || '');
                              }}
                            >
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

        {/* Application Management Modal/Panel */}
        {selectedApp && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Application - {selectedApp.university_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Application Details</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Student:</strong> {selectedApp.profiles?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>University:</strong> {selectedApp.university_name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Program:</strong> {selectedApp.program_name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Fees:</strong> {selectedApp.fees_eur ? `€${selectedApp.fees_eur}` : 'Not set'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Deadline:</strong> {(selectedApp as any).application_end_date ? 
                      new Date((selectedApp as any).application_end_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Update Status & Notes</h4>
                  <div className="space-y-3">
                    <Select 
                      value={selectedApp.status}
                      onValueChange={(status) => updateApplicationStatus(selectedApp.id, status)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="waitlisted">Waitlisted</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Add admin notes (visible to student)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => updateApplicationStatus(selectedApp.id, selectedApp.status, notes)}
                      >
                        Save Notes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedApp(null);
                          setNotes('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
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
