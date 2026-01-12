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
  ExternalLink,
  CheckCircle,
  X
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { DOCUMENTS } from '@/components/APSRequiredDocuments';
import { sendEmail } from '@/lib/sendEmail';

type StudentProfile = Database['public']['Tables']['profiles']['Row'] & {
  applications?: Database['public']['Tables']['applications']['Row'][];
  documents?: Database['public']['Tables']['documents']['Row'][];
  service_requests?: Database['public']['Tables']['service_requests']['Row'][];
};

export default function StudentProfile() {
  const { studentId } = useParams();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [previewContract, setPreviewContract] = useState<any | null>(null);
  const [updatingContractId, setUpdatingContractId] = useState<string | null>(null);
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

  const fetchContracts = async () => {
    if (!studentId) return;
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched contracts:', data);
      setContracts(data || []);
      toast({ title: 'Refreshed', description: `Loaded ${data?.length || 0} contracts` });
      
      // Log signed contracts for debugging
      const signedContracts = (data || []).filter(c => c.signed_document_url || c.status === 'signed');
      console.log('Signed contracts found:', signedContracts.length);
      signedContracts.forEach(c => {
        console.log('Signed contract:', c.contract_reference, 'Status:', c.status, 'URL:', c.signed_document_url);
      });
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({ title: 'Error', description: 'Failed to fetch contracts', variant: 'destructive' });
    }
  };

  const updateContractStatus = async (contractId: string, newStatus: 'completed' | 'rejected') => {
    try {
      setUpdatingContractId(contractId);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('contracts')
        .update({
          status: newStatus,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (error) throw error;

      // Create notification for student (using only valid schema fields)
      try {
        await supabase.from('notifications').insert({
          user_id: studentId,
          title: `Contract ${newStatus === 'completed' ? 'Approved' : 'Rejected'}`,
          type: 'contract',
          ref_id: contractId,
          meta: {
            action: newStatus,
            message: `Your contract has been ${newStatus === 'completed' ? 'approved' : 'rejected'} by the admin team.`
          }
        });
      } catch (noteErr) {
        console.warn('Notification insert error:', noteErr);
      }

      // Send email notification
      const contract = contracts.find(c => c.id === contractId);
      if (contract && email) {
        try {
          await sendEmail(
            email,
            `Contract ${newStatus === 'completed' ? 'Approved' : 'Rejected'}`,
            `<p>Hi ${student?.full_name || 'Student'},</p>
             <p>Your service contract <strong>${contract.contract_reference}</strong> has been <strong>${newStatus === 'completed' ? 'approved' : 'rejected'}</strong> by the admin team.</p>
             <p>Contract Reference: <strong>${contract.contract_reference}</strong></p>
             <p>You can view details on your dashboard: <a href="https://publicgermany.vercel.app/dashboard">View on Dashboard</a></p>
             <p>Best regards,<br/>publicgermany Team</p>`
          );
        } catch (_) { /* ignore email errors */ }
      }

      toast({ title: 'Updated', description: `Contract marked as ${newStatus}` });
      fetchContracts();
    } catch (error: any) {
      console.error('Error updating contract:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update contract', variant: 'destructive' });
    } finally {
      setUpdatingContractId(null);
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
      fetchContracts();
      setLoading(false);
    }
    if (studentQuery.isError) {
      setLoading(false);
    }
  }, [studentQuery.data, studentQuery.isError, studentId]);

  // Realtime updates for student's documents and files
  // Debounced realtime updates for documents and files under this student
  useEffect(() => {
    if (!studentId) return;
    const debounce = <F extends (...args: any[]) => void>(fn: F, delay = 300) => {
      let t: any; return (...args: Parameters<F>) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    };
    const channel = supabase
      .channel(`student-profile-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${studentId}` }, debounce(() => studentQuery.refetch(), 400))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts', filter: `student_id=eq.${studentId}` }, debounce(() => {
        console.log('Contract change detected, refreshing contracts...');
        fetchContracts();
      }, 400))
      .subscribe();
    
    return () => { 
      supabase.removeChannel(channel);
    };
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contract Reference</label>
                  <p className="text-sm mt-1">{(student as any).contract_reference || 'Not provided'}</p>
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
                    University: {(student as any).bachelor_university || 'N/A'}<br/>
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
                  <label className="text-sm font-medium text-muted-foreground">Intended Master Course</label>
                  <p className="text-sm mt-1">{(student as any).intended_master_course || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Intake</label>
                  <p className="text-sm mt-1">{(student as any).intake || 'Not provided'}</p>
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

        {/* Contracts Management - Tabs: All Contracts / Signed Contracts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Service Contracts ({contracts.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={fetchContracts}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Contracts</TabsTrigger>
                <TabsTrigger value="signed">Signed Contracts</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {contracts.length > 0 ? (
                  <div className="space-y-3">
                    {contracts.map((contract) => (
                      <div 
                        key={contract.id}
                        className={`border-l-4 rounded-lg p-4 ${
                          contract.status === 'draft' ? 'border-l-amber-500 bg-amber-50/30' :
                          contract.status === 'sent' ? 'border-l-blue-500 bg-blue-50/30' :
                          contract.status === 'signed' ? 'border-l-orange-500 bg-orange-50/30' :
                          'border-l-green-500 bg-green-50/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{contract.contract_reference}</h4>
                              <Badge variant={
                                contract.status === 'draft' ? 'secondary' :
                                contract.status === 'sent' ? 'outline' :
                                contract.status === 'signed' ? 'default' : 'default'
                              }>
                                {contract.status === 'draft' ? 'Draft' :
                                contract.status === 'sent' ? 'Sent to Student' :
                                contract.status === 'signed' ? 'Awaiting Approval' :
                                'Approved'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Package: {contract.service_package || 'N/A'} | Fee: ₹{contract.service_fee || 0}</p>
                              <p>Sent: {contract.sent_at ? new Date(contract.sent_at).toLocaleDateString() : 'Not sent'}</p>
                              {contract.signed_at && (
                                <p>Signed: {new Date(contract.signed_at).toLocaleDateString()}</p>
                              )}
                              {contract.signed_document_url && (
                                <p>
                                  <button 
                                    onClick={() => {
                                      const firstName = student?.full_name?.split(' ')[0] || 'Student';
                                      const link = document.createElement('a');
                                      link.href = contract.signed_document_url!;
                                      link.download = `${firstName}_SignedContract.pdf`;
                                      link.target = '_blank';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="text-primary hover:underline text-xs flex items-center gap-1"
                                  >
                                    Download Signed Contract
                                    <Download className="h-3 w-3" />
                                  </button>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons (same as before) */}
                          {contract.status === 'signed' && (
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingContractId === contract.id}
                                onClick={() => updateContractStatus(contract.id, 'completed')}
                                className="gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                {updatingContractId === contract.id ? 'Approving...' : 'Approve'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={updatingContractId === contract.id}
                                onClick={() => updateContractStatus(contract.id, 'rejected')}
                                className="gap-2"
                              >
                                <X className="h-4 w-4" />
                                {updatingContractId === contract.id ? 'Rejecting...' : 'Reject'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No contracts found</p>
                )}
              </TabsContent>

              <TabsContent value="signed">
                {/* List only contracts with signed document URL or signed status */}
                {(() => {
                  const signedContracts = contracts.filter(c => c.signed_document_url || c.status === 'signed');
                  console.log('Signed contracts filter result:', { total: contracts.length, signed: signedContracts.length, contracts });
                  return signedContracts.length > 0;
                })() ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {contracts.filter(c => c.signed_document_url || c.status === 'signed').map((contract) => (
                        <div key={contract.id} className="border rounded-lg p-3 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-sm">{contract.contract_reference}</h4>
                                <p className="text-xs text-muted-foreground">Signed: {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : '—'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {contract.signed_document_url && (
                                  <Button size="sm" variant="ghost" onClick={() => setPreviewContract(contract)} className="px-2">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => updateContractStatus(contract.id, 'completed')} className="px-2">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateContractStatus(contract.id, 'rejected')} className="px-2">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Package: {contract.service_package || 'N/A'} | Fee: ₹{contract.service_fee || 0}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Preview pane */}
                    <div>
                      {previewContract ? (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="p-3 border-b bg-surface/50 flex items-center justify-between">
                            <div className="font-medium">Preview: {previewContract.contract_reference}</div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => {
                                const firstName = student?.full_name?.split(' ')[0] || 'Student';
                                const link = document.createElement('a');
                                link.href = previewContract.signed_document_url!;
                                link.download = `${firstName}_SignedContract.pdf`;
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}>Download</Button>
                              <Button size="sm" variant="outline" onClick={() => setPreviewContract(null)}>Close</Button>
                            </div>
                          </div>
                          {previewContract.signed_document_url ? (
                            <iframe src={previewContract.signed_document_url} title="Signed Contract Preview" className="w-full h-[600px]" />
                          ) : (
                            <div className="p-6 text-sm text-muted-foreground">No signed document URL available for preview.</div>
                          )}
                        </div>
                      ) : (
                        <div className="border rounded-lg p-6 text-sm text-muted-foreground">Select a signed contract to preview it here.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No signed contracts uploaded yet</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
