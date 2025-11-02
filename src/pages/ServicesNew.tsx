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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  FileText, 
  Download,
  Package,
  AlertCircle,
  Eye
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

  // Fetch user's service requests
  const requestsQuery = useQuery({
    queryKey: ['my-service-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    },
    enabled: !!user,
  });

  const services = catalogQuery.data || [];
  const packages = services.filter(s => s.kind === 'package');
  const individualServices = services.filter(s => s.kind === 'individual');
  const requests = requestsQuery.data || [];
  const completedRequests = requests.filter(r => r.status === 'completed');
  const activeRequests = requests.filter(r => r.status !== 'completed');

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
        const pkg = packages.find(p => p.name === packageRequestName);
        const priceInfo = packageRequestName && pkg?.price_range_inr
          ? `Package Range: ₹${pkg.price_range_inr}`
          : `Total: ₹${totalAmount.toLocaleString()}`;
        
        await sendEmail(
          'publicgermany@outlook.com',
          'New Service Request',
          `<p>New service request from ${studentName}</p>
           <p><strong>Services:</strong> ${serviceNames}<br/>
           <strong>${priceInfo}</strong><br/>
           ${selectedServices.length > 0 ? `<strong>Extras Total:</strong> ₹${calculateTotalPrice().toLocaleString()}<br/>` : ''}
           <strong>Timeline:</strong> ${timeline}</p>`
        );
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground">Explore our services and track your requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Requests</p>
                  <p className="text-2xl font-bold">{activeRequests.length}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedRequests.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Files Ready</p>
                  <p className="text-2xl font-bold">
                    {completedRequests.reduce((sum, r) => sum + getAllDeliverableUrls(r).length, 0)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Services</TabsTrigger>
            <TabsTrigger value="requests">
              My Requests {activeRequests.length > 0 && `(${activeRequests.length})`}
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
          <TabsContent value="requests" className="space-y-4">
            {activeRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active requests</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.querySelector('[value="browse"]')?.dispatchEvent(new Event('click', { bubbles: true }))}
                  >
                    Browse Services
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeRequests.map(request => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.service_type}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Requested on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {request.request_details && (
                      <div>
                        <p className="text-sm font-medium">Details:</p>
                        <p className="text-sm text-muted-foreground">{request.request_details}</p>
                      </div>
                    )}
                    {request.preferred_timeline && (
                      <div>
                        <p className="text-sm font-medium">Timeline:</p>
                        <p className="text-sm text-muted-foreground">{request.preferred_timeline}</p>
                      </div>
                    )}
                    {request.admin_response && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Admin Response:</p>
                        <p className="text-sm">{request.admin_response}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm font-medium">
                        Amount: ₹{request.service_price.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TAB 3: Delivered Files */}
          <TabsContent value="delivered" className="space-y-4">
            {completedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No delivered files yet</p>
                </CardContent>
              </Card>
            ) : (
              completedRequests.map(request => {
                const files = getAllDeliverableUrls(request);
                return (
                  <Card key={request.id} className="border-green-200 dark:border-green-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            {request.service_type}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Delivered on {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {files.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No files attached</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-medium mb-2">Files:</p>
                          {files.map((url, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{getFileNameFromUrl(url)}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <a href={url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </a>
                                </Button>
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={url} download>
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </a>
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
                <Input
                  id="timeline"
                  placeholder="e.g., Within 1 week, ASAP, etc."
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                />
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
