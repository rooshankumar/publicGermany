import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { MultiFileUpload } from '@/components/MultiFileUpload';
import { Database } from '@/integrations/supabase/types';
import { sendEmail } from '@/lib/sendEmail';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'] & {
  profiles?: any;
  deliverable_url?: string | null;
};

export default function StudentRequests() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<{ name: string; email: string } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [deliverableUploading, setDeliverableUploading] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [pendingDeliverableFiles, setPendingDeliverableFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<Array<{ name: string; url: string }>>([]);
  const { toast } = useToast();

  const resolveEmail = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await (supabase as any).rpc('get_user_email', { p_user_id: userId });
      if (!error && data) return data as string;
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchRequests();
      
      // Real-time subscription
      const channel = supabase
        .channel('student-requests-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
          fetchRequests();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [studentId]);

  const fetchRequests = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          profiles:profiles!inner(user_id, full_name)
        `)
        .eq('user_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get email for this student
      const email = await resolveEmail(studentId);
      const name = data?.[0]?.profiles?.full_name || 'Unknown Student';
      setStudentInfo({ name, email: email || '' });
      
      const withEmails = data?.map((request: any) => ({
        ...request,
        profiles: { ...request.profiles, email }
      }));
      
      setRequests(withEmails as any);
    } catch (error: any) {
      toast({
        title: "Error fetching requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRequestChanges = async (requestId: string, status: string, response?: string) => {
    try {
      // Upload multiple files if selected
      let uploadedUrls: string[] = [];
      if (pendingDeliverableFiles.length > 0 && selectedRequest) {
        setDeliverableUploading(true);
        
        for (const file of pendingDeliverableFiles) {
          const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const path = `service_requests/${selectedRequest.id}/${safeName}`;
          const { error: uploadErr } = await supabase.storage
            .from('documents')
            .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
          if (uploadErr) throw uploadErr;
          
          const { data: publicData } = supabase.storage.from('documents').getPublicUrl(path);
          uploadedUrls.push(publicData.publicUrl);
        }
      }

      const updates: any = { status };
      if (response) updates.admin_response = response;
      
      // Get all existing files from storage to save complete list
      let allFileUrls: string[] = [...uploadedUrls];
      if (selectedRequest) {
        try {
          const { data: storageFiles } = await supabase.storage
            .from('documents')
            .list(`service_requests/${selectedRequest.id}`, { limit: 20 });
          
          if (storageFiles && storageFiles.length > 0) {
            const existingUrls = storageFiles.map(file => {
              const { data: publicUrl } = supabase.storage
                .from('documents')
                .getPublicUrl(`service_requests/${selectedRequest.id}/${file.name}`);
              return publicUrl.publicUrl;
            });
            allFileUrls = [...new Set([...uploadedUrls, ...existingUrls])];
          }
        } catch (e) {
          console.error('Error fetching files for database update:', e);
        }
      }
      
      if (allFileUrls.length > 0) {
        updates.deliverable_urls = allFileUrls;
        updates.deliverable_url = allFileUrls[0];
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      toast({ title: "Request updated", description: "Changes saved successfully" });
      
      setSelectedRequest(null);
      setAdminResponse('');
      setDeliverableUrl(null);
      setPendingDeliverableFiles([]);
      setExistingFiles([]);
      fetchRequests();
      
      // Add in-app notification
      try {
        const req = requests.find(r => r.id === requestId);
        const userId = req?.profiles?.user_id;
        if (userId) {
          const title = `Service request ${req?.service_type || ''} → ${status}`.trim();
          await (supabase as any).from('notifications').insert({ user_id: userId, title, type: 'service_request', ref_id: requestId });
        }
      } catch {}

      // Email notification
      try {
        const req = requests.find(r => r.id === requestId);
        const userId = req?.profiles?.user_id;
        const to = userId ? await resolveEmail(userId) : null;
        if (to) {
          let allDeliverableUrls = [...uploadedUrls];
          if (selectedRequest) {
            try {
              const { data: storageFiles } = await supabase.storage
                .from('documents')
                .list(`service_requests/${selectedRequest.id}`, { limit: 20 });
              
              if (storageFiles && storageFiles.length > 0) {
                const existingUrls = storageFiles.map(file => {
                  const { data: publicUrl } = supabase.storage
                    .from('documents')
                    .getPublicUrl(`service_requests/${selectedRequest.id}/${file.name}`);
                  return publicUrl.publicUrl;
                });
                allDeliverableUrls = [...new Set([...uploadedUrls, ...existingUrls])];
              }
            } catch (e) {
              console.error('Error fetching existing files for email:', e);
            }
          }

          const lines: string[] = [];
          const prettyStatus = (status || '').replace(/_/g, ' ');
          const studentName = (req as any)?.profiles?.full_name || '';
          const serviceType = (req?.service_type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          const contentParts: string[] = [];
          contentParts.push(`Your service request <strong>${serviceType}</strong> status is now <strong>${prettyStatus}</strong>.`);
          
          if (response) {
            const cleanResponse = response.replace(/https:\/\/[^/]+\.supabase\.co\/storage\/.*?(?=\s|$)/g, '').replace(/\n\s*\n/g, '\n').trim();
            if (cleanResponse) {
              contentParts.push(`<br/><br/><strong>Admin response:</strong><br/>${cleanResponse.replace(/\n/g, '<br/>')}`);
            }
          }

          if (status === 'completed' && allDeliverableUrls.length > 0) {
            const baseUrl = 'https://publicgermany.vercel.app';
            contentParts.push(`<br/><br/><strong>Your documents are ready!</strong><br/>Visit your <a href="${baseUrl}/services" style="color: #0066cc;">Services page</a> to download them.`);
          }
          
          const { wrapInEmailTemplate, getPersonalizedGreeting, signOffs } = await import('@/lib/emailTemplate');
          const emailHtml = wrapInEmailTemplate(contentParts.join(''), {
            customGreeting: getPersonalizedGreeting(studentName),
            signOff: signOffs.team
          });
          
          await sendEmail(to, 'Service request update', emailHtml);
        }
      } catch (emailError: any) {
        toast({
          title: "Email notification failed",
          description: `Could not send email: ${emailError.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error updating request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeliverableUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-primary/10 text-primary';
      case 'in_progress': return 'bg-warning/10 text-warning';
      case 'completed': return 'bg-success/10 text-success';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (timeline: string) => {
    if (timeline?.includes('urgent') || timeline?.includes('ASAP')) {
      return 'text-destructive';
    }
    if (timeline?.includes('week')) {
      return 'text-warning';
    }
    return 'text-muted-foreground';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/requests')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Students
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{studentInfo?.name || 'Student'} - Service Requests</h1>
            <p className="text-muted-foreground">{studentInfo?.email}</p>
          </div>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Service Requests ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <InlineLoader label="Loading requests" />
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No requests found for this student</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Service Type</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Timeline</th>
                      <th className="text-left p-3 font-medium">Price</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <Badge variant="outline">
                            {request.service_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(request.status)}
                            {request.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className={`text-sm ${getPriorityColor(request.preferred_timeline)}`}>
                            {request.preferred_timeline || 'No timeline set'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-medium">
                            {request.service_price ? 
                              `${request.service_currency || 'INR'} ${request.service_price}` : 
                              'Not set'
                            }
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              setSelectedRequest(request);
                              setAdminResponse(request.admin_response || '');
                              setPendingStatus(request.status);
                              setDeliverableUrl(request.deliverable_url || null);
                              
                              // Load existing files
                              try {
                                const { data, error } = await supabase.storage
                                  .from('documents')
                                  .list(`service_requests/${request.id}`, { limit: 10 });
                                
                                if (!error && data) {
                                  const files = data.map(file => {
                                    const { data: publicUrl } = supabase.storage
                                      .from('documents')
                                      .getPublicUrl(`service_requests/${request.id}/${file.name}`);
                                    return {
                                      name: file.name,
                                      url: publicUrl.publicUrl
                                    };
                                  });
                                  setExistingFiles(files);
                                }
                              } catch (e) {
                                console.error('Error loading existing files:', e);
                              }
                            }}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Management Panel */}
        {selectedRequest && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Request - {selectedRequest.service_type?.replace('_', ' ')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Request Details</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Service:</strong> {selectedRequest.service_type}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Timeline:</strong> {selectedRequest.preferred_timeline}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Details:</strong> {selectedRequest.request_details}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Update Status</h4>
                  <div className="space-y-3">
                    <Select 
                      value={pendingStatus}
                      onValueChange={setPendingStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Add admin response or notes..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Deliverable Files</label>
                      <MultiFileUpload
                        onFilesSelected={setPendingDeliverableFiles}
                        maxFiles={5}
                        existingFiles={existingFiles}
                        onRemoveExisting={async (url) => {
                          try {
                            const urlParts = url.split('/documents/');
                            if (urlParts.length < 2) {
                              throw new Error('Invalid URL format');
                            }
                            const filePath = urlParts[1];
                            
                            const { error } = await supabase.storage.from('documents').remove([filePath]);
                            if (error) throw error;
                            
                            setExistingFiles(files => files.filter(f => f.url !== url));
                            toast({ title: 'File removed', description: 'File deleted successfully' });
                          } catch (e: any) {
                            toast({ title: 'Error', description: e.message || 'Failed to remove file', variant: 'destructive' });
                          }
                        }}
                      />
                      {deliverableUploading && (
                        <p className="text-xs text-muted-foreground">Uploading files...</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload final documents that the student can access after completion
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => saveRequestChanges(selectedRequest.id, pendingStatus || selectedRequest.status, adminResponse)}
                      >
                        Save Response
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedRequest(null);
                          setAdminResponse('');
                          setPendingStatus('');
                          setDeliverableUrl(null);
                          setPendingDeliverableFiles([]);
                          setExistingFiles([]);
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
