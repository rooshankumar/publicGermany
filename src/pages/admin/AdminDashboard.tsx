import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  FileText, 
  GraduationCap, 
  CreditCard, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalStudents: number;
  activeApplications: number;
  pendingRequests: number;
  totalRevenue: number;
  recentPayments: any[];
  urgentTasks: any[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeApplications: 0,
    pendingRequests: 0,
    totalRevenue: 0,
    recentPayments: [],
    urgentTasks: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions for live updates
    const channels = [
      supabase
        .channel('profiles-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchDashboardData();
        }),
      supabase
        .channel('applications-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
          fetchDashboardData();
        }),
      supabase
        .channel('service-requests-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
          fetchDashboardData();
        }),
      supabase
        .channel('payments-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
          fetchDashboardData();
        })
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch applications count
      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'rejected');

      // Fetch pending service requests
      const { count: requestsCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['new', 'in_progress']);

      // Fetch revenue from payments
      const { data: payments } = await supabase
        .from('payments' as any)
        .select('amount, status, created_at')
        .eq('status', 'paid');

      const totalRevenue = payments?.reduce((sum: number, payment: any) => 
        sum + (payment.amount || 0), 0) || 0;

      // Fetch recent payments (last 5)
      const { data: recentPayments } = await supabase
        .from('payments' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch urgent tasks (applications with deadlines in next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { data: urgentApps } = await supabase
        .from('applications')
        .select('*, profiles!applications_user_id_fkey(full_name)')
        .lte('application_end_date', nextWeek.toISOString())
        .neq('status', 'submitted')
        .order('application_end_date', { ascending: true });

      setStats({
        totalStudents: studentsCount || 0,
        activeApplications: applicationsCount || 0,
        pendingRequests: requestsCount || 0,
        totalRevenue,
        recentPayments: recentPayments || [],
        urgentTasks: urgentApps || []
      });

    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDaysUntilDeadline = (date: string) => {
    const deadline = new Date(date);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Live overview of all platform activities</p>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                <Link to="/admin/students" className="hover:underline">View all students</Link>
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
              <FileText className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.activeApplications}</div>
              <p className="text-xs text-muted-foreground">
                <Link to="/admin/applications" className="hover:underline">Manage applications</Link>
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <GraduationCap className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                <Link to="/admin/requests" className="hover:underline">Handle requests</Link>
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <Link to="/admin/payments" className="hover:underline">View payments</Link>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Payments
              </CardTitle>
              <CardDescription>Last 5 payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No payments yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentPayments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <p className="font-medium">₹{payment.amount?.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Urgent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Urgent Applications
              </CardTitle>
              <CardDescription>Applications with upcoming deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.urgentTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No urgent applications</p>
              ) : (
                <div className="space-y-3">
                  {stats.urgentTasks.slice(0, 5).map((app: any) => {
                    const daysLeft = getDaysUntilDeadline(app.application_end_date);
                    return (
                      <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{app.university_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.profiles?.full_name || 'Unknown Student'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={daysLeft <= 3 ? 'destructive' : 'secondary'}>
                            {daysLeft > 0 ? `${daysLeft} days` : 'Overdue'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild className="h-20 flex-col">
                <Link to="/admin/students">
                  <Users className="h-6 w-6 mb-2" />
                  Manage Students
                </Link>
              </Button>
              <Button asChild className="h-20 flex-col" variant="secondary">
                <Link to="/admin/applications">
                  <FileText className="h-6 w-6 mb-2" />
                  Review Applications
                </Link>
              </Button>
              <Button asChild className="h-20 flex-col" variant="outline">
                <Link to="/admin/requests">
                  <GraduationCap className="h-6 w-6 mb-2" />
                  Service Requests
                </Link>
              </Button>
              <Button asChild className="h-20 flex-col" variant="ghost">
                <Link to="/admin/payments">
                  <CreditCard className="h-6 w-6 mb-2" />
                  Payment Records
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;