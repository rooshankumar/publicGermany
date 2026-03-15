import Layout from '@/components/Layout';
import FullScreenLoader from '@/components/FullScreenLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  BookOpen,
  Briefcase,
  RefreshCw,
  DollarSign,
  FileCheck,
  CheckCircle,
  X,
  ClipboardList,
  ScrollText,
  StickyNote
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { DOCUMENTS } from '@/components/APSRequiredDocuments';
import { sendEmail } from '@/lib/sendEmail';
import StudentNotes from '@/components/StudentNotes';
import ApplicationCredentialsCard from '@/components/admin/ApplicationCredentialsCard';
import PersonalEmailPanel from '@/components/admin/PersonalEmailPanel';
import { ExcelUpload } from '@/components/ExcelUpload';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

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
  const [showAddAppDialog, setShowAddAppDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Sort applications: submitted/Applied at top, then by nearest application_start_date
  const sortApplications = (apps: any[]) => {
    return [...apps].sort((a, b) => {
      const aSubmitted = ['submitted', 'Applied'].includes(a.status) ? 0 : 1;
      const bSubmitted = ['submitted', 'Applied'].includes(b.status) ? 0 : 1;
      if (aSubmitted !== bSubmitted) return aSubmitted - bSubmitted;
      const aDate = a.application_start_date ? new Date(a.application_start_date).getTime() : Infinity;
      const bDate = b.application_start_date ? new Date(b.application_start_date).getTime() : Infinity;
      return aDate - bDate;
    });
  };

  const fetchStudentProfile = async () => {
    if (!studentId) return null;
    
    // Fetch everything in a single parallel call
    const [profileRes, docsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select(`
          *,
          applications(*),
          service_requests(*)
        `)
        .eq('user_id', studentId)
        .single(),
      supabase
        .from('documents' as any)
        .select('id,user_id,category,file_name,file_url,created_at,updated_at,upload_path,module,status,reviewed_by,reviewed_at,admin_notes')
        .eq('user_id', studentId)
    ]);

    if (profileRes.error) throw profileRes.error;

    return { 
      ...(profileRes.data as any), 
      documents: docsRes.data || [] 
    } as StudentProfile;
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
      // Run these in parallel after profile is loaded
      Promise.all([
        resolveEmail(),
        fetchPaymentSummary(),
        fetchContracts()
      ]);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${studentId}` }, debounce(() => studentQuery.refetch(), 400))
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

  // Helper to format document name with proper spacing
  const formatDocumentName = (category: string): string => {
    // Check if we have a predefined nice name
    const categoryBaseNames: Record<string, string> = {
      passport_copy: 'Passport',
      passport_photo: 'Passport_Photo',
      signature: 'Signature',
      class_x: 'Class_X_Marksheet_Certificate',
      class_xii: 'Class_XII_Marksheet_Certificate',
      bachelor_degree_certificate: 'Bachelor_Degree_Certificate',
      bachelor_degree_transcript: 'Bachelor_Degree_Transcript',
      bachelor_all_sem_marksheets: 'Bachelor_All_Semester_Marksheets',
      master_degree_certificate: 'Master_Degree_Certificate',
      master_degree_transcript: 'Master_Degree_Transcript',
      master_all_sem_marksheets: 'Master_All_Semester_Marksheets',
      english_language_certificate: 'English_Language_Certificate',
      german_language_certificate: 'German_Language_Certificate',
      recommendation_letter_1: 'Recommendation_Letter_1',
      recommendation_letter_2: 'Recommendation_Letter_2',
      work_experience_1: 'Work_Experience_Certificate_1',
      work_experience_2: 'Work_Experience_Certificate_2',
      official_grading_certificate: 'Official_Grading_Certificate',
      ects_conversion_certificate: 'ECTS_Conversion_Certificate',
      motivation_letter: 'Motivation_Letter',
      cv: 'CV_Resume',
      aps_certificate: 'APS_Certificate',
      admission_letter: 'Admission_Letter',
      financial_proof: 'Financial_Proof',
      health_insurance: 'Health_Insurance',
      academic_transcripts: 'Academic_Transcripts',
      degree_certificate: 'Degree_Certificate',
      language_certificates: 'Language_Certificates',
      recommendation_letter: 'Recommendation_Letter',
      all_sem_marksheets: 'All_Semester_Marksheets',
      bachelor_degree: 'Bachelor_Degree_Transcript',
      master_degree: 'Master_Degree_Transcripts',
      additional: 'Additional_Document',
    };
    
    if (categoryBaseNames[category]) {
      return categoryBaseNames[category];
    }
    
    // Convert camelCase or snake_case to Title_Case
    return category
      .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
      .replace(/[_-]+/g, '_') // normalize separators
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_');
  };

  const downloadDocument = async (doc: any) => {
    try {
      // Get student first and last name for proper filename
      const nameParts = student?.full_name?.split(' ') || ['Student'];
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      // Extract document category/name for filename with proper formatting
      let docName: string;
      
      // For additional documents, use the original file_name (cleaned up)
      if (doc.module === 'additional_documents' && doc.file_name) {
        // Extract just the document name part (after the first underscore prefix like "FirstName_")
        const parts = doc.file_name.split('_');
        if (parts.length > 1) {
          // Skip the first name part and rejoin, then format properly
          const docPart = parts.slice(1).join('_').replace(/\.[^/.]+$/, ''); // Remove extension
          docName = docPart
            .replace(/[_-]+/g, '_')
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('_');
        } else {
          docName = formatDocumentName(doc.file_name.replace(/\.[^/.]+$/, ''));
        }
      } else {
        docName = formatDocumentName(doc.category || 'Document');
      }
      
      const fileExt = doc.file_name?.split('.').pop() || 'pdf';
      const downloadName = lastName 
        ? `${firstName}_${lastName}_${docName}.${fileExt}`
        : `${firstName}_${docName}.${fileExt}`;
      
      // Get the URL to fetch
      let fileUrl = doc.file_url;
      
      // If no public URL, try to create a signed URL
      if (!fileUrl && doc.upload_path) {
        const { data } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.upload_path, 300);
        if (data?.signedUrl) {
          fileUrl = data.signedUrl;
        }
      }
      
      if (!fileUrl) {
        toast({ title: 'Unavailable', description: 'No downloadable link for this file', variant: 'destructive' });
        return;
      }
      
      // Fetch the file as blob and download with proper filename
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
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
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">
                {student.full_name || 'Unknown Student'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate max-w-[200px]">
                    {email || `${student.user_id?.slice(0, 8)}…`}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={resolveEmail} title="Retry">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Joined {new Date(student.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant={student.aps_pathway ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                  {student.aps_pathway || 'No APS'}
                </Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  German: {student.german_level || 'None'}
                </Badge>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/payments/${studentId}`)}
                className="flex-1 sm:flex-none gap-2 text-xs"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Payments
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/requests/${studentId}`)}
                className="flex-1 sm:flex-none gap-2 text-xs"
              >
                <Briefcase className="h-3.5 w-3.5" />
                Requests
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground font-medium">Apps</p>
                  <p className="text-lg sm:text-2xl font-bold">{student.applications?.length || 0}</p>
                </div>
                <BookOpen className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground font-medium">Docs</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {(student.documents || []).filter((d: any) => d.status === 'approved').length}/{DOCUMENTS.length}
                  </p>
                </div>
                <FileCheck className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground font-medium">Services</p>
                  <p className="text-lg sm:text-2xl font-bold">{student.service_requests?.length || 0}</p>
                </div>
                <Briefcase className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground font-medium">Payments</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{paymentSummary.received >= 1000 ? `${(paymentSummary.received / 1000).toFixed(1)}k` : paymentSummary.received}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-2 mb-4 border-b overflow-x-auto no-scrollbar">
            <TabsList className="flex w-max h-9 items-center justify-start bg-transparent p-0 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted/50">
                <User className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted/50">
                <BookOpen className="h-3.5 w-3.5" />
                Apps
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted/50">
                <FileText className="h-3.5 w-3.5" />
                Docs
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted/50">
                <Briefcase className="h-3.5 w-3.5" />
                Services
              </TabsTrigger>
              <TabsTrigger value="contracts" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted/50">
                <ScrollText className="h-3.5 w-3.5" />
                Contracts
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted/50">
                <StickyNote className="h-3.5 w-3.5" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted/50">
                <ClipboardList className="h-3.5 w-3.5" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted/50">
                <Mail className="h-3.5 w-3.5" />
                Email
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab - Personal & Academic Info + Application Dates */}
          <TabsContent value="overview" className="space-y-6 mt-2">
            {/* Application Dates Summary - Excel like table on mobile */}
            {student.applications && student.applications.length > 0 && (
              <Card className="overflow-hidden border-none sm:border shadow-sm">
                <CardHeader className="px-4 py-3 sm:px-6 sm:py-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    Application Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                        <tr>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[120px]">University</th>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">Deadline</th>
                          <th className="px-3 py-2 sm:px-4 sm:py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sortApplications(student.applications).map((app: any) => {
                          const isSubmitted = ['submitted', 'Applied'].includes(app.status);
                          return (
                            <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-2 sm:px-4 sm:py-3">
                                <p className="font-semibold text-foreground line-clamp-1">{app.university_name}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{app.program_name}</p>
                              </td>
                              <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                <p className="font-medium text-foreground">
                                  {app.application_end_date ? new Date(app.application_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                                </p>
                              </td>
                              <td className="px-3 py-2 sm:px-4 sm:py-3">
                                <Badge 
                                  variant={isSubmitted ? 'default' : 'outline'} 
                                  className={`text-[9px] px-1.5 py-0 capitalize ${isSubmitted ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : ''}`}
                                >
                                  {app.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <label className="text-sm font-medium text-muted-foreground">Language Score</label>
                      <p className="text-sm mt-1">{student.ielts_toefl_score || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="mt-2">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">University Applications ({student.applications?.length || 0})</h2>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <ExcelUpload onUpload={async (data) => {
                    if (!studentId) return;
                    try {
                      const rows = data.map((row: any) => ({
                        user_id: studentId,
                        university_name: row.university_name,
                        program_name: row.program_name,
                        ielts_requirement: row.ielts_requirement,
                        german_requirement: row.german_requirement,
                        fees_eur: row.fees_eur ? String(row.fees_eur) : null,
                        application_start_date: row.application_start_date || row.start_date || null,
                        application_end_date: row.application_end_date || row.end_date || null,
                        application_method: row.application_method,
                        required_tests: row.required_tests,
                        portal_link: row.portal_link,
                        notes: row.notes,
                        status: row.status || 'draft',
                      }));
                      const { error } = await supabase.from('applications').insert(rows);
                      if (error) throw error;
                      toast({ title: 'Success', description: `${rows.length} applications imported` });
                      studentQuery.refetch();
                    } catch (err: any) {
                      toast({ title: 'Error', description: err.message || 'Failed to import', variant: 'destructive' });
                    }
                  }} />
                  <Dialog open={showAddAppDialog} onOpenChange={setShowAddAppDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex-1 sm:flex-none h-8 px-3 text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
                      <DialogHeader>
                        <DialogTitle>Add Application</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!studentId) return;
                        const fd = new FormData(e.target as HTMLFormElement);
                        const payload = {
                          user_id: studentId,
                          university_name: fd.get('university_name') as string,
                          program_name: fd.get('program_name') as string,
                          ielts_requirement: (fd.get('ielts_requirement') as string) || null,
                          german_requirement: (fd.get('german_requirement') as string) || null,
                          fees_eur: fd.get('fees_eur') ? String(fd.get('fees_eur')) : null,
                          application_start_date: (fd.get('application_start_date') as string) || null,
                          application_end_date: (fd.get('application_end_date') as string) || null,
                          application_method: (fd.get('application_method') as string) || null,
                          required_tests: (fd.get('required_tests') as string) || null,
                          portal_link: (fd.get('portal_link') as string) || null,
                          notes: (fd.get('notes') as string) || null,
                          status: 'draft' as const,
                        };
                        const { error } = await supabase.from('applications').insert([payload]);
                        if (error) {
                          toast({ title: 'Error', description: error.message, variant: 'destructive' });
                        } else {
                          toast({ title: 'Success', description: 'Application added' });
                          setShowAddAppDialog(false);
                          studentQuery.refetch();
                        }
                      }} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">University Name *</Label>
                            <Input name="university_name" required className="h-9 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Program Name *</Label>
                            <Input name="program_name" required className="h-9 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">IELTS</Label>
                            <Input name="ielts_requirement" className="h-9 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">German</Label>
                            <Input name="german_requirement" className="h-9 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Fees (EUR)</Label>
                            <Input name="fees_eur" type="number" className="h-9 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Method</Label>
                            <Input name="application_method" placeholder="Uni-assist, Direct..." className="h-9 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Start Date</Label>
                            <Input name="application_start_date" type="date" className="h-9 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">End Date</Label>
                            <Input name="application_end_date" type="date" className="h-9 text-sm" />
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <Label className="text-xs">Portal Link</Label>
                            <Input name="portal_link" type="url" className="h-9 text-sm" />
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <Label className="text-xs">Notes</Label>
                            <Textarea name="notes" className="min-h-[80px] text-sm" />
                          </div>
                        </div>
                        <div className="flex flex-row gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowAddAppDialog(false)} className="flex-1 h-9 text-sm">Cancel</Button>
                          <Button type="submit" className="flex-1 h-9 text-sm">Add</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" onClick={() => studentQuery.refetch()} className="w-9 h-8 p-0">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {student.applications && student.applications.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {sortApplications(student.applications).map((app: any) => (
                    <div key={app.id} className="relative group">
                      <div className="absolute right-2 top-2 z-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm(`Delete application for ${app.university_name}?`)) return;
                            const { error } = await supabase.from('applications').delete().eq('id', app.id);
                            if (error) {
                              toast({ title: 'Error', description: error.message, variant: 'destructive' });
                            } else {
                              toast({ title: 'Deleted', description: 'Application removed' });
                              studentQuery.refetch();
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <ApplicationCredentialsCard 
                        application={app}
                        onUpdate={() => studentQuery.refetch()}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-sm">No applications found</p>
                    <p className="text-xs mt-1">Add them using the button above or Excel upload</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6 mt-2">

          {/* Required Documents (Excel-style table for mobile) */}
          <Card className="overflow-hidden border-none sm:border shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-6 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  Required Documents
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={fetchStudentProfile} className="h-8 px-2 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                    <tr>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[140px]">Document Name</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 text-center">Status</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {DOCUMENTS.map((d) => {
                      const doc = (student.documents || []).find((x) => x.category === d.key);
                      const status = (doc as any)?.status || 'missing';
                      return (
                        <tr key={d.key} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 sm:px-4 sm:py-3">
                            <p className="font-medium text-foreground line-clamp-1">{d.label.replace('📄 ', '')}</p>
                            {doc && <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{doc.file_name}</p>}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                            <Badge 
                              variant={status === 'approved' ? 'secondary' : status === 'rejected' ? 'destructive' : status === 'missing' ? 'outline' : 'default'}
                              className={`text-[9px] px-1.5 py-0 capitalize ${status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : ''}`}
                            >
                              {status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                            {doc ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => viewDocument(doc as any)} className="h-7 w-7 p-0">
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Select value={(doc as any).status || 'pending'} onValueChange={(v: any) => updateDocumentStatus((doc as any).id, v)}>
                                  <SelectTrigger className="w-[30px] h-7 p-0 border-none bg-transparent focus:ring-0">
                                    <SelectValue>
                                      <RefreshCw className="h-3 w-3 text-muted-foreground" />
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent align="end">
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approve</SelectItem>
                                    <SelectItem value="rejected">Reject</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Additional Documents (Excel-style table) */}
          <Card className="overflow-hidden border-none sm:border shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-6 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Additional Documents ({student.documents?.filter((d: any) => d.module === 'additional_documents').length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                    <tr>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[140px]">Document Name</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 text-center">Status</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {student.documents && student.documents.filter((d: any) => d.module === 'additional_documents').length > 0 ? (
                      student.documents.filter((d: any) => d.module === 'additional_documents').map((doc: any) => (
                        <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 sm:px-4 sm:py-3">
                            <p className="font-medium text-foreground line-clamp-1">{doc.file_name}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                            <Badge 
                              variant={doc.status === 'approved' ? 'secondary' : doc.status === 'rejected' ? 'destructive' : 'outline'}
                              className={`text-[9px] px-1.5 py-0 capitalize ${doc.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : ''}`}
                            >
                              {doc.status || 'pending'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  const { data } = await supabase.storage
                                    .from('documents')
                                    .createSignedUrl(doc.upload_path, 300);
                                  if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Eye className="h-3.5 w-3.5" />
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
                                    toast({ title: 'Status Updated', description: `Document ${value}` });
                                    await studentQuery.refetch();
                                  } catch (error: any) {
                                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[30px] h-7 p-0 border-none bg-transparent focus:ring-0">
                                  <SelectValue>
                                    <RefreshCw className="h-3 w-3 text-muted-foreground" />
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent align="end">
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="approved">Approve</SelectItem>
                                  <SelectItem value="rejected">Reject</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground text-xs">
                          No additional documents uploaded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-2">
            {studentId && (
              <StudentNotes studentId={studentId} readOnly />
            )}
          </TabsContent>

          {/* Profile Tab - Full Details */}
          <TabsContent value="profile" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Full Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Intake: {(student as any).intake || 'Not provided'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab - Personal Email Panel */}
          <TabsContent value="email" className="mt-2">
            <PersonalEmailPanel 
              studentId={studentId || ''} 
              studentName={student.full_name || 'Student'} 
              studentEmail={email} 
            />
          </TabsContent>

          {/* Services Tab (Excel-style table) */}
          <TabsContent value="services" className="mt-2">
            <Card className="overflow-hidden border-none sm:border shadow-sm">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-6 bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                  Service Requests ({student.service_requests?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                      <tr>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[140px]">Service</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-center">Price</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {student.service_requests && student.service_requests.length > 0 ? (
                        student.service_requests.map((req) => (
                          <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2 sm:px-4 sm:py-3">
                              <p className="font-medium text-foreground line-clamp-1">{req.service_type}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                              <p className="font-medium whitespace-nowrap">{req.service_price} {req.service_currency}</p>
                            </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                              <Badge variant={
                                req.status === 'in_review' ? 'secondary' :
                                req.status === 'payment_pending' ? 'default' :
                                req.status === 'new' ? 'outline' : 'secondary'
                              } className="text-[9px] px-1.5 py-0 capitalize">
                                {req.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground text-xs">
                            No service requests found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab (Excel-style table) */}
          <TabsContent value="contracts" className="mt-2">
            <Card className="overflow-hidden border-none sm:border shadow-sm">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-6 bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                    <ScrollText className="h-4 w-4 sm:h-5 sm:w-5" />
                    Service Contracts ({contracts.length})
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={fetchContracts} className="h-8 px-2 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                      <tr>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[140px]">Contract Ref</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-center">Fee</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {contracts.length > 0 ? (
                        contracts.map((contract) => (
                          <tr key={contract.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2 sm:px-4 sm:py-3">
                              <p className="font-medium text-foreground line-clamp-1">{contract.contract_reference}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{contract.service_package || 'No Package'}</p>
                              {contract.signed_document_url && (
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
                                  className="text-primary hover:underline text-[9px] flex items-center gap-1 mt-1"
                                >
                                  Download <Download className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                              <p className="font-medium whitespace-nowrap">₹{contract.service_fee || 0}</p>
                            </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant={
                                  contract.status === 'draft' ? 'secondary' :
                                  contract.status === 'sent' ? 'outline' :
                                  contract.status === 'signed' ? 'default' : 'default'
                                } className="text-[9px] px-1.5 py-0 capitalize whitespace-nowrap">
                                  {contract.status === 'signed' ? 'Awaiting Appr.' : contract.status}
                                </Badge>
                                {contract.status === 'signed' && (
                                  <div className="flex gap-1 mt-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => updateContractStatus(contract.id, 'completed')}
                                      className="h-6 w-6 p-0 text-green-600"
                                      title="Approve"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => updateContractStatus(contract.id, 'rejected')}
                                      className="h-6 w-6 p-0 text-destructive"
                                      title="Reject"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground text-xs">
                            No contracts found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
}
