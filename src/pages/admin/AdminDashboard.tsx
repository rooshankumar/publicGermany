import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

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
  pendingPayments: number;
  receivedPayments: number;
  pendingDocuments: number;
  recentStudents: any[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeApplications: 0,
    pendingRequests: 0,
    totalRevenue: 0,
    recentPayments: [],
    urgentTasks: [],
    pendingPayments: 0,
    receivedPayments: 0,
    pendingDocuments: 0,
    recentStudents: []
  });
  const [loading, setLoading] = useState(true);
  const initialLoadDoneRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Initial load (show spinner)
    fetchDashboardData(true);

    // Single realtime channel with debounced refreshes (no spinner)
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_payments' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => scheduleRefresh())
      .subscribe();

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const scheduleRefresh = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchDashboardData(false), 400);
  };

  const fetchDashboardData = async (showSpinner: boolean) => {
    try {
      if (showSpinner) setLoading(true);
      
      // Prepare time window
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Run all requests in parallel and narrow columns
      const [
        studentsCountRes,
        applicationsCountRes,
        requestsCountRes,
        receivedRowsRes,
        pendingPaymentsCountRes,
        receivedPaymentsCountRes,
        recentPaymentsRes,
        urgentAppsRes,
        pendingDocsRes,
        recentStudentsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('applications').select('id', { count: 'exact', head: true }).neq('status', 'rejected'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).in('status', ['new', 'in_progress']),
        supabase.from('service_payments' as any).select('amount').eq('status', 'received'),
        supabase.from('service_payments' as any).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('service_payments' as any).select('id', { count: 'exact', head: true }).eq('status', 'received'),
        supabase.from('service_payments' as any).select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('applications').select('id, university_name, application_end_date, profiles!applications_user_id_fkey(full_name)').lte('application_end_date', nextWeek.toISOString()).neq('status', 'submitted').order('application_end_date', { ascending: true }).limit(10),
        supabase.from('documents' as any).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('id, full_name, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(5),
      ]);

      const studentsCount = studentsCountRes.count || 0;
      const applicationsCount = applicationsCountRes.count || 0;
      const requestsCount = requestsCountRes.count || 0;
      const receivedRows = receivedRowsRes.data || [];
      const totalRevenue = receivedRows.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const pendingPayments = pendingPaymentsCountRes.count || 0;
      const receivedPayments = receivedPaymentsCountRes.count || 0;
      const recentPayments = recentPaymentsRes.data || [];
      const urgentApps = urgentAppsRes.data || [];
      const pendingDocs = pendingDocsRes.count || 0;
      const recentStudents = recentStudentsRes.data || [];

      setStats({
        totalStudents: studentsCount || 0,
        activeApplications: applicationsCount || 0,
        pendingRequests: requestsCount || 0,
        totalRevenue,
        recentPayments: recentPayments || [],
        urgentTasks: urgentApps || [],
        pendingPayments: pendingPayments || 0,
        receivedPayments: receivedPayments || 0,
        pendingDocuments: pendingDocs || 0,
        recentStudents: recentStudents || []
      });

    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (showSpinner || !initialLoadDoneRef.current) {
        setLoading(false);
        initialLoadDoneRef.current = true;
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'received': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-destructive" />;
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

  // Note: We intentionally avoid blocking UI with a full-screen loader to keep the page feeling responsive.

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Live overview of all platform activities</p>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/students">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">Click to manage</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/requests">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <GraduationCap className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/payments">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Received</CardTitle>
                <CreditCard className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.pendingPayments} pending</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingDocuments}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                      <Badge variant={payment.status === 'received' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
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

        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Students
            </CardTitle>
            <CardDescription>Latest student registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No recent students</p>
            ) : (
              <div className="space-y-3">
                {stats.recentStudents.map((student: any) => (
                  <Link key={student.id} to={`/admin/students/${student.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{student.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(student.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">New</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;