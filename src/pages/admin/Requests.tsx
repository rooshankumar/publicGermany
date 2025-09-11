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
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'] & {
  profiles?: any;
};

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
  const { toast } = useToast();

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
  }, [requests, searchTerm, statusFilter, serviceFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          profiles!service_requests_user_id_fkey(full_name, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any[]) || []);
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

    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.request_details?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const updateRequestStatus = async (requestId: string, status: string, response?: string) => {
    try {
      const updates: any = { status };
      if (response) updates.admin_response = response;
      if (deliverableUrl) {
        // Prefer dedicated column if present
        (updates as any).deliverable_url = deliverableUrl;
        // Also include link in admin_response for compatibility
        updates.admin_response = [response || '', `Deliverable: ${deliverableUrl}`].filter(Boolean).join('\n');
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request updated",
        description: "Request status updated successfully",
      });
      
      setSelectedRequest(null);
      setAdminResponse('');
      setDeliverableUrl(null);
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error updating request",
        description: error.message,
        variant: "destructive",
      });
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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading requests...</p>
              </div>
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
                              <p className="font-medium truncate max-w-[180px] md:max-w-[240px]">{request.profiles?.full_name || 'Unknown Student'}</p>
                              <p className="text-sm text-muted-foreground">
                                ID: {request.profiles?.user_id?.slice(0, 8)}...
                              </p>
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
                              onClick={() => {
                                setSelectedRequest(request);
                                setAdminResponse(request.admin_response || '');
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
                      value={selectedRequest.status}
                      onValueChange={(status) => updateRequestStatus(selectedRequest.id, status)}
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
                      <label className="text-sm font-medium">Final Document (Optional)</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !selectedRequest) return;
                          try {
                            setDeliverableUploading(true);
                            const { data: { user } } = await supabase.auth.getUser();
                            const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                            const path = `service_requests/${selectedRequest.id}/${safeName}`;
                            const { error: uploadErr } = await supabase.storage
                              .from('documents')
                              .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
                            if (uploadErr) throw uploadErr;
                            const { data: publicData } = supabase.storage.from('documents').getPublicUrl(path);
                            const url = publicData.publicUrl;
                            setDeliverableUrl(url);
                            // Immediately persist to DB so student UI can pick it up
                            const currentResponse = adminResponse || selectedRequest.admin_response || '';
                            const combinedResponse = [currentResponse, `Deliverable: ${url}`].filter(Boolean).join('\n');
                            await (supabase as any)
                              .from('service_requests')
                              .update({ deliverable_url: url, admin_response: combinedResponse })
                              .eq('id', selectedRequest.id);
                            toast({ title: 'Deliverable uploaded', description: 'Final document attached to request.' });
                            // Refresh requests to reflect change
                            fetchRequests();
                          } catch (err: any) {
                            toast({ title: 'Upload failed', description: err?.message || 'Could not upload file', variant: 'destructive' });
                          } finally {
                            setDeliverableUploading(false);
                          }
                        }}
                        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {deliverableUploading && (
                        <p className="text-xs text-muted-foreground">Uploading...</p>
                      )}
                      {deliverableUrl && (
                        <div className="text-xs">
                          <a href={deliverableUrl} target="_blank" rel="noreferrer" className="underline">View uploaded deliverable</a>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload a final document that the student can access after completion
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => updateRequestStatus(selectedRequest.id, selectedRequest.status, adminResponse)}
                      >
                        Save Response
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedRequest(null);
                          setAdminResponse('');
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
