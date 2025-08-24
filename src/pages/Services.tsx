import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IndianRupee, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceRequest {
  id: string;
  service_type: string;
  service_price: number;
  service_currency: string;
  request_details: string | null;
  preferred_timeline: string | null;
  status: 'new' | 'in_review' | 'payment_pending' | 'in_progress' | 'completed';
  admin_response: string | null;
  created_at: string;
}

const Services = () => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const { toast } = useToast();

  const services = [
    { id: 'university_shortlisting', name: 'University Shortlisting', price: 5000, description: 'Get personalized university recommendations based on your profile' },
    { id: 'cv_preparation', name: 'CV Preparation', price: 3000, description: 'Professional CV tailored for German university applications' },
    { id: 'sop_first_draft', name: 'SOP (1st draft)', price: 2500, description: 'Statement of Purpose - first draft with revisions' },
    { id: 'sop_additional', name: 'SOP (additional)', price: 2000, description: 'Additional SOP for different programs' },
    { id: 'lor_samples', name: 'LOR Samples', price: 3000, description: 'Letter of Recommendation templates and samples' },
    { id: 'visa_sop', name: 'Visa SOP', price: 5000, description: 'Statement of Purpose specifically for visa applications' },
  ];

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceRequests(data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch service requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      return total + (service?.price || 0);
    }, 0);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one service",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to request services",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const serviceNames = selectedServices.map(id => 
      services.find(s => s.id === id)?.name
    ).join(', ');

    const requestData = {
      user_id: user.id,
      service_type: serviceNames,
      service_price: calculateTotalPrice(),
      service_currency: 'INR',
      request_details: formData.get('details') as string,
      preferred_timeline: formData.get('timeline') as string,
      status: 'new' as const,
    };

    try {
      const { error } = await supabase
        .from('service_requests')
        .insert([requestData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service request submitted successfully",
      });

      setShowRequestDialog(false);
      setSelectedServices([]);
      fetchServiceRequests();
    } catch (error) {
      console.error('Error submitting service request:', error);
      toast({
        title: "Error",
        description: "Failed to submit service request",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'payment_pending':
        return <IndianRupee className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'payment_pending': return 'secondary';
      case 'in_review': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Services</h1>
            <p className="text-muted-foreground">Get personalized help with your Germany study journey</p>
          </div>
          
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button>Request Personalized Help</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Personalized Help</DialogTitle>
                <DialogDescription>
                  Select the services you need and provide details about your requirements
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleRequestSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Select Services</Label>
                  {services.map((service) => (
                    <div key={service.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => handleServiceSelection(service.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <Label htmlFor={service.id} className="font-medium cursor-pointer">
                              {service.name}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          </div>
                          <Badge variant="outline">
                            ₹{service.price.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedServices.length > 0 && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total</span>
                        <span className="text-lg font-bold">
                          ₹{calculateTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Context & Requirements</Label>
                  <Textarea 
                    id="details" 
                    name="details"
                    placeholder="Please provide details about your requirements, target programs, intake, etc."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Preferred Timeline</Label>
                  <Select name="timeline" required>
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

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowRequestDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={selectedServices.length === 0}>
                    Submit Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pricing Table */}
        <Card>
          <CardHeader>
            <CardTitle>Our Services</CardTitle>
            <CardDescription>
              Professional assistance to help you succeed in your Germany study journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="secondary">
                        ₹{service.price.toLocaleString()}
                      </Badge>
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My Requests */}
        <Card>
          <CardHeader>
            <CardTitle>My Service Requests</CardTitle>
            <CardDescription>
              Track the status of your service requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serviceRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No service requests yet</p>
                <Button onClick={() => setShowRequestDialog(true)}>
                  Request Your First Service
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{request.service_type}</h3>
                        <p className="text-sm text-muted-foreground">
                          Requested on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <Badge variant={getStatusVariant(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-medium">
                          {request.service_currency} {request.service_price.toLocaleString()}
                        </span>
                        {request.preferred_timeline && (
                          <span className="text-muted-foreground ml-2">
                            • Timeline: {request.preferred_timeline}
                          </span>
                        )}
                      </div>
                    </div>

                    {request.admin_response && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Admin Response:</strong> {request.admin_response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Services;