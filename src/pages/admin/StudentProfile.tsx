import Layout from '@/components/Layout';
import FullScreenLoader from '@/components/FullScreenLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  GraduationCap,
  FileText,
  Download,
  Eye,
  Award,
  BookOpen,
  Briefcase,
  RefreshCw,
  DollarSign,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { DOCUMENTS } from '@/components/APSRequiredDocuments';
import { sendEmail } from '@/lib/sendEmail';

type StudentProfile = Database['public']['Tables']['profiles']['Row'] & {
  applications?: Database['public']['Tables']['applications']['Row'][];
  documents?: Database['public']['Tables']['documents']['Row'][];
  service_requests?: Database['public']['Tables']['service_requests']['Row'][];
  files?: Database['public']['Tables']['files']['Row'][];
};

export default function StudentProfile() {
  const { studentId } = useParams();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = useState({ total: 0, received: 0, pending: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchStudentProfile = async () => {
    if (!studentId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        applications(*),
        service_requests(*)
      `)
      .eq('user_id', studentId)
      .single();
    if (error) throw error;

    // Fetch all documents (includes both APS required and additional docs)
    const { data: docsData } = await supabase
      .from('documents' as any)
      .select('id,user_id,category,file_name,file_url,created_at,updated_at,upload_path,module,status,reviewed_by,reviewed_at,admin_notes')
      .eq('user_id', studentId);

    return { ...(data as any), documents: docsData || [] } as StudentProfile;
  };

  // Resolve the student's email using the Postgres RPC at send time (no CORS)
  const resolveEmailNow = async (): Promise<string | null> => {
    try {
      if (!studentId) return email;
      const { data, error } = await (supabase as any).rpc('get_user_email', { p_user_id: studentId });
      if (!error && data) return data as string;
    } catch {}
    return email;
  };

  const fetchPaymentSummary = async () => {
    if (!studentId) return;
    
    const { data, error } = await supabase
      .from('service_requests' as any)
      .select(`
        id,
        service_payments (
          amount,
          status
        )
      `)
      .eq('user_id', studentId);

    if (!error && data) {
      let total = 0, received = 0, pending = 0;
      
      (data as any[]).forEach(request => {
        (request.service_payments || []).forEach((p: any) => {
          const amount = Number(p.amount) || 0;
          total += amount;
          if (p.status === 'received') received += amount;
          if (p.status === 'pending') pending += amount;
        });
      });

      setPaymentSummary({ total, received, pending });
    }
  };

  const updateDocumentStatus = async (docId: string, nextStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('documents')
        .update({
          status: nextStatus,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', docId)
        .select('id');
      if (error) throw error;
      toast({ title: 'Updated', description: `Document marked as ${nextStatus}.` });
      // Ensure UI is in sync without hard refresh
      await studentQuery.refetch();
      // Add notification for student
      try {
        if (studentId) {
          await (supabase as any).from('notifications').insert({ user_id: studentId, title: `Document status updated to ${nextStatus}`, type: 'document', ref_id: docId });
        }
      } catch {}

      // Fire-and-forget: notify student via email (attempt to resolve email now)
      try {
        const to = await resolveEmailNow();
        if (to) {
          await sendEmail(
            to,
            `Your document status was updated to ${nextStatus}`,
            `<p>Hi ${student?.full_name || ''},</p>
             <p>Your document status has been updated to <strong>${nextStatus}</strong> by the admin team.</p>
             <p>If you have questions, please reply to this email.</p>`
          );
        }
      } catch (_) { /* ignore email errors */ }
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      // Fallback if new columns not in DB yet: only update status
      if (msg.includes("reviewed_at") || msg.includes("reviewed_by") || msg.includes("column") || msg.includes("schema cache")) {
        try {
          const { error: err2 } = await (supabase as any)
            .from('documents')
            .update({ status: nextStatus })
            .eq('id', docId)
            .select('id');
          if (err2) throw err2;
          toast({ title: 'Updated (partial)', description: `Document marked as ${nextStatus}. Apply migrations to enable reviewer metadata.`, variant: 'default' });
          fetchStudentProfile();
          try {
            if (studentId) {
              await (supabase as any).from('notifications').insert({ user_id: studentId, title: `Document status updated to ${nextStatus}`, type: 'document', ref_id: docId });
            }
          } catch {}
          try {
            const to = await resolveEmailNow();
            if (to) {
              await sendEmail(
                to,
                `Your document status was updated to ${nextStatus}`,
                `<p>Hi ${student?.full_name || ''},</p>
                 <p>Your document status has been updated to <strong>${nextStatus}</strong> by the admin team.</p>
                 <p>If you have questions, please reply to this email.</p>`
              );
            }
          } catch (_) {}
          return;
        } catch (e2: any) {
          toast({ title: 'Update failed', description: e2?.message || 'Unable to update document status', variant: 'destructive' });
          return;
        }
      }
      toast({ title: 'Update failed', description: e?.message || 'Unable to update document status', variant: 'destructive' });
    }
  };

  const resolveEmail = async () => {
    if (!studentId) return;
    try {
      const { data, error } = await (supabase as any).rpc('get_user_email', { p_user_id: studentId });
      if (error) throw error;
      if (data) {
        setEmail(data as string);
      } else {
        setEmail(null);
      }
    } catch (e: any) {
      // Keep silent to avoid noisy UI; show fallback below.
    }
  };

  const studentQuery = useQuery({
    queryKey: ['admin_student_profile', studentId],
    queryFn: fetchStudentProfile,
    enabled: !!studentId,
  });

  useEffect(() => {
    if (studentQuery.data) {
      setStudent(studentQuery.data);
      resolveEmail();
      fetchPaymentSummary();
      setLoading(false);
    }
    if (studentQuery.isError) {
      setLoading(false);
    }
  }, [studentQuery.data, studentQuery.isError]);

  // Realtime updates for student's documents and files
  // Debounced realtime updates for documents and files under this student
  useEffect(() => {
    if (!studentId) return;
    const debounce = <F extends (...args: any[]) => void>(fn: F, delay = 300) => {
      let t: any; return (...args: Parameters<F>) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    };
    const channel = supabase
      .channel(`student-docs-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${studentId}` }, debounce(() => studentQuery.refetch(), 400))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  const downloadDocument = async (doc: any) => {
    try {
      // If we have a public URL, use it directly
      if (doc.file_url && typeof doc.file_url === 'string') {
        const link = document.createElement('a');
        link.href = doc.file_url;
        link.download = doc.file_name || 'document';
        link.click();
        return;
      }

      // Fallback: try to create a signed URL if upload_path exists
      if (doc.upload_path) {
        const { data } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.upload_path, 300);
        if (data?.signedUrl) {
          const link = document.createElement('a');
          link.href = data.signedUrl;
          link.download = doc.file_name || 'document';
          link.click();
          return;
        }
      }

      toast({ title: 'Unavailable', description: 'No downloadable link for this file', variant: 'destructive' });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
    }
  };

  const viewDocument = async (doc: any) => {
    try {
      // Prefer public URL if present
      if (doc.file_url && typeof doc.file_url === 'string') {
        window.open(doc.file_url, '_blank');
        return;
      }

      // Fallback to signed URL from storage path if available
      if (doc.upload_path) {
        const { data } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.upload_path, 300);
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          return;
        }
      }

      toast({ title: 'Unavailable', description: 'No viewable link for this file', variant: 'destructive' });
    } catch (error) {
      if (doc.file_url) window.open(doc.file_url, '_blank');
    }
  };

  if (loading) {
    return (
      <Layout>
        <FullScreenLoader label="Loading student profile" />
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Student Not Found</h1>
          <Link to="/admin/students" className="text-primary hover:underline">
            Back to Students
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/students">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
        </div>

        {/* Student Header with Quick Actions */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {student.full_name || 'Unknown Student'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">
                    {email || `${student.user_id?.slice(0, 8)}… (email unavailable)`}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={resolveEmail} title="Retry fetching email">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Joined {new Date(student.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant={student.aps_pathway ? 'default' : 'secondary'}>
                  {student.aps_pathway || 'No APS Pathway'}
                </Badge>
                <Badge variant="outline">
                  German: {student.german_level || 'None'}
                </Badge>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/payments/${studentId}`)}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                View Payments
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/requests/${studentId}`)}
                className="gap-2"
              >
                <Briefcase className="h-4 w-4" />
                View Requests
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-2xl font-bold">{student.applications?.length || 0}</p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">
                    {(student.documents || []).filter((d: any) => d.status === 'approved').length}/{DOCUMENTS.length}
                  </p>
                </div>
                <FileCheck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="text-2xl font-bold">{student.service_requests?.length || 0}</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Payments</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{paymentSummary.received.toLocaleString()}
                  </p>
                  {paymentSummary.pending > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ₹{paymentSummary.pending.toLocaleString()} pending
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="text-sm mt-1">{student.date_of_birth || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Country of Education</label>
                  <p className="text-sm mt-1">{student.country_of_education || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Work Experience</label>
                  <p className="text-sm mt-1">
                    {student.work_experience_years ? `${student.work_experience_years} years` : 'Not provided'}
                    {student.work_experience_field && ` in ${student.work_experience_field}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Class 10 & 12</label>
                  <p className="text-sm mt-1">
                    10th: {student.class_10_marks || 'N/A'} | 12th: {student.class_12_marks || 'N/A'} ({student.class_12_stream || 'N/A'})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bachelor's Degree</label>
                  <p className="text-sm mt-1">
                    {student.bachelor_degree_name || 'N/A'} in {student.bachelor_field || 'N/A'}<br/>
                    CGPA: {student.bachelor_cgpa_percentage || 'N/A'} | Credits: {student.bachelor_credits_ects || 'N/A'} | Duration: {student.bachelor_duration_years || 'N/A'} years
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Master's Degree</label>
                  <p className="text-sm mt-1">
                    {student.master_degree_name || 'N/A'} in {student.master_field || 'N/A'}<br/>
                    CGPA: {student.master_cgpa_percentage || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Language Score</label>
                  <p className="text-sm mt-1">{student.ielts_toefl_score || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              University Applications ({student.applications?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.applications && student.applications.length > 0 ? (
              <div className="space-y-3">
                {student.applications.map((app) => (
                  <div key={app.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{app.university_name}</h4>
                        <p className="text-sm text-muted-foreground">{app.program_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        app.status === 'offer' ? 'default' :
                        app.status === 'interview' ? 'secondary' :
                        app.status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No applications found</p>
            )}
          </CardContent>
        </Card>

        {/* Required Documents (mirrors student view categories) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Required Documents (by category)
              </CardTitle>
              <Button size="sm" variant="outline" onClick={fetchStudentProfile}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop / Tablet list */}
            <div className="hidden md:block space-y-2">
              {DOCUMENTS.map((d) => {
                const doc = (student.documents || []).find((x) => x.category === d.key);
                return (
                  <div key={d.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium text-sm break-words whitespace-normal">{d.label.replace('📄 ', '')}</p>
                      <p className="text-xs text-muted-foreground break-words whitespace-normal">
                        {doc ? doc.file_name : 'Not uploaded'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc ? (
                        <>
                          <Badge variant={(doc as any).status === 'approved' ? 'secondary' : (doc as any).status === 'rejected' ? 'destructive' : 'outline'} className="capitalize">
                            {(doc as any).status || 'pending'}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => viewDocument(doc as any)} className="px-2" title="View">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => downloadDocument(doc as any)} className="px-2" title="Download">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Select value={(doc as any).status || 'pending'} onValueChange={(v: any) => updateDocumentStatus((doc as any).id, v)}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approve</SelectItem>
                              <SelectItem value="rejected">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <Badge variant="outline">Missing</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile: Accordion list */}
            <div className="md:hidden">
              <Accordion type="single" collapsible className="w-full">
                {DOCUMENTS.map((d) => {
                  const doc = (student.documents || []).find((x) => x.category === d.key);
                  const status = (doc as any)?.status || 'pending';
                  return (
                    <AccordionItem key={d.key} value={d.key}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-medium break-words whitespace-normal">{d.label.replace('📄 ', '')}</span>
                          {doc ? (
                            <Badge variant={status === 'approved' ? 'secondary' : status === 'rejected' ? 'destructive' : 'outline'} className="capitalize ml-2">
                              {status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Missing</Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {doc ? (
                          <div className="space-y-3 pt-2">
                            <div className="text-xs text-muted-foreground break-words whitespace-normal">{doc.file_name}</div>
                            <div className="flex items-center gap-2 flex-wrap w-full">
                              <Button size="sm" variant="outline" onClick={() => viewDocument(doc as any)} className="px-2 w-full sm:w-auto">View</Button>
                              <Button size="sm" variant="ghost" onClick={() => downloadDocument(doc as any)} className="px-2 w-full sm:w-auto">Download</Button>
                            </div>
                            <div className="pt-1">
                              <Select value={status} onValueChange={(v: any) => updateDocumentStatus((doc as any).id, v)}>
                                <SelectTrigger className="h-9 text-xs w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="approved">Approve</SelectItem>
                                  <SelectItem value="rejected">Reject</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Not uploaded</div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </CardContent>
        </Card>

        {/* Additional Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Documents ({student.documents?.filter((d: any) => d.module === 'additional_documents').length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.documents && student.documents.filter((d: any) => d.module === 'additional_documents').length > 0 ? (
              <div className="space-y-2">
                {student.documents.filter((d: any) => d.module === 'additional_documents').map((doc: any) => (
                  <div key={doc.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                        {doc.admin_notes && (
                          <p className="text-xs text-destructive mt-1">Note: {doc.admin_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={(doc.status === 'approved' ? 'secondary' : doc.status === 'rejected' ? 'destructive' : 'outline')} className="capitalize">
                        {doc.status || 'pending'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const { data } = await supabase.storage
                            .from('documents')
                            .createSignedUrl(doc.upload_path, 300);
                          if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                        }}
                        title="View"
                        className="px-2"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const { data } = await supabase.storage
                            .from('documents')
                            .createSignedUrl(doc.upload_path, 300, { download: doc.file_name });
                          if (data?.signedUrl) {
                            const a = document.createElement('a');
                            a.href = data.signedUrl;
                            a.download = doc.file_name;
                            a.click();
                          }
                        }}
                        title="Download"
                        className="px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Select 
                        value={doc.status || 'pending'} 
                        onValueChange={async (value: 'pending' | 'approved' | 'rejected') => {
                          try {
                            const { error } = await supabase
                              .from('documents')
                              .update({ status: value } as any)
                              .eq('id', doc.id);
                            
                            if (error) throw error;
                            
                            toast({ 
                              title: 'Status Updated', 
                              description: `Document ${value}` 
                            });
                            
                            await studentQuery.refetch();
                          } catch (error: any) {
                            toast({ 
                              title: 'Error', 
                              description: error.message, 
                              variant: 'destructive' 
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approve</SelectItem>
                          <SelectItem value="rejected">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No additional documents uploaded</p>
            )}
          </CardContent>
        </Card>

        {/* Service Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Service Requests ({student.service_requests?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.service_requests && student.service_requests.length > 0 ? (
              <div className="space-y-3">
                {student.service_requests.map((req) => (
                  <div key={req.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{req.service_type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {req.service_price} {req.service_currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        req.status === 'in_review' ? 'secondary' :
                        req.status === 'payment_pending' ? 'default' :
                        req.status === 'new' ? 'outline' : 'secondary'
                      }>
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No service requests found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
