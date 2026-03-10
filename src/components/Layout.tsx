import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logos from '@/assets/logos.png';

import {
  Home,
  Briefcase,
  GraduationCap,
  FileText,
  User,
  Settings,
  Users,
  FileBarChart,
  LogOut,
  Bell,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { supabase } from '@/integrations/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AdminMobileBottomNav from '@/components/AdminMobileBottomNav';
import StudentMobileBottomNav from '@/components/StudentMobileBottomNav';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; time: string; type?: string | null; ref_id?: string | null }>>([]);
  const [unseen, setUnseen] = useState(0);
  const [pendingReviews, setPendingReviews] = useState<number>(0);
  const [openRequests, setOpenRequests] = useState<number>(0);
  // Student-side counts
  const [docCount, setDocCount] = useState<number>(0);
  const [appCount, setAppCount] = useState<number>(0);
  const [svcCount, setSvcCount] = useState<number>(0);
  // Suppression flags: keep badges hidden after visit until new changes arrive
  const [suppressAdminReviews, setSuppressAdminReviews] = useState(false);
  const [suppressAdminRequests, setSuppressAdminRequests] = useState(false);
  const [suppressDocs, setSuppressDocs] = useState(false);
  const [suppressApps, setSuppressApps] = useState(false);
  const [suppressSvcs, setSuppressSvcs] = useState(false);
  // Last seen timestamps (ms) for when user visited the corresponding pages
  const [seenAdminReviewsAt, setSeenAdminReviewsAt] = useState<number>(0);
  const [seenAdminRequestsAt, setSeenAdminRequestsAt] = useState<number>(0);
  const [seenDocsAt, setSeenDocsAt] = useState<number>(0);
  const [seenAppsAt, setSeenAppsAt] = useState<number>(0);
  const [seenSvcsAt, setSeenSvcsAt] = useState<number>(0);
  const navigate = useNavigate();
  const markAllAsRead = async () => {
    if (!profile?.user_id) return;
    try {
      await supabase.from('notifications' as any).update({ seen: true }).eq('user_id', profile.user_id).eq('seen', false);
      setUnseen(0);
    } catch (e) {
      console.error('Mark read failed', e);
    }
  };

  const isAdmin = profile?.role === 'admin';

  const studentNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/services', label: 'Services', icon: Briefcase },
    { href: '/applications', label: 'Applications', icon: GraduationCap },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/europass-cv', label: 'Europass CV', icon: FileText },
    { href: '/payments', label: 'Contract', icon: FileText },
    { href: '/reviews', label: 'Write a Review', icon: Star },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/requests', label: 'Requests', icon: FileBarChart },
    { href: '/admin/payments', label: 'Payments', icon: FileText },
    { href: '/admin/contracts', label: 'Contracts', icon: FileText },
    { href: '/admin/blog', label: 'Blog Management', icon: FileText },
    { href: '/admin/exports', label: 'Exports', icon: Settings },
    { href: '/admin/reviews', label: 'Reviews', icon: Star },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  useEffect(() => {
    if (!profile?.user_id) return;
    // Initialize suppression flags from localStorage per user
    try {
      const key = (k: string) => `badge_suppress:${profile.user_id}:${k}`;
      setSuppressAdminReviews(localStorage.getItem(key('admin_reviews')) === '1');
      setSuppressAdminRequests(localStorage.getItem(key('admin_requests')) === '1');
      setSuppressDocs(localStorage.getItem(key('docs')) === '1');
      setSuppressApps(localStorage.getItem(key('apps')) === '1');
      setSuppressSvcs(localStorage.getItem(key('svcs')) === '1');
      const tkey = (k: string) => `badge_seen_at:${profile.user_id}:${k}`;
      setSeenAdminReviewsAt(parseInt(localStorage.getItem(tkey('admin_reviews')) || '0', 10));
      setSeenAdminRequestsAt(parseInt(localStorage.getItem(tkey('admin_requests')) || '0', 10));
      setSeenDocsAt(parseInt(localStorage.getItem(tkey('docs')) || '0', 10));
      setSeenAppsAt(parseInt(localStorage.getItem(tkey('apps')) || '0', 10));
      setSeenSvcsAt(parseInt(localStorage.getItem(tkey('svcs')) || '0', 10));
    } catch {}

    const fetchNotifs = async () => {
      const { data, error } = await supabase
        .from('notifications' as any)
        .select('id, title, created_at, seen, type, ref_id')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error) {
        setNotifications((data || []).map((n: any) => ({ id: n.id, title: n.title, time: new Date(n.created_at).toLocaleString(), type: n.type, ref_id: n.ref_id })));
        setUnseen((data || []).filter((n: any) => !n.seen).length);
      }
    };

    fetchNotifs();

    const channel = supabase
      .channel(`notifs-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.user_id}` }, (_payload) => {
        fetchNotifs();
      })
      .subscribe();

    // Admin-only counts
    const fetchAdminCounts = async () => {
      if ((profile as any)?.role !== 'admin') return;
      try {
        const { count: reviewsCount } = await (supabase as any)
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('is_approved', false);
        setPendingReviews(reviewsCount || 0);

        const { count: requestsCount } = await (supabase as any)
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .in('status', ['new', 'in_review', 'payment_pending', 'in_progress']);
        setOpenRequests(requestsCount || 0);
      } catch (e) {
        // ignore silently
      }
    };

    const reviewsChannel = supabase
      .channel('reviews-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, (payload: any) => {
        const ts = Date.parse(payload?.commit_timestamp || '') || Date.now();
        if (ts > seenAdminReviewsAt) {
          try { localStorage.removeItem(`badge_suppress:${profile.user_id}:admin_reviews`); } catch {}
          setSuppressAdminReviews(false);
          fetchAdminCounts();
        }
      })
      .subscribe();

    // Student-only counts
    const fetchStudentCounts = async () => {
      if ((profile as any)?.role !== 'student') return;
      try {
        // Documents: pending or rejected
        const { count: dCount } = await (supabase as any)
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .in('status', ['pending', 'rejected']);
        setDocCount(dCount || 0);

        // Applications: submitted or interview
        const { count: aCount } = await (supabase as any)
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .in('status', ['submitted', 'interview']);
        setAppCount(aCount || 0);

        // Services: Show badge for completed requests updated after last view
        const { data: svcData } = await (supabase as any)
          .from('service_requests')
          .select('updated_at, status')
          .eq('user_id', profile.user_id)
          .eq('status', 'completed')
          .gt('updated_at', new Date(seenSvcsAt || 0).toISOString());
        setSvcCount(svcData?.length || 0);
      } catch {}
    };

    const docsCh = supabase
      .channel(`docs-count-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${profile.user_id}` }, (payload: any) => {
        const ts = Date.parse(payload?.commit_timestamp || '') || Date.now();
        if (ts > seenDocsAt) {
          try { localStorage.removeItem(`badge_suppress:${profile.user_id}:docs`); } catch {}
          setSuppressDocs(false);
          fetchStudentCounts();
        }
      })
      .subscribe();
    const appsCh = supabase
      .channel(`apps-count-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${profile.user_id}` }, (payload: any) => {
        const ts = Date.parse(payload?.commit_timestamp || '') || Date.now();
        if (ts > seenAppsAt) {
          try { localStorage.removeItem(`badge_suppress:${profile.user_id}:apps`); } catch {}
          setSuppressApps(false);
          fetchStudentCounts();
        }
      })
      .subscribe();
    const svcCh = supabase
      .channel(`svc-count-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `user_id=eq.${profile.user_id}` }, (payload: any) => {
        const ts = Date.parse(payload?.commit_timestamp || '') || Date.now();
        if (ts > seenSvcsAt) {
          try { localStorage.removeItem(`badge_suppress:${profile.user_id}:svcs`); } catch {}
          setSuppressSvcs(false);
          fetchStudentCounts();
        }
      })
      .subscribe();

    fetchStudentCounts();

    const requestsChannel = supabase
      .channel('service-requests-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, (payload: any) => {
        const ts = Date.parse(payload?.commit_timestamp || '') || Date.now();
        if (ts > seenAdminRequestsAt) {
          try { localStorage.removeItem(`badge_suppress:${profile.user_id}:admin_requests`); } catch {}
          setSuppressAdminRequests(false);
          fetchAdminCounts();
        }
      })
      .subscribe();

    fetchAdminCounts();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(docsCh);
      supabase.removeChannel(appsCh);
      supabase.removeChannel(svcCh);
    };
  }, [profile?.user_id]);

  // Clear badges when navigating to the corresponding page (desktop & mobile share this state in Layout)
  useEffect(() => {
    const path = location.pathname;
    // Admin clears
    if (path === '/admin/reviews' || path.startsWith('/admin/reviews/')) {
      setPendingReviews(0); setSuppressAdminReviews(true);
      try { const now = Date.now(); localStorage.setItem(`badge_suppress:${profile?.user_id}:admin_reviews`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:admin_reviews`, String(now)); } catch {}
    }
    if (path === '/admin/requests' || path.startsWith('/admin/requests/')) {
      setOpenRequests(0); setSuppressAdminRequests(true);
      try { const now = Date.now(); localStorage.setItem(`badge_suppress:${profile?.user_id}:admin_requests`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:admin_requests`, String(now)); } catch {}
    }
    // Student clears
    if (path === '/documents' || path.startsWith('/documents/')) { setDocCount(0); setSuppressDocs(true); try { const now = Date.now(); localStorage.setItem(`badge_suppress:${profile?.user_id}:docs`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:docs`, String(now)); } catch {} }
    if (path === '/applications' || path.startsWith('/applications/')) { setAppCount(0); setSuppressApps(true); try { const now = Date.now(); localStorage.setItem(`badge_suppress:${profile?.user_id}:apps`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:apps`, String(now)); } catch {} }
    if (path === '/services' || path.startsWith('/services/')) { setSvcCount(0); setSuppressSvcs(true); try { const now = Date.now(); localStorage.setItem(`badge_suppress:${profile?.user_id}:svcs`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:svcs`, String(now)); } catch {} }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">

      {/* Desktop Layout */}
      {/* If admin, show a top navigation bar. If student, show student top navigation. */}
      {isAdmin ? (
        <div className="hidden md:flex min-h-screen flex-col">
          {/* Admin Top Navbar (Desktop) */}
          <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 py-1.5 px-3 md:px-5">
            <div className="mx-auto w-full max-w-6xl flex items-center justify-between">
              {/* Left: Brand */}
              <Link to="/admin" className="flex items-center gap-3" aria-label="Admin home">
                 <div className="h-8 w-8 rounded-md overflow-hidden shrink-0">
                   <img src={logos} alt="publicgermany logo" className="h-full w-full object-contain object-center" />
                 </div>
                 <div className="flex flex-col leading-tight">
                   <span className="font-bold text-sm text-foreground tracking-tight">publicgermany</span>
                   <span className="text-[10px] text-muted-foreground">Admin</span>
                 </div>
              </Link>

              {/* Center: Horizontal Nav */}
              <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
                {adminNavItems.map((item) => {
                  const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                       "relative pb-0.5 text-xs font-medium whitespace-nowrap transition-colors after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity",
                         active ? "text-primary after:opacity-100" : "text-foreground/90 hover:text-primary hover:after:opacity-60"
                      )}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        const now = Date.now();
                        if (item.href === '/admin/reviews') {
                          setPendingReviews(0); setSuppressAdminReviews(true);
                          try { localStorage.setItem(`badge_suppress:${profile?.user_id}:admin_reviews`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:admin_reviews`, String(now)); } catch {}
                        }
                        if (item.href === '/admin/requests') {
                          setOpenRequests(0); setSuppressAdminRequests(true);
                          try { localStorage.setItem(`badge_suppress:${profile?.user_id}:admin_requests`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:admin_requests`, String(now)); } catch {}
                        }
                      }}
                    >
                      <span className="relative inline-flex items-center">
                        {item.label}
                        {item.href === '/admin/reviews' && pendingReviews > 0 && !active && !suppressAdminReviews && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                            {pendingReviews > 99 ? '99+' : pendingReviews}
                          </span>
                        )}
                        {item.href === '/admin/requests' && openRequests > 0 && !active && !suppressAdminRequests && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                            {openRequests > 99 ? '99+' : openRequests}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </nav>
              {/* Right: Theme, Notifications, Avatar, Sign out */}
              <div className="flex items-center gap-2">
                <ThemeToggle variant="icon" />
                <div className="relative">
                  <Button variant="ghost" size="icon" onClick={() => { setNotifOpen(v => !v); setUnseen(0); }} aria-label="Notifications" className="relative">
                    <Bell className="h-5 w-5" />
                    {unseen > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1">
                        {unseen > 99 ? '99+' : unseen}
                      </span>
                    )}
                  </Button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-96 max-w-[90vw] z-50 rounded-md border bg-popover text-popover-foreground shadow-md">
                      <div className="p-2 border-b text-sm font-medium flex items-center justify-between">
                        <span>Notifications</span>
                        <span className="text-xs text-muted-foreground">{unseen} unread</span>
                      </div>
                      <div className="max-h-72 overflow-auto">
                        {notifications.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">No notifications yet</div>
                        ) : (
                          notifications.map(n => {
                            const onClick = () => {
                              if (isAdmin) {
                                if (n.type === 'student' && n.ref_id) navigate(`/admin/students/${n.ref_id}`);
                                else if (n.type === 'service_request') navigate('/admin/requests');
                                else navigate('/admin');
                              } else {
                                if (n.type === 'application') navigate('/applications');
                                else if (n.type === 'document') navigate('/documents');
                                else if (n.type === 'service_request') navigate('/services');
                                else navigate('/profile');
                              }
                              setNotifOpen(false);
                            };
                            return (
                              <button key={n.id} onClick={onClick} className="w-full text-left p-3 text-sm border-b last:border-b-0 hover:bg-accent/30">
                                <div className="font-medium">{n.title}</div>
                                <div className="text-xs text-muted-foreground">{n.time}</div>
                              </button>
                            );
                          })
                        )}
                      </div>
                      <div className="p-2 flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={markAllAsRead}>Mark all as read</Button>
                        <Button size="sm" variant="ghost" onClick={() => setNotifications([])}>Clear</Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary/60">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={(profile as any)?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={async () => {
                          await signOut();
                          navigate('/');
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
             <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex min-h-screen flex-col">
          {/* Student Top Navbar (Desktop) */}
          <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 py-1 px-2 md:px-3">
            <div className="mx-auto w-full max-w-7xl flex items-center justify-between gap-3">
              {/* Left: Brand */}
              <Link to="/dashboard" className="flex items-center gap-2 shrink-0" aria-label="Student home">
                <div className="h-8 w-8 rounded-md overflow-hidden shrink-0">
                  <img src={logos} alt="publicgermany logo" className="h-full w-full object-contain object-center" />
                </div>
                <div className="hidden xl:flex flex-col leading-tight">
                  <span className="font-bold text-base text-foreground tracking-tight">publicgermany</span>
                  <span className="text-[10px] text-muted-foreground">Student</span>
                </div>
              </Link>

              {/* Center: Horizontal Nav */}
              <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center overflow-hidden">
                {studentNavItems.map((item) => {
                  const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "relative pb-0.5 px-1.5 xl:px-2 text-xs xl:text-sm font-medium whitespace-nowrap transition-colors after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity",
                        active ? "text-primary after:opacity-100" : "text-foreground/90 hover:text-primary hover:after:opacity-60"
                      )}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        const now = Date.now();
                        if (item.href === '/documents') { setDocCount(0); setSuppressDocs(true); try { localStorage.setItem(`badge_suppress:${profile?.user_id}:docs`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:docs`, String(now)); } catch {} }
                        if (item.href === '/applications') { setAppCount(0); setSuppressApps(true); try { localStorage.setItem(`badge_suppress:${profile?.user_id}:apps`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:apps`, String(now)); } catch {} }
                        if (item.href === '/services') { setSvcCount(0); setSuppressSvcs(true); try { localStorage.setItem(`badge_suppress:${profile?.user_id}:svcs`, '1'); localStorage.setItem(`badge_seen_at:${profile?.user_id}:svcs`, String(now)); } catch {} }
                      }}
                    >
                      <span className="relative inline-flex items-center">
                        {item.label}
                        {item.href === '/documents' && docCount > 0 && !active && !suppressDocs && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                            {docCount > 99 ? '99+' : docCount}
                          </span>
                        )}
                        {item.href === '/applications' && appCount > 0 && !active && !suppressApps && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                            {appCount > 99 ? '99+' : appCount}
                          </span>
                        )}
                        {item.href === '/services' && svcCount > 0 && !active && !suppressSvcs && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                            {svcCount > 99 ? '99+' : svcCount}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Right: Theme, Notifications, Avatar, Sign out */}
              <div className="flex items-center gap-1 shrink-0">
                <ThemeToggle variant="icon" />
                <div className="relative">
                  <Button variant="ghost" size="icon" onClick={() => { setNotifOpen(v => !v); setUnseen(0); }} aria-label="Notifications" className="relative">
                    <Bell className="h-5 w-5" />
                    {unseen > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1">
                        {unseen > 99 ? '99+' : unseen}
                      </span>
                    )}
                  </Button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-96 max-w-[90vw] z-50 rounded-md border bg-popover text-popover-foreground shadow-md">
                      <div className="p-2 border-b text-sm font-medium flex items-center justify-between">
                        <span>Notifications</span>
                        <span className="text-xs text-muted-foreground">{unseen} unread</span>
                      </div>
                      <div className="max-h-72 overflow-auto">
                        {notifications.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">No notifications yet</div>
                        ) : (
                          notifications.map(n => {
                            const onClick = () => {
                              if (isAdmin) {
                                if (n.type === 'student' && n.ref_id) navigate(`/admin/students/${n.ref_id}`);
                                else if (n.type === 'service_request') navigate('/admin/requests');
                                else navigate('/admin');
                              } else {
                                if (n.type === 'application') navigate('/applications');
                                else if (n.type === 'document') navigate('/documents');
                                else if (n.type === 'service_request') navigate('/services');
                                else navigate('/profile');
                              }
                              setNotifOpen(false);
                            };
                            return (
                              <button key={n.id} onClick={onClick} className="w-full text-left p-3 text-sm border-b last:border-b-0 hover:bg-accent/30">
                                <div className="font-medium">{n.title}</div>
                                <div className="text-xs text-muted-foreground">{n.time}</div>
                              </button>
                            );
                          })
                        )}
                      </div>
                      <div className="p-2 flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={markAllAsRead}>Mark all as read</Button>
                        <Button size="sm" variant="ghost" onClick={() => setNotifications([])}>Clear</Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary/60">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={(profile as any)?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={async () => {
                          await signOut();
                          navigate('/');
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </div>
      )}

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 border-b sticky top-0 z-50">
          <div className="flex items-center justify-between h-12 px-2">
            {/* Left: Bell + Avatar */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => { setNotifOpen(v => !v); setUnseen(0); }} aria-label="Notifications" className="h-8 w-8 relative">
                  <Bell className="h-4 w-4" />
                  {unseen > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[8px] px-0.5">
                      {unseen > 99 ? '99+' : unseen}
                    </span>
                  )}
                </Button>
                {notifOpen && (
                  <div className="absolute left-0 mt-2 w-72 max-w-[85vw] z-50 rounded-md border bg-popover text-popover-foreground shadow-lg">
                    <div className="p-2 border-b text-xs font-bold uppercase tracking-tight text-muted-foreground">Notifications</div>
                    <div className="max-h-60 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground italic">No notifications yet</div>
                      ) : (
                        notifications.map(n => {
                          const onClick = () => {
                            if (isAdmin) {
                              if (n.type === 'student' && n.ref_id) navigate(`/admin/students/${n.ref_id}`);
                              else if (n.type === 'service_request') navigate('/admin/requests');
                              else navigate('/admin');
                            } else {
                              if (n.type === 'application') navigate('/applications');
                              else if (n.type === 'document') navigate('/documents');
                              else if (n.type === 'service_request') navigate('/services');
                              else navigate('/profile');
                            }
                            setNotifOpen(false);
                          };
                          return (
                            <button key={n.id} onClick={onClick} className="w-full text-left p-2.5 text-xs border-b last:border-b-0 hover:bg-accent/30 transition-colors">
                              <div className="font-semibold line-clamp-2">{n.title}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{n.time}</div>
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="p-1.5 border-t flex items-center justify-between bg-muted/20">
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={markAllAsRead}>Mark read</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => setNotifications([])}>Clear</Button>
                    </div>
                  </div>
                )}
              </div>
              <Avatar className="h-7 w-7 border">
                <AvatarImage src={(profile as any)?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Center: Brand */}
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-sm overflow-hidden bg-white">
                <img src={logos} alt="logo" className="h-full w-full object-contain" />
              </div>
              <span className="font-bold text-xs tracking-tight text-foreground">publicgermany</span>
            </div>

            {/* Right: Theme + Sign Out */}
            <div className="flex items-center gap-0.5">
              <ThemeToggle variant="icon" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={async () => {
                  if (window.confirm('Sign out?')) {
                    await signOut();
                    navigate('/auth');
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Main Content */}
        <main className="p-3 sm:p-4 max-w-full pb-[calc(env(safe-area-inset-bottom)+4.5rem)] overflow-x-hidden">
          {children}
        </main>
        {isAdmin ? <AdminMobileBottomNav /> : <StudentMobileBottomNav />}
      </div>
    </div>
  );
};

export default Layout;