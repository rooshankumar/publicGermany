import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
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
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { MultiFileUpload } from '@/components/MultiFileUpload';
import { Database } from '@/integrations/supabase/types';
import { sendEmail } from '@/lib/sendEmail';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'] & {
  profiles?: any;
  deliverable_url?: string | null;
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

export default function Requests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [deliverableUploading, setDeliverableUploading] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [pendingDeliverableFiles, setPendingDeliverableFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<Array<{ name: string; url: string }>>([]);
  const { toast } = useToast();

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    fetchRequests();
    
    // Real-time subscription
    const channel = supabase
      .channel('service-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, debouncedSearch, statusFilter, serviceFilter]);

  const resolveEmail = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await (supabase as any).rpc('get_user_email', { p_user_id: userId });
      if (!error && data) return data as string;
      return null;
    } catch {
      return null;
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          profiles:profiles!inner(user_id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const withEmails = await Promise.all((data || []).map(async (request: any) => {
        const email = await resolveEmail(request?.profiles?.user_id);
        return { ...request, profiles: { ...request.profiles, email } };
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

  const filterRequests = () => {
    let filtered = requests;

    const q = (debouncedSearch || '').toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(req => 
        (req.profiles?.full_name || '').toLowerCase().includes(q) ||
        (req.profiles?.email || '').toLowerCase().includes(q) ||
        (req.service_type || '').toLowerCase().includes(q) ||
        (req.request_details || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(req => req.service_type === serviceFilter);
    }

    setFilteredRequests(filtered);
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
      
      // Store deliverable URLs in the database but don't include them in the admin response
      if (uploadedUrls.length > 0) {
        updates.deliverable_urls = uploadedUrls; // Store all URLs
        (updates as any).deliverable_url = uploadedUrls[0]; // Keep for backward compatibility
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
      // Add in-app notification for the student (bell)
      try {
        const req = requests.find(r => r.id === requestId);
        const userId = req?.profiles?.user_id;
        if (userId) {
          const title = `Service request ${req?.service_type || ''} → ${status}`.trim();
          await (supabase as any).from('notifications').insert({ user_id: userId, title, type: 'service_request', ref_id: requestId });
        }
      } catch {}

      // Fire-and-forget: email the student about the status/response update
      try {
        const req = requests.find(r => r.id === requestId);
        const userId = req?.profiles?.user_id;
        const to = userId ? await resolveEmail(userId) : null;
        if (to) {
          const lines: string[] = [];
          const prettyStatus = (status || '').replace('_', ' ');
          const studentName = (req as any)?.profiles?.full_name || '';
          lines.push(`<p>Hi ${studentName || 'there'},</p>`);
          lines.push(`<p>Your service request <strong>${req?.service_type || ''}</strong> status is now <strong>${prettyStatus}</strong>.</p>`);
          
          if (response) {
            // Remove any Supabase storage URLs from the admin response
            const cleanResponse = response.replace(/https:\/\/[^/]+\.supabase\.co\/storage\/.*?(?=\s|$)/g, '').replace(/\n\s*\n/g, '\n').trim();
            if (cleanResponse) {
              lines.push(`<p><strong>Admin response:</strong><br/>${cleanResponse.replace(/\n/g, '<br/>')}</p>`);
            }
          }

          if (status === 'completed' && uploadedUrls.length > 0) {
            const baseUrl = `${process.env.VITE_APP_URL || window.location.origin}`;
            const styles = {
              button: 'display:inline-block;padding:12px 20px;background:#0066CC;color:#ffffff;text-decoration:none;border-radius:6px;margin:8px 0;text-align:center;font-weight:500;box-shadow:0 2px 4px rgba(0,0,0,0.1);width:100%;box-sizing:border-box;',
              container: 'margin:24px 0;padding:20px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;',
              heading: 'margin:0 0 16px 0;color:#1a1a1a;font-size:16px;font-weight:500;',
              fileContainer: 'display:flex;flex-direction:column;gap:12px;',
              notice: 'margin-top:20px;padding:12px;background:#e7f5ff;border-radius:6px;border:1px solid #74c0fc;color:#1864ab;font-size:14px;'
            };

            lines.push(`<div style="${styles.container}">`);
            lines.push(`<h3 style="${styles.heading}">📎 Your documents are ready</h3>`);
            lines.push(`<div style="${styles.fileContainer}">`);
            
            // Add secure download buttons for each file
            uploadedUrls.forEach((url, index) => {
              const fileName = url.split('/').pop()?.replace(/^\d+-/, '') || `Document ${index + 1}`;
              const secureDownloadUrl = `${baseUrl}/api/download?requestId=${requestId}&fileIndex=${index}`;
              
              lines.push(`
                <a href="${secureDownloadUrl}" 
                   style="${styles.button}"
                   target="_blank">
                  📥 Download ${fileName}
                </a>
              `);
            });
            
            lines.push(`</div>`);
            
            // Add security notice and dashboard backup
            lines.push(`
              <div style="${styles.notice}">
                <p style="margin:0 0 8px 0;">
                  🔒 For your security:
                  <br>• Download links require authentication
                  <br>• Links expire after 24 hours for safety
                </p>
                <p style="margin:0;">
                  You can always access your documents from your 
                  <a href="${baseUrl}/dashboard" 
                     style="color:#0066CC;font-weight:500;text-decoration:underline;">
                    dashboard
                  </a>
                </p>
              </div>
            </div>
            `);
          }
          
          lines.push(`<p>— publicGermany Team</p>`);
          await sendEmail(to, 'Service request update', lines.join('\n'));
        }
      } catch {}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Service Requests Management</h1>
            <p className="text-muted-foreground">Track and manage all student service requests with live updates</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by student name, service type, or details..."
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
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="cv_review">CV Review</SelectItem>
                  <SelectItem value="sop_writing">SOP Writing</SelectItem>
                  <SelectItem value="uni_selection">University Selection</SelectItem>
                  <SelectItem value="visa_guidance">Visa Guidance</SelectItem>
                  <SelectItem value="aps_help">APS Help</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredRequests.length} of {requests.length} requests
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Service Requests ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <InlineLoader label="Loading requests" />
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No requests found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Student</th>
                      <th className="text-left p-3 font-medium">Service Type</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Timeline</th>
                      <th className="text-left p-3 font-medium">Price</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              {(() => {
                                const email: string | undefined = (request as any).profiles?.email;
                                const inferred = email ? email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase()) : '';
                                const name = (request as any).profiles?.full_name || inferred || 'Unknown Student';
                                return (
                                  <>
                                    <p className="font-medium truncate max-w-[180px] md:max-w-[240px]">{name}</p>
                                    <p className="text-sm text-muted-foreground truncate max-w-[220px]">
                                      {email || 'No email'}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {request.service_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
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
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={async () => {
                                setSelectedRequest(request);
                                setAdminResponse(request.admin_response || '');
                                setPendingStatus(request.status);
                                setDeliverableUrl(request.deliverable_url || null);
                                
                                // Load existing files for this request
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Management Modal/Panel */}
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
                    <strong>Student:</strong> {selectedRequest.profiles?.full_name}
                  </p>
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
                            // Extract file path from URL to delete from storage
                            const urlPath = url.split('/').slice(-2).join('/');
                            await supabase.storage.from('documents').remove([urlPath]);
                            setExistingFiles(files => files.filter(f => f.url !== url));
                            toast({ title: 'File removed', description: 'File deleted successfully' });
                          } catch (e) {
                            toast({ title: 'Error', description: 'Failed to remove file', variant: 'destructive' });
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
