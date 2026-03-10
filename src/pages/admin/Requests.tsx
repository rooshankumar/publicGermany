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
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  MessageSquare,
  RefreshCw,
  Eye,
  Loader2
} from 'lucide-react';
import { MultiFileUpload } from '@/components/MultiFileUpload';
import { Database } from '@/integrations/supabase/types';
import { sendEmail } from '@/lib/sendEmail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'] & {
  profiles?: any;
  deliverable_url?: string | null;
};

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
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [pendingDeliverableFiles, setPendingDeliverableFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<Array<{ name: string; url: string }>>([]);
  const { toast } = useToast();

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    fetchRequests();
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
      toast({ title: "Error fetching requests", description: error.message, variant: "destructive" });
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
    if (statusFilter !== 'all') filtered = filtered.filter(req => req.status === statusFilter);
    if (serviceFilter !== 'all') filtered = filtered.filter(req => req.service_type === serviceFilter);
    setFilteredRequests(filtered);
  };

  const saveRequestChanges = async (requestId: string, status: string, response?: string) => {
    try {
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
        } catch (e) { console.error(e); }
      }
      if (allFileUrls.length > 0) {
        updates.deliverable_urls = allFileUrls;
        updates.deliverable_url = allFileUrls[0];
      }

      const { error } = await supabase.from('service_requests').update(updates).eq('id', requestId);
      if (error) throw error;

      toast({ title: "Request updated", description: "Changes saved successfully" });
      setSelectedRequest(null);
      setAdminResponse('');
      setPendingDeliverableFiles([]);
      setExistingFiles([]);
      fetchRequests();

      try {
        const req = requests.find(r => r.id === requestId);
        const userId = req?.profiles?.user_id;
        if (userId) {
          const title = `Service request ${req?.service_type || ''} → ${status}`.trim();
          await (supabase as any).from('notifications').insert({ user_id: userId, title, type: 'service_request', ref_id: requestId });
        }
      } catch {}

      try {
        const req = requests.find(r => r.id === requestId);
        const userId = req?.profiles?.user_id;
        const to = userId ? await resolveEmail(userId) : null;
        if (to) {
          const prettyStatus = (status || '').replace(/_/g, ' ');
          const studentName = (req as any)?.profiles?.full_name || '';
          const serviceType = (req?.service_type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const contentParts = [`Your service request <strong>${serviceType}</strong> status is now <strong>${prettyStatus}</strong>.`];
          if (response) {
            const cleanResponse = response.replace(/https:\/\/[^/]+\.supabase\.co\/storage\/.*?(?=\s|$)/g, '').trim();
            if (cleanResponse) contentParts.push(`<br/><br/><strong>Admin response:</strong><br/>${cleanResponse.replace(/\n/g, '<br/>')}`);
          }
          if (status === 'completed' && allFileUrls.length > 0) {
            contentParts.push(`<br/><br/><strong>Your documents are ready!</strong><br/>Visit your <a href="https://publicgermany.vercel.app/services" style="color: #0066cc;">Services page</a> to download them.`);
          }
          const { wrapInEmailTemplate, getPersonalizedGreeting, signOffs } = await import('@/lib/emailTemplate');
          const emailHtml = wrapInEmailTemplate(contentParts.join(''), { customGreeting: getPersonalizedGreeting(studentName), signOff: signOffs.team });
          await sendEmail(to, 'Service request update', emailHtml);
        }
      } catch (emailError) { console.error(emailError); }
    } catch (error: any) {
      toast({ title: "Error updating request", description: error.message, variant: "destructive" });
    } finally { setDeliverableUploading(false); }
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

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Service Requests</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Track and manage student service requests</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" /> Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            <div className="flex flex-col gap-3">
              <Input placeholder="Search name, service..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 text-sm w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="cv_review">CV Review</SelectItem>
                    <SelectItem value="sop_writing">SOP Writing</SelectItem>
                    <SelectItem value="uni_selection">Uni Selection</SelectItem>
                    <SelectItem value="visa_guidance">Visa Guidance</SelectItem>
                    <SelectItem value="aps_help">APS Help</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none sm:border shadow-sm">
          <CardHeader className="px-4 py-3 bg-muted/30">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center justify-between">
              <span>Requests ({filteredRequests.length})</span>
              <Button size="sm" variant="ghost" onClick={fetchRequests} className="h-8 w-8 p-0"><RefreshCw className="h-4 w-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /><p className="text-sm">Loading requests...</p></div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12"><MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No requests found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                    <tr><th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[140px]">Student / Service</th><th className="px-3 py-2 sm:px-4 sm:py-3 text-center">Status</th><th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 sm:px-4 sm:py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0"><User className="h-3.5 w-3.5 text-primary" /></div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground line-clamp-1">{request.profiles?.full_name || 'Unknown'}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 capitalize">{(request.service_type || '').split('_').join(' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                          <Badge className={`${getStatusColor(request.status)} text-[9px] px-1.5 py-0 border-none capitalize whitespace-nowrap`}>{request.status?.split('_').join(' ')}</Badge>
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                            setSelectedRequest(request); setAdminResponse(request.admin_response || ''); setPendingStatus(request.status); setExistingFiles(request.deliverable_files || []);
                          }}><Eye className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedRequest && (
          <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
              <DialogHeader><DialogTitle className="text-base sm:text-lg">Respond to Request</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Student</Label><p className="text-sm font-medium">{selectedRequest.profiles?.full_name}</p><p className="text-xs text-muted-foreground">{selectedRequest.profiles?.email}</p></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Service</Label><p className="text-sm font-medium capitalize">{(selectedRequest.service_type || '').split('_').join(' ')}</p><p className="text-xs text-muted-foreground">{selectedRequest.service_price} {selectedRequest.service_currency}</p></div>
                </div>
                <div className="space-y-2"><Label className="text-xs font-semibold">Update Status</Label>
                  <Select value={pendingStatus || selectedRequest.status} onValueChange={setPendingStatus}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="payment_pending">Payment Pending</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-xs font-semibold">Admin Response</Label><Textarea value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} placeholder="Write your response to the student..." className="min-h-[100px] text-sm" /></div>
                <div className="space-y-2"><Label className="text-xs font-semibold">Deliverable Files</Label>
                  <MultiFileUpload onFilesSelected={setPendingDeliverableFiles} maxFiles={5} existingFiles={existingFiles} onRemoveExisting={async (url) => {
                    try {
                      const urlParts = url.split('/documents/');
                      if (urlParts.length < 2) throw new Error('Invalid URL format');
                      const filePath = urlParts[1];
                      const { error } = await supabase.storage.from('documents').remove([filePath]);
                      if (error) throw error;
                      setExistingFiles(files => files.filter(f => f.url !== url));
                      toast({ title: 'File removed', description: 'File deleted successfully' });
                    } catch (e: any) { toast({ title: 'Error', description: e.message || 'Failed to remove file', variant: 'destructive' }); }
                  }} />
                  {deliverableUploading && <p className="text-xs text-muted-foreground">Uploading files...</p>}
                  <p className="text-[10px] text-muted-foreground">Upload final documents that the student can access after completion.</p>
                </div>
                <div className="flex gap-2 pt-4"><Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setSelectedRequest(null)}>Cancel</Button><Button className="flex-1 h-9 text-sm" onClick={() => saveRequestChanges(selectedRequest.id, pendingStatus || selectedRequest.status, adminResponse)}>Save Response</Button></div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
