import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  FileText, 
  Download,
  Package,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/lib/sendEmail';
import { useAuth } from '@/hooks/useAuth';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price_inr: number | null;
  price_range_inr: string | null;
  is_active: boolean;
  kind: string;
  created_at: string;
  updated_at: string;
}

interface ServiceRequest {
  id: string;
  service_type: string;
  service_price: number;
  service_currency: string;
  request_details: string | null;
  preferred_timeline: string | null;
  status: 'new' | 'in_review' | 'payment_pending' | 'in_progress' | 'completed';
  admin_response?: string | null;
  deliverable_urls?: string[] | null;
  created_at: string;
}

const ServicesNew = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [packageRequestName, setPackageRequestName] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string>('');
  const [requestDetails, setRequestDetails] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Fetch services catalog
  const catalogQuery = useQuery({
    queryKey: ['services-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_catalog')
        .select('*')
        .eq('is_active', true)
        .order('price_inr', { ascending: true });
      if (error) throw error;
      return (data || []) as Service[];
    },
  });

  // Fetch user's service requests with payment data
  const requestsQuery = useQuery({
    queryKey: ['my-service-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service_payments (
            id, amount, currency, status, paid_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    },
    enabled: !!user,
  });

  // Real-time subscription for service requests
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('service-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          requestsQuery.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, requestsQuery]);

  const services = catalogQuery.data || [];
  const packages = services.filter(s => s.kind === 'package');
  const individualServices = services.filter(s => s.kind === 'individual');
  const requests = requestsQuery.data || [];
  const completedRequests = requests.filter(r => r.status === 'completed');
  const activeRequests = requests; // Show ALL requests in My Requests tab

  // Filter services by search
  const filteredServices = individualServices.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleServiceSelection = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, serviceId]);
    } else {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    }
  };

  const calculateTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price_inr || 0);
    }, 0);
  };

  const getPackagePrice = () => {
    if (!packageRequestName) return 0;
    const pkg = packages.find(p => p.name === packageRequestName);
    // For packages, we'll use the minimum of the range or 0 if not specified
    // Admin will adjust the final price
    if (pkg?.price_inr) return pkg.price_inr;
    return 0;
  };

  const getTotalAmount = () => {
    const extrasTotal = calculateTotalPrice();
    const packagePrice = getPackagePrice();
    return extrasTotal + packagePrice;
  };

  const handleRequestSubmit = async () => {
    if (selectedServices.length === 0 && !packageRequestName) {
      toast({ title: "Error", description: "Please select at least one service or package", variant: "destructive" });
      return;
    }

    if (!timeline) {
      toast({ title: "Timeline required", description: "Please choose a preferred timeline", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    const selectedExtras = selectedServices.map(id => services.find(s => s.id === id)?.name).filter(Boolean) as string[];
    const serviceNames = packageRequestName
      ? [packageRequestName, ...(selectedExtras.length ? ["Extras: " + selectedExtras.join(', ')] : [])].join(' | ')
      : selectedExtras.join(', ');

    const totalAmount = getTotalAmount();

    try {
      const { error } = await supabase
        .from('service_requests')
        .insert([{
          user_id: user.id,
          service_type: serviceNames,
          service_price: totalAmount,
          service_currency: 'INR',
          request_details: requestDetails,
          preferred_timeline: timeline,
          status: 'new',
        }]);

      if (error) throw error;

      toast({ title: "Success", description: "Service request submitted successfully" });
      
      // Send emails
      try {
        const studentName = profile?.full_name || user.email?.split('@')[0] || 'Student';
        const studentEmail = user.email || '';
        const pkg = packages.find(p => p.name === packageRequestName);
        const priceInfo = packageRequestName && pkg?.price_range_inr
          ? `Package Range: ₹${pkg.price_range_inr}`
          : `Total: ₹${totalAmount.toLocaleString()}`;
        
        // Email to admin
        const adminEmailPromise = sendEmail(
          'publicgermany@outlook.com',
          'New Service Request',
          `<p>New service request from ${studentName}</p>
           <p><strong>Email:</strong> ${studentEmail}<br/>
           <strong>Services:</strong> ${serviceNames}<br/>
           <strong>${priceInfo}</strong><br/>
           ${selectedServices.length > 0 ? `<strong>Extras Total:</strong> ₹${calculateTotalPrice().toLocaleString()}<br/>` : ''}
           <strong>Timeline:</strong> ${timeline}</p>`
        );

        // Email to student
        const studentEmailPromise = studentEmail ? sendEmail(
          studentEmail,
          'Service Request Received',
          `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1C1C1C;">
             <p>Hi ${studentName},</p>
             <p>We've received your service request and our team will review it shortly.</p>
             <p><strong>Requested Services:</strong> ${serviceNames}<br/>
             <strong>${priceInfo}</strong><br/>
             <strong>Timeline:</strong> ${timeline}</p>
             <p style="margin-top:12px;color:#666">You can track your request status in the Services page.</p>
             <p>— publicGermany Team</p>
           </div>`
        ) : Promise.resolve();

        await Promise.allSettled([adminEmailPromise, studentEmailPromise]);
      } catch {}

      // Reset and close
      setSelectedServices([]);
      setPackageRequestName(null);
      setTimeline('');
      setRequestDetails('');
      setShowRequestDialog(false);
      requestsQuery.refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', requestId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Request deleted successfully' });
      requestsQuery.refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'new': { variant: 'outline', icon: Clock, color: 'text-blue-600' },
      'in_review': { variant: 'secondary', icon: AlertCircle, color: 'text-yellow-600' },
      'payment_pending': { variant: 'secondary', icon: Clock, color: 'text-orange-600' },
      'in_progress': { variant: 'default', icon: Clock, color: 'text-blue-600' },
      'completed': { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
    };
    const config = variants[status] || variants['new'];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getAllDeliverableUrls = (req: ServiceRequest): string[] => {
    const urls: string[] = [];
    if (req.deliverable_urls && Array.isArray(req.deliverable_urls)) {
      urls.push(...req.deliverable_urls);
    }
    return urls;
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const pathname = new URL(url).pathname;
      const last = pathname.substring(pathname.lastIndexOf('/') + 1);
      return decodeURIComponent(last) || 'download';
    } catch {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1] || 'download');
    }
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Services</h1>
          <p className="text-sm md:text-base text-muted-foreground">Explore our services and track your requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card>
            <CardContent className="pt-3 pb-3 md:pt-6 md:pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                  <p className="text-xl md:text-2xl font-bold">{requests.length}</p>
                </div>
                <Clock className="hidden md:block h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 md:pt-6 md:pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Done</p>
                  <p className="text-xl md:text-2xl font-bold">{completedRequests.length}</p>
                </div>
                <CheckCircle className="hidden md:block h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 md:pt-6 md:pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Files</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {completedRequests.reduce((sum, r) => sum + getAllDeliverableUrls(r).length, 0)}
                  </p>
                </div>
                <FileText className="hidden md:block h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Services</TabsTrigger>
            <TabsTrigger value="requests">
              My Requests {requests.length > 0 && `(${requests.length})`}
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Delivered {completedRequests.length > 0 && `(${completedRequests.length})`}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Browse Services */}
          <TabsContent value="browse" className="space-y-6">
            {/* Packages */}
            {packages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Service Packages
                  </CardTitle>
                  <CardDescription>Complete solutions for your needs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.map(pkg => (
                      <Card key={pkg.id} className="border-primary/20">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{pkg.name}</CardTitle>
                            {pkg.price_range_inr && (
                              <Badge variant="secondary">₹{pkg.price_range_inr}</Badge>
                            )}
                          </div>
                          <CardDescription>{pkg.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => {
                              setPackageRequestName(pkg.name);
                              setShowRequestDialog(true);
                            }}
                            className="w-full"
                          >
                            Request Package
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Individual Services
                </CardTitle>
                <CardDescription>Select one or more services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {filteredServices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No services found</p>
                ) : (
                  <div className="space-y-3">
                    {filteredServices.map(service => (
                      <Card 
                        key={service.id} 
                        className="border-border/60 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => handleServiceSelection(service.id, !selectedServices.includes(service.id))}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              <Checkbox
                                checked={selectedServices.includes(service.id)}
                                onCheckedChange={(checked) => {
                                  handleServiceSelection(service.id, checked as boolean);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <h3 className="font-semibold text-base">{service.name}</h3>
                                <Badge variant="secondary" className="flex-shrink-0">
                                  ₹{service.price_inr?.toLocaleString() || '—'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {selectedServices.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                    <div>
                      <p className="font-semibold">{selectedServices.length} service(s) selected</p>
                      <p className="text-sm text-muted-foreground">
                        Total: ₹{calculateTotalPrice().toLocaleString()}
                      </p>
                    </div>
                    <Button onClick={() => setShowRequestDialog(true)}>
                      Request Services
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: My Requests */}
          <TabsContent value="requests" className="space-y-3 md:space-y-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm md:text-base text-muted-foreground">No requests yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => document.querySelector('[value="browse"]')?.dispatchEvent(new Event('click', { bubbles: true }))}
                  >
                    Browse Services
                  </Button>
                </CardContent>
              </Card>
            ) : (
              requests.map(request => (
                <Card key={request.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base md:text-lg truncate">{request.service_type}</CardTitle>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">
                          Requested on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRequest(request.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {request.request_details && (
                      <div>
                        <p className="text-xs md:text-sm font-medium">Details:</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{request.request_details}</p>
                      </div>
                    )}
                    {request.preferred_timeline && (
                      <div>
                        <p className="text-xs md:text-sm font-medium">Timeline:</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{request.preferred_timeline}</p>
                      </div>
                    )}
                    {request.admin_response && (
                      <div className="bg-muted/50 p-2 md:p-3 rounded-lg">
                        <p className="text-xs md:text-sm font-medium mb-1">Admin Response:</p>
                        <p className="text-xs md:text-sm">{request.admin_response}</p>
                      </div>
                    )}
                    
                    {/* Payment Breakdown */}
                    {(() => {
                      const paymentsArr = ((request as any).service_payments || []) as Array<{ amount: number|null; status: string|null }>;
                      const receivedSum = paymentsArr
                        .filter((sp) => (sp?.status || '').toLowerCase() === 'received')
                        .reduce((acc, sp) => acc + (Number(sp?.amount) || 0), 0);
                      const totalTarget = Number(((request as any).target_total_amount ?? request.service_price) ?? 0);
                      const curr = (request as any).target_currency || request.service_currency || 'INR';
                      const remaining = Math.max(0, totalTarget - receivedSum);
                      
                      return (
                        <div className="mt-3 p-2 md:p-3 bg-muted/30 rounded-lg">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground mb-1">Total Amount</p>
                              <p className="font-semibold">{curr} {isNaN(totalTarget) ? '-' : totalTarget.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Paid</p>
                              <p className="font-semibold text-green-600">{curr} {receivedSum.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Remaining</p>
                              <p className="font-semibold text-orange-600">{curr} {remaining.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Delivered Files - Compact Version */}
                    {request.status === 'completed' && (() => {
                      const files = getAllDeliverableUrls(request);
                      if (files.length === 0) return null;
                      
                      return (
                        <div className="mt-3 p-2 md:p-3 bg-green-50/10 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <p className="text-xs md:text-sm font-medium text-green-700 dark:text-green-400">
                              {files.length} File{files.length > 1 ? 's' : ''} Delivered
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            {files.map((url, idx) => {
                              const fileName = getFileNameFromUrl(url);
                              return (
                                <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate font-medium">{fileName}</span>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-6 px-2 text-xs"
                                      onClick={async () => {
                                        try {
                                          const urlParts = url.split('/documents/');
                                          const filePath = urlParts.length > 1 ? urlParts[1] : url;
                                          const { data, error } = await supabase.storage
                                            .from('documents')
                                            .createSignedUrl(filePath, 3600);
                                          if (error || !data?.signedUrl) {
                                            window.open(url, '_blank');
                                          } else {
                                            window.open(data.signedUrl, '_blank');
                                          }
                                        } catch (e) {
                                          window.open(url, '_blank');
                                        }
                                      }}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 px-2 text-xs"
                                      onClick={async () => {
                                        try {
                                          const urlParts = url.split('/documents/');
                                          const filePath = urlParts.length > 1 ? urlParts[1] : url;
                                          const { data, error } = await supabase.storage
                                            .from('documents')
                                            .createSignedUrl(filePath, 3600, { download: fileName });
                                          if (error || !data?.signedUrl) {
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = fileName;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                          } else {
                                            const a = document.createElement('a');
                                            a.href = data.signedUrl;
                                            a.download = fileName;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                          }
                                        } catch (e) {
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = fileName;
                                          document.body.appendChild(a);
                                          a.click();
                                          a.remove();
                                        }
                                      }}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TAB 3: Delivered Files */}
          <TabsContent value="delivered" className="space-y-3 md:space-y-4">
            {completedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm md:text-base text-muted-foreground">No delivered files yet</p>
                </CardContent>
              </Card>
            ) : (
              completedRequests.map(request => {
                const files = getAllDeliverableUrls(request);
                return (
                  <Card key={request.id} className="border-green-200 dark:border-green-800">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
                            <span className="truncate">{request.service_type}</span>
                          </CardTitle>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            Delivered on {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {files.length === 0 ? (
                        <p className="text-xs md:text-sm text-muted-foreground">No files attached</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs md:text-sm font-medium mb-2">Files:</p>
                          {files.map((url, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 md:p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs md:text-sm font-medium truncate">{getFileNameFromUrl(url)}</span>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs h-8"
                                  onClick={async () => {
                                    try {
                                      const urlParts = url.split('/documents/');
                                      const filePath = urlParts.length > 1 ? urlParts[1] : url;
                                      const { data, error } = await supabase.storage
                                        .from('documents')
                                        .createSignedUrl(filePath, 3600);
                                      if (error || !data?.signedUrl) {
                                        window.open(url, '_blank');
                                      } else {
                                        window.open(data.signedUrl, '_blank');
                                      }
                                    } catch (e) {
                                      window.open(url, '_blank');
                                    }
                                  }}
                                >
                                  <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                  <span className="hidden sm:inline">View</span>
                                  <span className="sm:hidden">View</span>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-xs h-8"
                                  onClick={async () => {
                                    try {
                                      const urlParts = url.split('/documents/');
                                      const filePath = urlParts.length > 1 ? urlParts[1] : url;
                                      const fileName = getFileNameFromUrl(url);
                                      const { data, error } = await supabase.storage
                                        .from('documents')
                                        .createSignedUrl(filePath, 3600, { download: fileName });
                                      if (error || !data?.signedUrl) {
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = fileName;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                      } else {
                                        const a = document.createElement('a');
                                        a.href = data.signedUrl;
                                        a.download = fileName;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                      }
                                    } catch (e) {
                                      const fileName = getFileNameFromUrl(url);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = fileName;
                                      document.body.appendChild(a);
                                      a.click();
                                      a.remove();
                                    }
                                  }}
                                >
                                  <Download className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                  <span className="hidden sm:inline">Download</span>
                                  <span className="sm:hidden">Get</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Request Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Service</DialogTitle>
              <DialogDescription>
                {packageRequestName ? `Package: ${packageRequestName}` : 'Selected services'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {packageRequestName && (
                <div className="bg-primary/5 p-3 rounded-lg">
                  <Label>Package Selected:</Label>
                  <p className="font-semibold mt-1">{packageRequestName}</p>
                  {(() => {
                    const pkg = packages.find(p => p.name === packageRequestName);
                    return pkg?.price_range_inr ? (
                      <p className="text-sm text-muted-foreground">Price Range: ₹{pkg.price_range_inr}</p>
                    ) : null;
                  })()}
                </div>
              )}

              {selectedServices.length > 0 && (
                <div>
                  <Label>{packageRequestName ? 'Additional Services:' : 'Selected Services:'}</Label>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    {selectedServices.map(id => {
                      const service = services.find(s => s.id === id);
                      return <li key={id}>{service?.name} - ₹{service?.price_inr?.toLocaleString()}</li>;
                    })}
                  </ul>
                </div>
              )}

              <div>
                <Label htmlFor="timeline">Preferred Timeline *</Label>
                <Select value={timeline} onValueChange={setTimeline}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3 days">1-3 days</SelectItem>
                    <SelectItem value="1 week">1 week</SelectItem>
                    <SelectItem value="2 weeks">2 weeks</SelectItem>
                    <SelectItem value="1 month">1 month</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="details">Additional Details</Label>
                <Textarea
                  id="details"
                  placeholder="Any specific requirements or notes..."
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  {packageRequestName ? (
                    <>
                      {(() => {
                        const pkg = packages.find(p => p.name === packageRequestName);
                        return pkg?.price_range_inr ? (
                          <>
                            <p className="text-sm text-muted-foreground">Estimated Range</p>
                            <p className="font-semibold text-lg">₹{pkg.price_range_inr}</p>
                            {selectedServices.length > 0 && (
                              <p className="text-xs text-muted-foreground">+ ₹{calculateTotalPrice().toLocaleString()} extras</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="font-semibold text-lg">₹{getTotalAmount().toLocaleString()}</p>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-semibold text-lg">₹{calculateTotalPrice().toLocaleString()}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRequestSubmit}>
                    Submit Request
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ServicesNew;
