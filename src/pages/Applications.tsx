import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import useRealTimeSync from '@/hooks/useRealTimeSync';

interface Application {
  id: string;
  university_name: string;
  program_name: string;
  ielts_requirement: string | null;
  german_requirement: string | null;
  fees_eur: number | null;
  start_date: string | null;
  end_date: string | null;
  application_method: string | null;
  required_tests: string | null;
  portal_link: string | null;
  status: 'draft' | 'submitted' | 'interview' | 'offer' | 'rejected';
  notes: string | null;
  created_at: string;
}

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Set up real-time sync
  useRealTimeSync({
    table: 'applications',
    callback: fetchApplications,
    filter: { column: 'user_id', value: profile?.user_id || null }
  });

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add applications",
        variant: "destructive",
      });
      return;
    }
    
    const applicationData = {
      user_id: user.id,
      university_name: formData.get('university_name') as string,
      program_name: formData.get('program_name') as string,
      ielts_requirement: formData.get('ielts_requirement') as string || null,
      german_requirement: formData.get('german_requirement') as string || null,
      fees_eur: formData.get('fees_eur') ? parseInt(formData.get('fees_eur') as string) : null,
      start_date: formData.get('start_date') as string || null,
      end_date: formData.get('end_date') as string || null,
      application_method: formData.get('application_method') as string || null,
      required_tests: formData.get('required_tests') as string || null,
      portal_link: formData.get('portal_link') as string || null,
      status: 'draft' as const,
      notes: formData.get('notes') as string || null,
    };

    try {
      const { error } = await supabase
        .from('applications')
        .insert([applicationData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application added successfully",
      });

      setShowAddDialog(false);
      fetchApplications();
    } catch (error) {
      console.error('Error adding application:', error);
      toast({
        title: "Error",
        description: "Failed to add application",
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (id: string, status: Application['status']) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application status updated",
      });

      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application deleted",
      });

      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: Application['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'interview': return 'outline';
      case 'offer': return 'default';
      case 'rejected': return 'destructive';
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
            <h1 className="text-3xl font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground">Track your university applications</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Application</DialogTitle>
                <DialogDescription>
                  Track a new university application
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddApplication} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="university_name">University Name *</Label>
                    <Input id="university_name" name="university_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program_name">Program Name *</Label>
                    <Input id="program_name" name="program_name" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ielts_requirement">IELTS Requirement</Label>
                    <Input id="ielts_requirement" name="ielts_requirement" placeholder="e.g., 6.5 overall" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="german_requirement">German Requirement</Label>
                    <Input id="german_requirement" name="german_requirement" placeholder="e.g., B2 level" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fees_eur">Fees (EUR per semester)</Label>
                    <Input id="fees_eur" name="fees_eur" type="number" placeholder="e.g., 500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="application_method">Application Method</Label>
                    <Select name="application_method">
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Uni-assist">Uni-assist</SelectItem>
                        <SelectItem value="Direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Application Start Date</Label>
                    <Input id="start_date" name="start_date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Application End Date</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="required_tests">Required Tests</Label>
                    <Input id="required_tests" name="required_tests" placeholder="e.g., TestAS, GRE" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portal_link">Portal Link</Label>
                    <Input id="portal_link" name="portal_link" type="url" placeholder="https://..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" placeholder="Additional notes..." />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Application</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
            <CardDescription>
              {applications.length} application{applications.length !== 1 ? 's' : ''} tracked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No applications tracked yet</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Application
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>University</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>IELTS</TableHead>
                      <TableHead>German</TableHead>
                      <TableHead>Fees (EUR)</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.university_name}</TableCell>
                        <TableCell>{app.program_name}</TableCell>
                        <TableCell>{app.ielts_requirement || '-'}</TableCell>
                        <TableCell>{app.german_requirement || '-'}</TableCell>
                        <TableCell>{app.fees_eur ? `€${app.fees_eur}` : '-'}</TableCell>
                        <TableCell>
                          {app.end_date ? new Date(app.end_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>{app.application_method || '-'}</TableCell>
                        <TableCell>
                          <Select 
                            value={app.status} 
                            onValueChange={(value) => updateApplicationStatus(app.id, value as Application['status'])}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue>
                                <Badge variant={getStatusBadgeVariant(app.status)}>
                                  {app.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="offer">Offer</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {app.portal_link && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                asChild
                              >
                                <a href={app.portal_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => deleteApplication(app.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Applications;