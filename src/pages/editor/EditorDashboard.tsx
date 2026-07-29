import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';import { Button } from '@/components/ui/button';
import { useEditorPermissions } from '@/hooks/useEditorPermissions';
import { useMyReferrals, useMyTasks } from '@/hooks/useReferrals';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { QUALIFIED_STATUSES, statusColor, statusLabel } from '@/lib/referralConstants';
import MyReferralsPanel from '@/components/referrals/MyReferralsPanel';
import TasksInbox from '@/components/referrals/TasksInbox';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Users, ArrowUpRight, Star, CheckCircle2, AlertTriangle,
  CalendarClock, Clock, UserPlus, ClipboardList, BookOpen, Youtube,
  FileText, GraduationCap, ExternalLink, BookMarked, Play,
  TrendingUp, CreditCard, IndianRupee, ShieldCheck,
  Plus, Trash2, Edit2, Loader2, X, LogOut
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
  video_url: string | null;
  video_id: string | null;
  thumbnail_url: string | null;
  order_index: number;
  created_at: string;
}

interface CommissionEntry {
  id: string;
  full_name: string;
  total_fees: string;
  total_fees_numeric: number;
  admin_commission: number;
  editor_share: number;
  verified_at: string;
}

const StatCell = ({ label, value, icon: Icon, valueClassName }: any) => (
  <div className="flex items-center gap-2 px-3 py-2">
    <Icon className={`h-4 w-4 shrink-0 ${valueClassName || 'text-muted-foreground'}`} />
    <div>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className={`text-sm font-bold mt-px ${valueClassName || 'text-card-foreground'}`}>{value}</p>
    </div>
  </div>
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
  // Video management state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<CourseVideo | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoLevel, setVideoLevel] = useState('A1');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'direct'>('youtube');
  const [videoOrderIndex, setVideoOrderIndex] = useState(0);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
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
            const isInvalid = isNaN(numericFee) || numericFee <= 0;
            const adminCommission = isInvalid ? 0 : Math.round(numericFee * 0.1);
            return {
              id: r.id,
              full_name: r.full_name || 'Unknown',
              total_fees: r.total_fees || '—',
              total_fees_numeric: isInvalid ? 0 : numericFee,
              admin_commission: adminCommission,
              editor_share: isInvalid ? 0 : numericFee - adminCommission,
              verified_at: r.verified_at,
            };
          }).filter((r: any) => r.editor_share > 0);
          setCommissionEntries(entries);
        }
      } catch (e) {
        console.error('Error fetching commission data:', e);
      } finally {
        setLoadingCommission(false);
      }
    })();
  }, [user?.id]);

  const extractVideoId = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1).split(/[?#]/)[0];
      }
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
      return null;
    } catch (e) {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[7].length === 11) ? match[7] : null;
    }
  };

  const resetVideoForm = () => {
    setEditingVideo(null);
    setVideoTitle('');
    setVideoLevel('A1');
    setVideoUrl('');
    setVideoThumbnailUrl('');
    setVideoType('youtube');
    setVideoOrderIndex(0);
    setShowUploadForm(false);
  };

  const startEditVideo = (video: CourseVideo) => {
    setEditingVideo(video);
    setVideoTitle(video.title);
    setVideoLevel(video.level || 'A1');
    setVideoUrl(video.youtube_url || video.video_url || '');
    setVideoThumbnailUrl(video.thumbnail_url || '');
    setVideoType(video.youtube_url ? 'youtube' : 'direct');
    setVideoOrderIndex(video.order_index || 0);
    setShowUploadForm(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.startsWith('http')) {
      toast({ title: 'Invalid URL', description: 'Please provide a complete URL starting with http:// or https://', variant: 'destructive' });
      return;
    }
    let videoData: any = {
      title: videoTitle,
      level: videoLevel,
      order_index: videoOrderIndex,
      thumbnail_url: videoThumbnailUrl || null,
    };
    if (videoType === 'youtube') {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        toast({ title: 'Invalid YouTube URL', description: 'Please provide a valid YouTube link.', variant: 'destructive' });
        return;
      }
      videoData.youtube_url = videoUrl;
      videoData.video_id = videoId;
      videoData.video_url = null;
    } else {
      videoData.video_url = videoUrl;
      videoData.youtube_url = null;
      videoData.video_id = null;
    }
    try {
      setIsSubmittingVideo(true);
      if (editingVideo) {
        const { error } = await supabase.from('german_course_videos').update(videoData).eq('id', editingVideo.id);
        if (error) throw error;
        toast({ title: 'Video updated successfully' });
      } else {
        const { error } = await supabase.from('german_course_videos').insert([videoData]);
        if (error) throw error;
        toast({ title: 'Video added successfully' });
      }
      resetVideoForm();
      const { data } = await supabase.from('german_course_videos').select('*').order('order_index', { ascending: true });
      setVideos((data || []) as CourseVideo[]);
    } catch (error: any) {
      toast({ title: 'Error saving video', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const { error } = await supabase.from('german_course_videos').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Video deleted successfully' });
      const { data } = await supabase.from('german_course_videos').select('*').order('order_index', { ascending: true });
      setVideos((data || []) as CourseVideo[]);
    } catch (error: any) {
      toast({ title: 'Error deleting video', description: error.message, variant: 'destructive' });
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const todaysFollowups = referrals.filter(r => r.next_followup_date === today).length;
    const overdue = referrals.filter(r => r.next_followup_date && r.next_followup_date < today && !['completed', 'lost', 'not_interested'].includes(r.current_status)).length;
    const qualified = referrals.filter(r => QUALIFIED_STATUSES.includes(r.current_status)).length;
    const converted = referrals.filter(r => !!r.converted_student_id).length;
    const pendingTasks = (tasks as any[]).filter(t => t.status === 'open').length;
    const totalEditorShare = commissionEntries.reduce((s, e) => s + e.editor_share, 0);
    const totalAdminCommission = commissionEntries.reduce((s, e) => s + e.admin_commission, 0);
    const totalFeesProcessed = commissionEntries.reduce((s, e) => s + e.total_fees_numeric, 0);
    const verifiedCount = commissionEntries.length;
    return { 
      assigned: students.length, 
      referrals: referrals.length, 
      todaysFollowups, 
      overdue, 
      qualified, 
      converted, 
      pendingTasks,
      totalEditorShare,
      totalAdminCommission,
      totalFeesProcessed,
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
    general: 'bg-muted text-card-foreground dark:bg-muted/300/15 dark:text-muted-foreground/40',
  };

  return (
    <Layout>
      <div className="space-y-3">
        <div className="german-stripe w-full" />         <Tabs value={activeTab} onValueChange={(v) => setSearchParams(v === 'dashboard' ? {} : { tab: v })}>
          <div className="flex items-center border-b border-border bg-muted/60 -mx-4 px-4 sticky top-0 z-30">
            <TabsList className="h-11 p-1 bg-transparent flex-nowrap overflow-x-auto no-scrollbar flex-1 min-w-0 gap-1">
              <TabsTrigger value="dashboard" className="text-xs h-9 px-4 shrink-0 data-[state=active]:bg-background font-medium">Dashboard</TabsTrigger>
              <TabsTrigger value="referrals" className="text-xs h-9 px-4 shrink-0 data-[state=active]:bg-background font-medium">Referrals</TabsTrigger>
              <TabsTrigger value="students" className="text-xs h-9 px-4 shrink-0 data-[state=active]:bg-background font-medium">Students</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs h-9 px-4 shrink-0 data-[state=active]:bg-background font-medium">Tasks</TabsTrigger>
              <TabsTrigger value="revenue" className="text-xs h-9 px-4 shrink-0 data-[state=active]:bg-background font-medium">Revenue</TabsTrigger>
              <TabsTrigger value="blog" className="text-xs h-9 px-4 shrink-0 data-[state=active]:bg-background font-medium">Blog</TabsTrigger>
              <TabsTrigger value="resources" className="text-xs h-9 px-4 shrink-0 data-[state=active]:bg-background font-medium">Resources</TabsTrigger>
              <TabsTrigger value="german" className="text-xs h-9 px-4 shrink-0 data-[state=active]:bg-background font-medium">German</TabsTrigger>
              <TabsTrigger value="tools" className="text-xs h-9 px-4 shrink-0 data-[state=active]:bg-background font-medium">Tools</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 shrink-0 pl-3 border-l border-border/50 ml-3">
              <ThemeToggle variant="icon" />
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {profile?.full_name?.charAt(0) || 'E'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/auth');
                }}
                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="pt-2 space-y-3">
            {/* Stats row - table-like */}
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
                <StatCell label="Assigned Students" value={stats.assigned} icon={Users} />
                <StatCell label="My Referrals" value={stats.referrals} icon={UserPlus} />
                <StatCell label="My Revenue (90%)" value={`₹${stats.totalEditorShare.toLocaleString()}`} icon={IndianRupee} valueClassName="text-emerald-600" />
                <StatCell label="Pending Tasks" value={stats.pendingTasks} icon={ClipboardList} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Recent Referrals - Table-like */}
              <div className="border rounded-lg bg-card overflow-hidden">
                <div className="px-3 py-2 border-b flex items-center gap-1.5 text-[11px] font-semibold text-card-foreground">
                  <Users className="h-3.5 w-3.5" /> Recent Referrals
                </div>
                {referrals.length === 0 ? (
                  <p className="text-center text-muted-foreground/70 py-6 text-[11px]">No referrals yet</p>
                ) : (
                  <>
                    {/* Column headers */}
                    <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr] gap-3 px-3 py-1.5 text-[8px] uppercase tracking-wider text-muted-foreground/70 font-semibold bg-muted/20">
                      <span>Name</span>
                      <span>Contact</span>
                      <span className="text-center">Status</span>
                    </div>
                    {referrals.slice(0, 5).map((r, idx) => (
                      <button key={r.id} onClick={() => navigate(`/editor/referrals/${r.id}`)}
                        className={`w-full grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] items-center gap-3 px-3 py-2 text-left text-[11px] hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}>
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-card-foreground truncate">{r.full_name}</p>
                          {r.verified_by_admin && <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />}
                        </div>
                        <p className="text-muted-foreground/70 truncate hidden sm:block">{r.phone || r.email || '—'}</p>
                        <span className={`inline-flex items-center justify-self-center rounded-full px-2 py-0.5 text-[9px] font-medium ${statusColor(r.current_status)}`}>{statusLabel(r.current_status)}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* My Revenue Summary - Table-like */}
              <div className="border rounded-lg bg-card overflow-hidden">
                <div className="px-3 py-2 border-b flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-500" /> My Revenue
                </div>
                {loadingCommission ? (
                  <p className="text-center text-muted-foreground/70 py-6 text-[11px]">Loading...</p>
                ) : commissionEntries.length === 0 ? (
                  <p className="text-center text-muted-foreground/70 py-6 text-[11px]">No revenue earned yet</p>
                ) : (
                  <>
                    {/* Column headers */}
                    <div className="hidden sm:grid grid-cols-[1.5fr_1fr_1fr] gap-3 px-3 py-1.5 text-[8px] uppercase tracking-wider text-muted-foreground/70 font-semibold bg-muted/20">
                      <span>Lead</span>
                      <span className="text-center">Total Fee</span>
                      <span className="text-center text-emerald-600">My Share</span>
                    </div>
                    {commissionEntries.slice(0, 5).map((e, idx) => (
                      <div key={e.id} className={`grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_1fr] items-center gap-3 px-3 py-2 text-[11px] ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}>
                        <div className="min-w-0">
                          <p className="font-medium text-card-foreground truncate">{e.full_name}</p>
                          <p className="text-[9px] text-muted-foreground/70 truncate">{new Date(e.verified_at).toLocaleDateString()}</p>
                        </div>
                        <p className="text-card-foreground text-center hidden sm:block">₹{e.total_fees_numeric.toLocaleString()}</p>
                        <div className="text-right sm:text-center shrink-0">
                          <p className="font-semibold text-[11px] text-emerald-600">₹{e.editor_share.toLocaleString()}</p>
                          <p className="text-[8px] text-emerald-600/70">90% share</p>
                        </div>
                      </div>
                    ))}
                    {commissionEntries.length > 0 && (
                      <button onClick={() => setSearchParams({ tab: 'revenue' })}
                        className="w-full text-center text-[10px] text-primary hover:underline py-2 border-t">
                        View all revenue details →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats Row - table-like */}
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
                <div className="flex items-center gap-2 px-3 py-2">
                  <CalendarClock className="h-4 w-4 shrink-0 text-blue-500" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">Today's Follow-ups</p>
                    <p className="text-sm font-bold text-card-foreground mt-px">{stats.todaysFollowups}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">Overdue</p>
                    <p className="text-sm font-bold text-card-foreground mt-px">{stats.overdue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <Star className="h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">Qualified</p>
                    <p className="text-sm font-bold text-card-foreground mt-px">{stats.qualified}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">Converted</p>
                    <p className="text-sm font-bold text-card-foreground mt-px">{stats.converted}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* REFERRALS */}
          <TabsContent value="referrals" className="pt-2"><MyReferralsPanel /></TabsContent>

          {/* REVENUE */}
          <TabsContent value="revenue" className="pt-2 space-y-3">
            {/* Revenue Stats - table-like */}
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
                <div className="px-3 py-2">
                  <p className="text-[9px] font-medium text-emerald-600">My Revenue (90%)</p>
                  <p className="text-base font-bold text-emerald-600">₹{stats.totalEditorShare.toLocaleString()}</p>
                  <p className="text-[8px] text-muted-foreground/60">Admin gets ₹{stats.totalAdminCommission.toLocaleString()} (10%)</p>
                </div>
                <div className="px-3 py-2">
                  <p className="text-[9px] text-muted-foreground/60 font-medium">Verified Leads</p>
                  <p className="text-base font-bold text-card-foreground">{stats.verifiedCount}</p>
                </div>
                <div className="px-3 py-2">
                  <p className="text-[9px] text-muted-foreground/60 font-medium">Pending Verification</p>
                  <p className="text-base font-bold text-card-foreground">{stats.pendingVerification}</p>
                </div>
                <div className="px-3 py-2">
                  <p className="text-[9px] text-muted-foreground/60 font-medium">Avg. Share per Lead</p>
                  <p className="text-base font-bold text-card-foreground">
                    {stats.verifiedCount > 0 ? `₹${Math.round(stats.totalEditorShare / stats.verifiedCount).toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="px-3 py-2 border-b flex items-center justify-between">
                <p className="text-[11px] font-semibold text-emerald-600">Revenue Breakdown</p>
                {commissionEntries.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/70">{commissionEntries.length} verified leads</p>
                )}
              </div>
              {loadingCommission ? (
                <p className="text-center py-6 text-[11px] text-muted-foreground/70">Loading revenue data...</p>
              ) : commissionEntries.length === 0 ? (
                <div className="p-6 text-center space-y-1">
                  <CreditCard className="h-6 w-6 mx-auto text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No revenue earned yet</p>
                  <p className="text-[10px] text-muted-foreground/70/60">Leads must be verified by admin to receive your share</p>
                </div>
              ) : (
                <div className="hidden md:grid grid-cols-5 gap-2 px-3 py-1.5 text-[8px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                  <span className="col-span-2">Lead</span>
                  <span className="text-center">Total Fee</span>
                  <span className="text-center">Admin (10%)</span>
                  <span className="text-center text-emerald-600">My Share (90%)</span>
                </div>
              )}
              {!loadingCommission && commissionEntries.length > 0 && (
                commissionEntries.map(e => (
                  <div key={e.id} className="grid grid-cols-2 md:grid-cols-5 items-center gap-2 px-3 py-2 border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[12px] font-medium text-card-foreground truncate">{e.full_name}</p>
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-medium bg-emerald-50 text-emerald-700">Verified</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground/70">{new Date(e.verified_at).toLocaleDateString()}</p>
                    </div>
                    <p className="text-[11px] font-medium text-card-foreground text-center">₹{e.total_fees_numeric.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground/70 text-center">₹{e.admin_commission.toLocaleString()}</p>
                    <p className="text-[12px] font-bold text-emerald-600 text-center">₹{e.editor_share.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>

            {/* Pending Verification */}
            {referrals.filter(r => !r.verified_by_admin && r.total_fees).length > 0 && (
              <div className="border rounded-lg bg-card overflow-hidden">
                <div className="px-3 py-2 border-b flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-[11px] font-semibold text-emerald-600">Pending Verification</p>
                  <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {referrals.filter(r => !r.verified_by_admin && r.total_fees).length}
                  </span>
                </div>
                <div className="hidden md:grid grid-cols-4 gap-2 px-3 py-1.5 text-[8px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                  <span className="col-span-2">Lead</span>
                  <span className="text-center">Total Fee</span>
                  <span className="text-center text-emerald-600">My Share (90%)</span>
                </div>
                {referrals.filter(r => !r.verified_by_admin && r.total_fees).slice(0, 10).map(r => {
                  const numericFee = parseFloat(String(r.total_fees || '0').replace(/[^0-9.-]/g, ''));
                  const potentialEditorShare = isNaN(numericFee) ? 0 : Math.round(numericFee * 0.9);
                  return (
                    <button key={r.id} onClick={() => navigate(`/editor/referrals/${r.id}`)}
                      className="w-full grid grid-cols-2 md:grid-cols-4 items-center gap-2 px-3 py-2 border-b last:border-0 hover:bg-muted/30 transition-colors text-left">
                      <div className="col-span-2 min-w-0">
                        <p className="text-[12px] font-medium text-card-foreground truncate">{r.full_name}</p>
                        <p className="text-[10px] text-muted-foreground/70">{r.total_fees}</p>
                      </div>
                      <p className="text-[11px] font-medium text-card-foreground text-center">₹{numericFee.toLocaleString()}</p>
                      <div className="text-right md:text-center shrink-0">
                        <p className="text-[11px] font-medium text-emerald-600">₹{potentialEditorShare.toLocaleString()}</p>
                        <p className="text-[8px] text-emerald-600/70">Your 90% share</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* STUDENTS - Table-like */}
          <TabsContent value="students" className="pt-2">
            {loadingStudents ? (
              <div className="text-center py-8 text-xs text-muted-foreground/70">Loading...</div>
            ) : students.length === 0 ? (
              <div className="border rounded-lg bg-card py-6 text-center space-y-1">
                <Users className="h-6 w-6 mx-auto text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No students assigned yet</p>
              </div>
            ) : (
              <div className="border rounded-lg bg-card overflow-hidden">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_1fr_40px] gap-3 px-3 py-2 text-[8px] uppercase tracking-wider text-muted-foreground/70 font-semibold bg-muted/20 border-b">
                  <span>Student Name</span>
                  <span>Country</span>
                  <span />
                </div>
                {students.map((s, idx) => {
                  const init = (s.full_name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <button key={s.user_id} onClick={() => navigate(`/editor/students/${s.user_id}`)}
                      className={`w-full grid grid-cols-[1fr_1fr_40px] gap-3 items-center px-3 py-2.5 text-left text-[11px] hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 shrink-0"><AvatarFallback className="bg-primary/10 text-primary text-[9px]">{init}</AvatarFallback></Avatar>
                        <span className="font-medium text-card-foreground truncate">{s.full_name || 'Unnamed'}</span>
                      </div>
                      <span className="text-muted-foreground/70 truncate">{s.country_of_education || '—'}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 justify-self-end" />
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TASKS */}
          <TabsContent value="tasks" className="pt-2"><TasksInbox /></TabsContent>

          {/* BLOG - Table-like */}
          <TabsContent value="blog" className="pt-2">
            {loadingBlogs ? (
              <div className="text-center py-8 text-xs text-muted-foreground/70">Loading articles...</div>
            ) : blogs.length === 0 ? (
              <div className="border rounded-lg bg-card py-6 text-center space-y-1">
                <BookMarked className="h-6 w-6 mx-auto text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No published articles yet</p>
              </div>
            ) : (
              <div className="border rounded-lg bg-card overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_80px_80px] gap-3 px-3 py-1.5 text-[8px] uppercase tracking-wider text-muted-foreground/70 font-semibold bg-muted/20 border-b">
                  <span>Article</span>
                  <span className="text-center">Category</span>
                  <span className="text-center">Date</span>
                </div>
                {blogs.map((blog, idx) => (
                  <a key={blog.id} href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer"
                    className={`grid grid-cols-1 sm:grid-cols-[1fr_80px_80px] items-center gap-3 px-3 py-2 text-[11px] hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-medium ${categoryColors[blog.category] || categoryColors.general}`}>
                          {blog.category.replace('-', ' ')}
                        </span>
                        {blog.read_time_minutes && (
                          <span className="text-[8px] text-muted-foreground/60 shrink-0">{blog.read_time_minutes} min</span>
                        )}
                      </div>
                      <h3 className="font-medium text-card-foreground truncate">{blog.title}</h3>
                      {blog.excerpt && (
                        <p className="text-[9px] text-muted-foreground/70 truncate mt-px">{blog.excerpt}</p>
                      )}
                    </div>
                    <p className="text-[9px] text-muted-foreground/70 text-center hidden sm:block capitalize">{blog.category.replace('-', ' ')}</p>
                    <p className="text-[9px] text-muted-foreground/70 text-center hidden sm:block">
                      {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : ''}
                    </p>
                  </a>
                ))}
                <div className="text-center py-2 border-t">
                  <a href="/blog" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-medium">View all articles →</a>
                </div>
              </div>
            )}
          </TabsContent>

          {/* RESOURCES - Table-like */}
          <TabsContent value="resources" className="pt-2">
            {loadingResources ? (
              <div className="text-center py-8 text-xs text-muted-foreground/70">Loading resources...</div>
            ) : resources.length === 0 ? (
              <div className="border rounded-lg bg-card py-6 text-center space-y-1">
                <BookOpen className="h-6 w-6 mx-auto text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No resources available</p>
              </div>
            ) : (
              <div className="border rounded-lg bg-card overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_70px_70px] gap-3 px-3 py-1.5 text-[8px] uppercase tracking-wider text-muted-foreground/70 font-semibold bg-muted/20 border-b">
                  <span>Resource</span>
                  <span className="text-center">Category</span>
                  <span className="text-center">Type</span>
                </div>
                {resources.map((r, idx) => (
                  <a key={r.id} href={r.view_url || r.external_url || '#'} target="_blank" rel="noopener noreferrer"
                    className={`grid grid-cols-1 sm:grid-cols-[1fr_70px_70px] items-center gap-3 px-3 py-2 text-[11px] hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-card-foreground truncate">{r.title}</h3>
                        {r.description && (
                          <p className="text-[9px] text-muted-foreground/70 truncate mt-px">{r.description}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground/70 text-center hidden sm:block capitalize">{r.category}</p>
                    <p className="text-[9px] text-muted-foreground/70 text-center hidden sm:block capitalize">{r.type}</p>
                  </a>
                ))}
                <div className="text-center py-2 border-t">
                  <a href="/resources" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-medium">Browse all resources →</a>
                </div>
              </div>
            )}
          </TabsContent>

          {/* GERMAN COURSE - Table-like */}
          <TabsContent value="german" className="pt-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant={showUploadForm ? "ghost" : "default"}
                onClick={() => { if (showUploadForm) resetVideoForm(); else setShowUploadForm(true); }}
                className="h-7 text-[10px] font-bold px-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {showUploadForm ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                {showUploadForm ? 'Close' : 'Add Lecture'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/admin/german-course')}
                className="h-7 text-[10px] px-2"
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Full Manager
              </Button>
            </div>

            {showUploadForm && (
              <div className="border rounded-lg bg-muted/30">
                <div className="p-2">
                  <form onSubmit={handleSaveVideo} className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[120px] space-y-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Title</label>
                      <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} required
                        className="w-full h-7 text-[11px] px-2 rounded-md border border bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Lecture title" />
                    </div>
                    <div className="w-12 space-y-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Ord</label>
                      <input type="number" value={videoOrderIndex} onChange={(e) => setVideoOrderIndex(parseInt(e.target.value))}
                        className="w-full h-7 text-[11px] px-1 rounded-md border border bg-card focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="w-16 space-y-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Level</label>
                      <select value={videoLevel} onChange={(e) => setVideoLevel(e.target.value)}
                        className="w-full h-7 px-1 rounded-md border border bg-card text-[11px] focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                      </select>
                    </div>
                    <div className="w-20 space-y-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Type</label>
                      <select value={videoType} onChange={(e) => setVideoType(e.target.value as any)}
                        className="w-full h-7 px-1 rounded-md border border bg-card text-[11px] focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="youtube">YouTube</option>
                        <option value="direct">Direct</option>
                      </select>
                    </div>
                    <div className="flex-[2] min-w-[150px] space-y-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">URL</label>
                      <input placeholder="Video Link" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required
                        className="w-full h-7 text-[11px] px-2 rounded-md border border bg-card focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={resetVideoForm} className="h-7 text-[10px] px-2">X</Button>
                      <Button type="submit" size="sm" disabled={isSubmittingVideo} className="h-7 text-[10px] px-3 bg-primary text-primary-foreground hover:bg-primary/90">
                        {isSubmittingVideo ? <Loader2 className="h-3 w-3 animate-spin" /> : (editingVideo ? 'Update' : 'Save')}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loadingVideos ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : videos.length === 0 ? (
              <div className="border rounded-lg bg-card py-6 text-center space-y-1">
                <Youtube className="h-6 w-6 mx-auto text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No course videos available</p>
                <p className="text-[10px] text-muted-foreground/70/60">Click "Add Lecture" to add your first video.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {['A1', 'A2', 'B1'].map(lvl => {
                  const lvlVideos = videos.filter(v => v.level === lvl);
                  if (lvlVideos.length === 0) return null;
                  return (
                    <div key={lvl} className="border rounded-lg bg-card overflow-hidden">
                      {/* Level header */}
                      <div className="px-3 py-1.5 border-b bg-muted/20 flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{lvl}</span>
                        <span className="text-[8px] text-muted-foreground/70">({lvlVideos.length} lectures)</span>
                      </div>
                      {/* Column headers */}
                      <div className="hidden sm:grid grid-cols-[32px_1fr_80px_60px] gap-2 px-3 py-1.5 text-[8px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                        <span>#</span>
                        <span>Title</span>
                        <span className="text-center">Date</span>
                        <span className="text-center">Actions</span>
                      </div>
                      {lvlVideos.map((v, idx) => (
                        <div key={v.id} className={`grid grid-cols-[32px_1fr_60px] sm:grid-cols-[32px_1fr_80px_60px] items-center gap-2 px-3 py-2 text-[11px] hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}>
                          <div className="flex items-center">
                            <div className="w-7 aspect-video bg-black/10 rounded overflow-hidden shrink-0 relative group">
                              {v.youtube_url && v.video_id ? (
                                <img src={`https://img.youtube.com/vi/${v.video_id}/default.jpg`} className="w-full h-full object-cover opacity-80" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Play className="h-2.5 w-2.5 text-muted-foreground/70" /></div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity rounded">
                                <a href={v.youtube_url || v.video_url || '#'} target="_blank" rel="noopener noreferrer" className="h-4 w-4 flex items-center justify-center">
                                  <Play className="h-2 w-2 text-white fill-white" />
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span className="text-[8px] font-mono font-bold text-muted-foreground/70">#{v.order_index}</span>
                            <p className="text-card-foreground font-medium truncate">{v.title}</p>
                          </div>
                          <p className="text-[9px] text-muted-foreground/70 text-center hidden sm:block">{new Date(v.created_at).toLocaleDateString()}</p>
                          <div className="flex items-center justify-center gap-0.5">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditVideo(v)}>
                              <Edit2 className="h-3 w-3 text-muted-foreground/70" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:text-primary" onClick={() => handleDeleteVideo(v.id)}>
                              <Trash2 className="h-3 w-3 text-muted-foreground/70" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TOOLS - Table-like */}
          <TabsContent value="tools" className="pt-2">
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_1fr] gap-3 px-3 py-1.5 text-[8px] uppercase tracking-wider text-muted-foreground/70 font-semibold bg-muted/20 border-b">
                <span>Tool</span>
                <span>Description</span>
              </div>
              <button onClick={() => navigate('/europass-cv')}
                className={`w-full grid grid-cols-1 sm:grid-cols-[1fr_1fr] items-center gap-3 px-3 py-2 text-left text-[11px] hover:bg-muted/30 transition-colors bg-muted/10`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <p className="font-medium text-card-foreground">Europass CV Generator</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-muted-foreground/70">Create Europass-format CVs for student applications</p>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                </div>
              </button>
              <button onClick={() => navigate('/converter')}
                className={`w-full grid grid-cols-1 sm:grid-cols-[1fr_1fr] items-center gap-3 px-3 py-2 text-left text-[11px] hover:bg-muted/30 transition-colors`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <GraduationCap className="h-3.5 w-3.5" />
                  </div>
                  <p className="font-medium text-card-foreground">Grade Converter</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-muted-foreground/70">Convert academic grades to German grading system</p>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
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
