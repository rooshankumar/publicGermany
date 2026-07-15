import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEditorPermissions } from '@/hooks/useEditorPermissions';
import { useMyReferrals, useMyTasks } from '@/hooks/useReferrals';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { QUALIFIED_STATUSES, statusColor, statusLabel } from '@/lib/referralConstants';
import MyReferralsPanel from '@/components/referrals/MyReferralsPanel';
import TasksInbox from '@/components/referrals/TasksInbox';
import { PgLogoMark } from '@/components/PgLogo';
import {
  Users, ArrowUpRight, Star, CheckCircle2, AlertTriangle,
  CalendarClock, Clock, UserPlus, ClipboardList, BookOpen, Youtube,
  FileText, GraduationCap, ExternalLink, BookMarked, Play,
  TrendingUp, CreditCard, IndianRupee, ShieldCheck, LogOut
} from 'lucide-react';

interface StudentSummary {
  user_id: string;
  full_name: string | null;
  country_of_education: string | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  read_time_minutes: number | null;
  featured_image_url: string | null;
  published_at: string;
}

interface ResourceItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: string;
  view_url: string | null;
  external_url: string | null;
}

interface CourseVideo {
  id: string;
  title: string;
  level: string;
  youtube_url: string | null;
  video_id: string | null;
  thumbnail_url: string | null;
  order_index: number;
}

interface CommissionEntry {
  id: string;
  full_name: string;
  total_fees: string;
  commission_amount: number;
  verified_at: string;
}

const StatCard = ({ label, value, icon: Icon }: any) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer shadow-none border-border/60">
    <CardContent className="py-2 px-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] text-muted-foreground font-medium">{label}</p>
          <p className="text-base font-bold">{value}</p>
        </div>
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
    </CardContent>
  </Card>
);

const EditorDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { assignedStudentIds } = useEditorPermissions();
  const { data: referrals = [] } = useMyReferrals();
  const { data: tasks = [] } = useMyTasks();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [commissionEntries, setCommissionEntries] = useState<CommissionEntry[]>([]);
  const [loadingCommission, setLoadingCommission] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  useEffect(() => {
    const fetch = async () => {
      if (assignedStudentIds.length === 0) { setStudents([]); setLoadingStudents(false); return; }
      const { data } = await supabase.from('profiles')
        .select('user_id, full_name, country_of_education')
        .in('user_id', assignedStudentIds);
      setStudents((data || []) as StudentSummary[]);
      setLoadingStudents(false);
    };
    fetch();
  }, [assignedStudentIds.join(',')]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('blogs')
        .select('id, title, slug, category, excerpt, read_time_minutes, featured_image_url, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20);
      setBlogs((data || []) as BlogPost[]);
      setLoadingBlogs(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      setResources((data || []) as ResourceItem[]);
      setLoadingResources(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('german_course_videos')
        .select('*')
        .order('order_index', { ascending: true });
      setVideos((data || []) as CourseVideo[]);
      setLoadingVideos(false);
    })();
  }, []);

  // Fetch verified referrals for commission calculation
  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoadingCommission(true);
      try {
        const { data: verifiedRefs } = await (supabase as any)
          .from('referrals')
          .select('id, full_name, total_fees, verified_at')
          .eq('owner_editor_id', user.id)
          .eq('verified_by_admin', true)
          .not('verified_at', 'is', null)
          .order('verified_at', { ascending: false })
          .limit(20);
        if (verifiedRefs) {
          const entries = (verifiedRefs as any[]).map((r: any) => {
            const numericFee = parseFloat(String(r.total_fees || '0').replace(/[^0-9.-]/g, ''));
            const commissionAmount = isNaN(numericFee) ? 0 : Math.round(numericFee * 0.1);
            return {
              id: r.id,
              full_name: r.full_name || 'Unknown',
              total_fees: r.total_fees || '—',
              commission_amount: commissionAmount,
              verified_at: r.verified_at,
            };
          }).filter((r: any) => r.commission_amount > 0);
          setCommissionEntries(entries);
        }
      } catch (e) {
        console.error('Error fetching commission data:', e);
      } finally {
        setLoadingCommission(false);
      }
    })();
  }, [user?.id]);

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const todaysFollowups = referrals.filter(r => r.next_followup_date === today).length;
    const overdue = referrals.filter(r => r.next_followup_date && r.next_followup_date < today && !['completed', 'lost', 'not_interested'].includes(r.current_status)).length;
    const qualified = referrals.filter(r => QUALIFIED_STATUSES.includes(r.current_status)).length;
    const converted = referrals.filter(r => !!r.converted_student_id).length;
    const pendingTasks = (tasks as any[]).filter(t => t.status === 'open').length;
    const totalCommission = commissionEntries.reduce((s, e) => s + e.commission_amount, 0);
    const verifiedCount = commissionEntries.length;
    return { 
      assigned: students.length, 
      referrals: referrals.length, 
      todaysFollowups, 
      overdue, 
      qualified, 
      converted, 
      pendingTasks,
      totalCommission,
      verifiedCount,
      pendingVerification: referrals.filter(r => !r.verified_by_admin && r.total_fees).length,
    };
  }, [referrals, tasks, students.length, today, commissionEntries]);

  const categoryColors: Record<string, string> = {
    aps: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    universities: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
    visa: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
    documents: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    'language-exams': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    finance: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    general: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  };

  return (
    <Layout>
      <div className="space-y-3">
        <div className="german-stripe w-full" />
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-pg-sep bg-pg-bg px-3 py-2">
          <div className="flex items-center gap-2">
            <PgLogoMark />
            <div>
              <h1 className="text-sm font-semibold text-pg-label tracking-tight">Editor Workspace</h1>
              <p className="text-[10px] text-pg-label3">{profile?.full_name || 'Editor'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline text-[9px] uppercase tracking-[0.15em] text-pg-label3">Editor</span>
            <button
              onClick={async () => {
                await signOut();
                navigate('/auth');
              }}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setSearchParams(v === 'dashboard' ? {} : { tab: v })}>
          <TabsList className="h-8 p-0.5 bg-muted/60 flex-nowrap overflow-x-auto no-scrollbar">
            <TabsTrigger value="dashboard" className="text-[10px] h-7 px-2 shrink-0 data-[state=active]:bg-background">Dashboard</TabsTrigger>
            <TabsTrigger value="referrals" className="text-[10px] h-7 px-2 shrink-0 data-[state=active]:bg-background">Referrals</TabsTrigger>
            <TabsTrigger value="students" className="text-[10px] h-7 px-2 shrink-0 data-[state=active]:bg-background">Students</TabsTrigger>
            <TabsTrigger value="tasks" className="text-[10px] h-7 px-2 shrink-0 data-[state=active]:bg-background">Tasks</TabsTrigger>
            <TabsTrigger value="revenue" className="text-[10px] h-7 px-2 shrink-0 data-[state=active]:bg-background">Revenue</TabsTrigger>
            <TabsTrigger value="blog" className="text-[10px] h-7 px-2 shrink-0 data-[state=active]:bg-background">Blog</TabsTrigger>
            <TabsTrigger value="resources" className="text-[10px] h-7 px-2 shrink-0 data-[state=active]:bg-background">Resources</TabsTrigger>
            <TabsTrigger value="german" className="text-[10px] h-7 px-2 shrink-0 data-[state=active]:bg-background">German</TabsTrigger>
            <TabsTrigger value="tools" className="text-[10px] h-7 px-2 shrink-0 data-[state=active]:bg-background">Tools</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="pt-2 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              <StatCard label="Assigned Students" value={stats.assigned} icon={Users} />
              <StatCard label="My Referrals" value={stats.referrals} icon={UserPlus} />
              <StatCard label="Commission Earned" value={`₹${stats.totalCommission.toLocaleString()}`} icon={IndianRupee} />
              <StatCard label="Pending Tasks" value={stats.pendingTasks} icon={ClipboardList} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Recent Referrals */}
              <Card className="shadow-none border-border/60">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold"><Users className="h-3.5 w-3.5" /> Recent Referrals</div>
                  {referrals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-3 text-[11px]">No referrals yet</p>
                  ) : referrals.slice(0, 5).map(r => (
                    <button key={r.id} onClick={() => navigate(`/editor/referrals/${r.id}`)}
                      className="w-full flex items-center justify-between p-1.5 border rounded text-[11px] hover:bg-muted/40 text-left">
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-[11px] truncate">{r.full_name}</p>
                          {r.verified_by_admin && <ShieldCheck className="h-3 w-3 text-green-600 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{r.phone || r.email || '—'}</p>
                      </div>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ${statusColor(r.current_status)}`}>{statusLabel(r.current_status)}</Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* My Revenue Summary */}
              <Card className="shadow-none border-border/60">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold"><TrendingUp className="h-3.5 w-3.5" /> My Revenue</div>
                  {loadingCommission ? (
                    <p className="text-center text-muted-foreground py-3 text-[11px]">Loading...</p>
                  ) : commissionEntries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-3 text-[11px]">No commission earned yet</p>
                  ) : commissionEntries.slice(0, 5).map(e => (
                    <div key={e.id} className="flex items-center justify-between p-1.5 border rounded text-[11px]">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium text-[11px] truncate">{e.full_name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{e.total_fees} · {new Date(e.verified_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-[11px] text-emerald-600">₹{e.commission_amount.toLocaleString()}</p>
                        <p className="text-[8px] text-muted-foreground">10% commission</p>
                      </div>
                    </div>
                  ))}
                  {commissionEntries.length > 0 && (
                    <button onClick={() => setSearchParams({ tab: 'revenue' })}
                      className="w-full text-center text-[10px] text-primary hover:underline pt-1">
                      View all revenue details →
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              <Card className="shadow-none border-border/60"><CardContent className="py-2 px-2.5 flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground font-medium">Today's Follow-ups</p>
                  <p className="text-sm font-bold">{stats.todaysFollowups}</p>
                </div>
              </CardContent></Card>
              <Card className="shadow-none border-border/60"><CardContent className="py-2 px-2.5 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground font-medium">Overdue</p>
                  <p className="text-sm font-bold">{stats.overdue}</p>
                </div>
              </CardContent></Card>
              <Card className="shadow-none border-border/60"><CardContent className="py-2 px-2.5 flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground font-medium">Qualified</p>
                  <p className="text-sm font-bold">{stats.qualified}</p>
                </div>
              </CardContent></Card>
              <Card className="shadow-none border-border/60"><CardContent className="py-2 px-2.5 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground font-medium">Converted</p>
                  <p className="text-sm font-bold">{stats.converted}</p>
                </div>
              </CardContent></Card>
            </div>
          </TabsContent>

          {/* REFERRALS */}
          <TabsContent value="referrals" className="pt-2"><MyReferralsPanel /></TabsContent>

          {/* REVENUE */}
          <TabsContent value="revenue" className="pt-2 space-y-3">
            {/* Revenue Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              <Card className="shadow-none border-border/60"><CardContent className="py-2 px-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-muted-foreground font-medium">Total Commission</p>
                    <p className="text-base font-bold text-emerald-600">₹{stats.totalCommission.toLocaleString()}</p>
                  </div>
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              </CardContent></Card>
              <Card className="shadow-none border-border/60"><CardContent className="py-2 px-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-muted-foreground font-medium">Verified Leads</p>
                    <p className="text-base font-bold">{stats.verifiedCount}</p>
                  </div>
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                </div>
              </CardContent></Card>
              <Card className="shadow-none border-border/60"><CardContent className="py-2 px-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-muted-foreground font-medium">Pending Verification</p>
                    <p className="text-base font-bold">{stats.pendingVerification}</p>
                  </div>
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
              </CardContent></Card>
              <Card className="shadow-none border-border/60"><CardContent className="py-2 px-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-muted-foreground font-medium">Avg. per Lead</p>
                    <p className="text-base font-bold">
                      {stats.verifiedCount > 0 ? `₹${Math.round(stats.totalCommission / stats.verifiedCount).toLocaleString()}` : '—'}
                    </p>
                  </div>
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
              </CardContent></Card>
            </div>

            {/* Commission Breakdown */}
            <Card className="shadow-none border-border/60">
              <CardContent className="p-0">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <p className="text-[11px] font-semibold">Commission Breakdown</p>
                  {commissionEntries.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">{commissionEntries.length} verified leads</p>
                  )}
                </div>
                {loadingCommission ? (
                  <p className="text-center py-6 text-[11px] text-muted-foreground">Loading commission data...</p>
                ) : commissionEntries.length === 0 ? (
                  <div className="p-6 text-center space-y-1">
                    <CreditCard className="h-6 w-6 mx-auto text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">No commission earned yet</p>
                    <p className="text-[10px] text-muted-foreground/60">Leads must be verified by admin to receive commission</p>
                  </div>
                ) : (
                  commissionEntries.map(e => (
                    <div key={e.id} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] font-medium truncate">{e.full_name}</p>
                          <Badge className="text-[8px] py-0 h-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Verified</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Fees: {e.total_fees}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[12px] font-semibold text-emerald-600">₹{e.commission_amount.toLocaleString()}</p>
                        <p className="text-[8px] text-muted-foreground">{new Date(e.verified_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Pending Verification */}
            {referrals.filter(r => !r.verified_by_admin && r.total_fees).length > 0 && (
              <Card className="shadow-none border-border/60">
                <CardContent className="p-0">
                  <div className="px-3 py-2 border-b border-border flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <p className="text-[11px] font-semibold">Pending Verification</p>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      {referrals.filter(r => !r.verified_by_admin && r.total_fees).length}
                    </Badge>
                  </div>
                  {referrals.filter(r => !r.verified_by_admin && r.total_fees).slice(0, 10).map(r => {
                    const numericFee = parseFloat(String(r.total_fees || '0').replace(/[^0-9.-]/g, ''));
                    const potentialCommission = isNaN(numericFee) ? 0 : Math.round(numericFee * 0.1);
                    return (
                      <button key={r.id} onClick={() => navigate(`/editor/referrals/${r.id}`)}
                        className="w-full flex items-center justify-between px-3 py-2 border-b border-border last:border-0 hover:bg-muted/30 transition-colors text-left">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-[12px] font-medium truncate">{r.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{r.total_fees}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-medium text-amber-600">₹{potentialCommission.toLocaleString()}</p>
                          <p className="text-[8px] text-muted-foreground">Potential commission</p>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* STUDENTS */}
          <TabsContent value="students" className="pt-2">
            {loadingStudents ? (
              <div className="text-center py-8 text-xs text-muted-foreground">Loading...</div>
            ) : students.length === 0 ? (
              <Card className="shadow-none border-border/60"><CardContent className="py-6 text-center space-y-1">
                <Users className="h-6 w-6 mx-auto text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No students assigned yet</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                {students.map(s => {
                  const init = (s.full_name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <button key={s.user_id} onClick={() => navigate(`/editor/students/${s.user_id}`)}
                      className="group text-left rounded-lg border border-border/60 bg-card hover:border-primary/40 transition-all p-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-primary text-[10px]">{init}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold truncate leading-tight">{s.full_name || 'Unnamed'}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{s.country_of_education || '—'}</p>
                        </div>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TASKS */}
          <TabsContent value="tasks" className="pt-2"><TasksInbox /></TabsContent>

          {/* BLOG */}
          <TabsContent value="blog" className="pt-2">
            {loadingBlogs ? (
              <div className="text-center py-8 text-xs text-muted-foreground">Loading articles...</div>
            ) : blogs.length === 0 ? (
              <Card className="shadow-none border-border/60"><CardContent className="py-6 text-center space-y-1">
                <BookMarked className="h-6 w-6 mx-auto text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No published articles yet</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {blogs.map(blog => (
                  <a key={blog.id} href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer"
                    className="block rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all p-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-4 font-normal ${categoryColors[blog.category] || categoryColors.general}`}>
                        {blog.category.replace('-', ' ')}
                      </Badge>
                      {blog.read_time_minutes && (
                        <span className="text-[9px] text-muted-foreground shrink-0">{blog.read_time_minutes} min</span>
                      )}
                    </div>
                    <h3 className="text-[12px] font-semibold leading-snug line-clamp-2 mb-1">{blog.title}</h3>
                    {blog.excerpt && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{blog.excerpt}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground mt-2">
                      {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : ''}
                    </p>
                  </a>
                ))}
              </div>
            )}
            {blogs.length > 0 && (
              <div className="text-center pt-2">
                <a href="/blog" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-medium">
                  View all articles →
                </a>
              </div>
            )}
          </TabsContent>

          {/* RESOURCES */}
          <TabsContent value="resources" className="pt-2">
            {loadingResources ? (
              <div className="text-center py-8 text-xs text-muted-foreground">Loading resources...</div>
            ) : resources.length === 0 ? (
              <Card className="shadow-none border-border/60"><CardContent className="py-6 text-center space-y-1">
                <BookOpen className="h-6 w-6 mx-auto text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No resources available</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {resources.map(r => (
                  <a key={r.id} href={r.view_url || r.external_url || '#'} target="_blank" rel="noopener noreferrer"
                    className="block rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-3 w-3" />
                      </div>
                      <Badge variant="secondary" className="text-[8px] px-1.5 py-0 h-4">{r.category}</Badge>
                    </div>
                    <h3 className="text-[12px] font-semibold leading-snug truncate mb-0.5">{r.title}</h3>
                    {r.description && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{r.description}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground mt-1.5 capitalize">{r.type}</p>
                  </a>
                ))}
              </div>
            )}
            <div className="text-center pt-2">
              <a href="/resources" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-medium">
                Browse all resources →
              </a>
            </div>
          </TabsContent>

          {/* GERMAN COURSE */}
          <TabsContent value="german" className="pt-2">
            {loadingVideos ? (
              <div className="text-center py-8 text-xs text-muted-foreground">Loading lectures...</div>
            ) : videos.length === 0 ? (
              <Card className="shadow-none border-border/60"><CardContent className="py-6 text-center space-y-1">
                <Youtube className="h-6 w-6 mx-auto text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No course videos available</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {['A1', 'A2', 'B1'].map(lvl => {
                  const lvlVideos = videos.filter(v => v.level === lvl);
                  if (lvlVideos.length === 0) return null;
                  return (
                    <div key={lvl}>
                      <div className="flex items-center gap-2 px-1 mb-1">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{lvl}</span>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {lvlVideos.map(v => (
                          <div key={v.id} className="rounded-lg border border-border/60 bg-card hover:border-primary/40 transition-all overflow-hidden">
                            <a href={v.youtube_url || v.video_url || '#'} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2.5">
                              <div className="w-12 h-8 rounded bg-black/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                                {v.youtube_url && v.video_id ? (
                                  <img src={`https://img.youtube.com/vi/${v.video_id}/default.jpg`} className="w-full h-full object-cover opacity-80" alt="" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium truncate">{v.title}</p>
                                <p className="text-[8px] text-muted-foreground">#{v.order_index} · {v.level}</p>
                              </div>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="text-center pt-2">
              <a href="/german-course" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-medium">
                Open full course →
              </a>
            </div>
          </TabsContent>

          {/* TOOLS */}
          <TabsContent value="tools" className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button onClick={() => navigate('/europass-cv')}
                className="rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold">Europass CV Generator</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Create Europass-format CVs for student applications</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </button>

              <button onClick={() => navigate('/converter')}
                className="rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold">Grade Converter</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Convert academic grades to German grading system</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EditorDashboard;
