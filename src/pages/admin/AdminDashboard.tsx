import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, FileText, GraduationCap, CreditCard, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import BulkEmailPanel from '@/components/admin/BulkEmailPanel';
import UpcomingDeadlineReminders from '@/components/admin/UpcomingDeadlineReminders';
import { PgLogoMark } from '@/components/PgLogo';

interface RevenueRow { amount: number; date: string }

interface DashboardStats {
  totalStudents: number; activeApplications: number; pendingRequests: number; totalRevenue: number;
  recentPayments: any[]; urgentTasks: any[]; pendingPayments: number; receivedPayments: number;
  pendingDocuments: number; recentStudents: any[];
  revenueRows: RevenueRow[]; pendingAmount: number;
}

const buildPeriods = (size: number) => {
  const now = new Date();
  const year = now.getFullYear();
  const monthName = (m: number) => new Date(year, m, 1).toLocaleString('en-US', { month: 'short' });
  const out: { label: string; start: Date; end: Date }[] = [];
  for (let y = year - 1; y <= year; y++) {
    for (let m = 0; m < 12; m += size) {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + size, 1);
      if (start > now) continue;
      out.push({ label: `${monthName(m)}–${monthName(Math.min(m + size - 1, 11))} ${y}`, start, end });
    }
  }
  return out.reverse();
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({totalStudents:0,activeApplications:0,pendingRequests:0,totalRevenue:0,recentPayments:[],urgentTasks:[],pendingPayments:0,receivedPayments:0,pendingDocuments:0,recentStudents:[],revenueRows:[],pendingAmount:0});
  const [loading, setLoading] = useState(true);
  const [bucketSize, setBucketSize] = useState<4 | 6>(4);
  const [periodKey, setPeriodKey] = useState<string>('all');
  const initialLoadDoneRef = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const { toast } = useToast();


  useEffect(() => {
    fetchDashboardData(true);
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_payments' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => scheduleRefresh())
      .subscribe();
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); supabase.removeChannel(channel); };
  }, []);

  const scheduleRefresh = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchDashboardData(false), 400);
  };

  const fetchDashboardData = async (showSpinner: boolean) => {
    try {
      if (showSpinner) setLoading(true);
      const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
      const [studentsCountRes, applicationsCountRes, requestsCountRes, receivedRowsRes, pendingRowsRes, receivedPaymentsCountRes, recentPaymentsRes, urgentAppsRes, pendingDocsRes, recentStudentsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('applications').select('id', { count: 'exact', head: true }).neq('status', 'rejected'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).in('status', ['new', 'in_progress']),
        supabase.from('service_payments' as any).select('amount, target_total_amount, paid_at, created_at').eq('status', 'received'),
        supabase.from('service_payments' as any).select('amount, target_total_amount, created_at').eq('status', 'pending'),
        supabase.from('service_payments' as any).select('id', { count: 'exact', head: true }).eq('status', 'received'),
        supabase.from('service_payments' as any).select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('applications').select('id, university_name, application_end_date, profiles!applications_user_id_fkey(full_name)').lte('application_end_date', nextWeek.toISOString()).neq('status', 'submitted').order('application_end_date', { ascending: true }).limit(5),
        supabase.from('documents' as any).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('id, full_name, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(5),
      ]);
      const revenueRows: RevenueRow[] = ((receivedRowsRes.data || []) as any[]).map((p: any) => ({
        amount: Number(p.amount) || 0,
        date: p.paid_at || p.created_at,
      }));
      // Dues = unpaid pending payments + outstanding balance on partially paid records
      let pendingAmount = ((pendingRowsRes.data || []) as any[]).reduce((s: number, p: any) => {
        const target = Number(p.target_total_amount) || 0;
        return s + Math.max(Number(p.amount) || 0, target ? target : 0);
      }, 0);
      pendingAmount += ((receivedRowsRes.data || []) as any[]).reduce((s: number, p: any) => {
        const target = Number(p.target_total_amount) || 0;
        return s + Math.max(0, target - (Number(p.amount) || 0));
      }, 0);
      let totalRevenue = revenueRows.reduce((sum, p) => sum + p.amount, 0);
      try {
        const { data: manualRows } = await (supabase as any).from('manual_payments').select('amount, status, paid_at, created_at');
        for (const p of ((manualRows || []) as any[])) {
          const amt = Number(p?.amount) || 0;
          if (p?.status === 'received') {
            totalRevenue += amt;
            revenueRows.push({ amount: amt, date: p.paid_at || p.created_at });
          } else if (p?.status === 'pending') {
            pendingAmount += amt;
          }
        }
      } catch {}

      // Include verified referral revenue (10% commission of total_fees) + recent commission entries
      let commissionEntries: any[] = [];
      try {
        const { data: verifiedReferrals } = await (supabase as any)
          .from('referrals')
          .select('id, full_name, total_fees, verified_at')
          .eq('verified_by_admin', true)
          .not('verified_at', 'is', null)
          .order('verified_at', { ascending: false })
          .limit(10);
        if (verifiedReferrals) {
          const commissionSum = (verifiedReferrals as any[]).reduce((s: number, r: any) => {
            const numericFee = parseFloat(String(r.total_fees || '0').replace(/[^0-9.-]/g, ''));
            return s + (isNaN(numericFee) ? 0 : numericFee * 0.1);
          }, 0);
          totalRevenue += commissionSum;
          commissionEntries = (verifiedReferrals as any[]).map((r: any) => {
            const numericFee = parseFloat(String(r.total_fees || '0').replace(/[^0-9.-]/g, ''));
            const commissionAmount = isNaN(numericFee) ? 0 : Math.round(numericFee * 0.1);
            return {
              id: `comm-${r.id}`,
              amount: commissionAmount,
              full_fees: r.total_fees,
              status: 'commission',
              created_at: r.verified_at,
              full_name: r.full_name,
              type: 'commission',
            };
          }).filter((r: any) => r.amount > 0);
        }
      } catch {}
      // Merge payments + commissions into one sorted feed
      const mergedRecent = [
        ...(recentPaymentsRes.data || []).map((p: any) => ({ ...p, type: 'payment' })),
        ...commissionEntries,
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
      setStats({ totalStudents: studentsCountRes.count || 0, activeApplications: applicationsCountRes.count || 0, pendingRequests: requestsCountRes.count || 0, totalRevenue, recentPayments: mergedRecent, urgentTasks: urgentAppsRes.data || [], pendingPayments: pendingPaymentsCountRes.count || 0, receivedPayments: receivedPaymentsCountRes.count || 0, pendingDocuments: pendingDocsRes.count || 0, recentStudents: recentStudentsRes.data || [] });
    } catch (error: any) { toast({ title: "Error loading dashboard", description: error.message, variant: "destructive" }); }
    finally { if (showSpinner || !initialLoadDoneRef.current) { setLoading(false); initialLoadDoneRef.current = true; } }
  };

  const getDaysUntilDeadline = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const SIC = ({ status }: { status: string }) => {
    switch (status?.toLowerCase()) {
      case 'received': return <CheckCircle className="h-3.5 w-3.5 text-success" />;
      case 'pending': return <Clock className="h-3.5 w-3.5 text-warning" />;
      case 'commission': return <TrendingUp className="h-3.5 w-3.5 text-purple-500" />;
      case 'cancelled': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-3">
        <div className="german-stripe w-full" />
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-pg-sep bg-pg-bg px-3 py-2">
          <div className="flex items-center gap-2">
            <PgLogoMark />
            <div>
              <h1 className="text-sm font-semibold text-pg-label tracking-tight">Admin Dashboard</h1>
              <p className="text-[10px] text-pg-label3">Live overview of all platform activities</p>
            </div>
          </div>
          <span className="hidden sm:inline text-[9px] uppercase tracking-[0.15em] text-pg-label3">Admin</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          <Link to="/admin/students"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="py-2 px-2.5"><div className="flex items-center justify-between"><div><p className="text-[9px] text-muted-foreground font-medium">Students</p><p className="text-base font-bold">{stats.totalStudents}</p></div><Users className="h-3.5 w-3.5 text-primary" /></div></CardContent></Card></Link>
          <Link to="/admin/requests"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="py-2 px-2.5"><div className="flex items-center justify-between"><div><p className="text-[9px] text-muted-foreground font-medium">Pending</p><p className="text-base font-bold">{stats.pendingRequests}</p></div><GraduationCap className="h-3.5 w-3.5 text-warning" /></div></CardContent></Card></Link>
          <Link to="/admin/payments"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="py-2 px-2.5"><div className="flex items-center justify-between"><div><p className="text-[9px] text-muted-foreground font-medium">Revenue</p><p className="text-base font-bold text-success">₹{stats.totalRevenue.toLocaleString()}</p></div><CreditCard className="h-3.5 w-3.5 text-success" /></div><p className="text-[9px] text-muted-foreground mt-0.5">{stats.pendingPayments} pending</p></CardContent></Card></Link>
          <Card><CardContent className="py-2 px-2.5"><div className="flex items-center justify-between"><div><p className="text-[9px] text-muted-foreground font-medium">Docs Pending</p><p className="text-base font-bold">{stats.pendingDocuments}</p></div><FileText className="h-3.5 w-3.5 text-primary" /></div></CardContent></Card>
        </div>

        <UpcomingDeadlineReminders />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card><CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold"><TrendingUp className="h-3.5 w-3.5" /> Recent Payments</div>
            {stats.recentPayments.length === 0 ? <p className="text-center text-muted-foreground py-3 text-[11px]">No payments yet</p> : stats.recentPayments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-1.5 border rounded text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <SIC status={p.type === 'commission' ? 'commission' : p.status} />
                  <div className="min-w-0">
                    {p.type === 'commission' ? (
                      <>
                        <p className="font-medium text-[11px]">₹{p.amount?.toLocaleString()} <span className="text-[9px] text-purple-500 font-normal">commission</span></p>
                        <p className="text-[9px] text-muted-foreground truncate">{p.full_name} · {p.full_fees}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-[11px]">₹{p.amount?.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant={p.status === 'received' ? 'default' : p.type === 'commission' ? 'secondary' : p.status === 'pending' ? 'secondary' : 'destructive'} 
                  className={`text-[9px] px-1.5 py-0 ${p.type === 'commission' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300' : ''}`}>
                  {p.type === 'commission' ? 'Commission' : p.status}
                </Badge>
              </div>
            ))}
          </CardContent></Card>

          <Card><CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold"><AlertCircle className="h-3.5 w-3.5 text-destructive" /> Urgent Applications</div>
            {stats.urgentTasks.length === 0 ? <p className="text-center text-muted-foreground py-3 text-[11px]">No urgent applications</p> : stats.urgentTasks.slice(0, 5).map((app: any) => {
              const daysLeft = getDaysUntilDeadline(app.application_end_date);
              return <div key={app.id} className="flex items-center justify-between p-1.5 border rounded text-[11px]"><div><p className="font-medium text-[11px]">{app.university_name}</p><p className="text-[10px] text-muted-foreground">{app.profiles?.full_name || 'Unknown'}</p></div><Badge variant={daysLeft <= 3 ? 'destructive' : 'secondary'} className="text-[9px] px-1.5 py-0">{daysLeft > 0 ? `${daysLeft}d` : 'Overdue'}</Badge></div>;
            })}
          </CardContent></Card>
        </div>

        <Card><CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold"><Users className="h-3.5 w-3.5" /> Recent Students</div>
          {stats.recentStudents.length === 0 ? <p className="text-center text-muted-foreground py-3 text-[11px]">No recent students</p> : stats.recentStudents.map((s: any) => (
            <Link key={s.id} to={`/admin/students/${s.id}`}><div className="flex items-center justify-between p-1.5 border rounded hover:bg-muted/30 transition-colors"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center"><Users className="h-3 w-3 text-primary" /></div><div><p className="font-medium text-[11px]">{s.full_name || 'Unknown'}</p><p className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p></div></div><Badge variant="outline" className="text-[9px]">New</Badge></div></Link>
          ))}
        </CardContent></Card>

        <BulkEmailPanel />
      </div>
    </Layout>
  );
};

export default AdminDashboard;