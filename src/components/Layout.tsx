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
    { href: '/resources', label: 'Resources', icon: FileText },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/reviews', label: 'Write a Review', icon: Star },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/requests', label: 'Requests', icon: FileBarChart },
    { href: '/admin/payments', label: 'Payments', icon: FileText },
    { href: '/admin/exports', label: 'Exports', icon: Settings },
    { href: '/admin/reviews', label: 'Reviews', icon: Star },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  useEffect(() => {
    if (!profile?.user_id) return;

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchAdminCounts();
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

        // Services: new, in_review, payment_pending, in_progress
        const { count: sCount } = await (supabase as any)
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .in('status', ['new', 'in_review', 'payment_pending', 'in_progress']);
        setSvcCount(sCount || 0);
      } catch {}
    };

    const docsCh = supabase
      .channel(`docs-count-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${profile.user_id}` }, () => fetchStudentCounts())
      .subscribe();
    const appsCh = supabase
      .channel(`apps-count-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${profile.user_id}` }, () => fetchStudentCounts())
      .subscribe();
    const svcCh = supabase
      .channel(`svc-count-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `user_id=eq.${profile.user_id}` }, () => fetchStudentCounts())
      .subscribe();

    fetchStudentCounts();

    const requestsChannel = supabase
      .channel('service-requests-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        fetchAdminCounts();
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
    if (path === '/admin/reviews') setPendingReviews(0);
    if (path === '/admin/requests') setOpenRequests(0);
    // Student clears
    if (path === '/documents') setDocCount(0);
    if (path === '/applications') setAppCount(0);
    if (path === '/services') setSvcCount(0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">

      {/* Desktop Layout */}
      {/* If admin, show a top navigation bar. If student, show student top navigation. */}
      {isAdmin ? (
        <div className="hidden md:flex min-h-screen flex-col">
          {/* Admin Top Navbar (Desktop) */}
          <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 py-3 px-4 md:px-6">
            <div className="mx-auto w-full max-w-6xl flex items-center justify-between">
              {/* Left: Brand */}
              <Link to="/admin" className="flex items-center gap-3" aria-label="Admin home">
                <div className="h-10 w-10 rounded-md overflow-hidden shrink-0">
                  <img src={logos} alt="publicgermany logo" className="h-full w-full object-contain object-center" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-lg text-foreground tracking-tight flex items-center gap-2">
                    publicgermany
                    {(pendingReviews > 0 || openRequests > 0) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {pendingReviews > 0 && (<span>R:{pendingReviews}</span>)}
                        {openRequests > 0 && (<span>SR:{openRequests}</span>)}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">Admin</span>
                </div>
              </Link>

              {/* Center: Horizontal Nav */}
              <nav className="hidden lg:flex items-center gap-3 xl:gap-5">
                {adminNavItems.map((item) => {
                  const active = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "relative pb-1 text-base font-medium whitespace-nowrap transition-colors after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity",
                        active ? "text-primary after:opacity-100" : "text-foreground/90 hover:text-primary hover:after:opacity-60"
                      )}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        if (item.href === '/admin/reviews') setPendingReviews(0);
                        if (item.href === '/admin/requests') setOpenRequests(0);
                      }}
                    >
                      <span className="relative inline-flex items-center">
                        {item.label}
                        {item.href === '/admin/reviews' && pendingReviews > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                            {pendingReviews > 99 ? '99+' : pendingReviews}
                          </span>
                        )}
                        {item.href === '/admin/requests' && openRequests > 0 && (
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
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(profile as any)?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    onClick={async () => { await signOut(); navigate('/auth'); }}
                    variant="outline"
                    size="sm"
                    className="hidden md:inline-flex"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex min-h-screen flex-col">
          {/* Student Top Navbar (Desktop) */}
          <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 py-3 px-4 md:px-6">
            <div className="mx-auto w-full max-w-6xl flex items-center justify-between">
              {/* Left: Brand */}
              <Link to="/dashboard" className="flex items-center gap-3" aria-label="Student home">
                <div className="h-10 w-10 rounded-md overflow-hidden shrink-0">
                  <img src={logos} alt="publicgermany logo" className="h-full w-full object-contain object-center" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-lg text-foreground tracking-tight">publicgermany</span>
                  <span className="text-xs text-muted-foreground">Student</span>
                </div>
              </Link>

              {/* Center: Horizontal Nav */}
              <nav className="hidden lg:flex items-center gap-2 xl:gap-4 flex-wrap overflow-x-hidden">
                {studentNavItems.map((item) => {
                  const active = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "relative pb-0.5 text-sm font-medium whitespace-nowrap transition-colors after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity",
                        active ? "text-primary after:opacity-100" : "text-foreground/90 hover:text-primary hover:after:opacity-60"
                      )}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        if (item.href === '/documents') setDocCount(0);
                        if (item.href === '/applications') setAppCount(0);
                        if (item.href === '/services') setSvcCount(0);
                      }}
                    >
                      <span className="relative inline-flex items-center">
                        {item.label}
                        {item.href === '/documents' && docCount > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                            {docCount > 99 ? '99+' : docCount}
                          </span>
                        )}
                        {item.href === '/applications' && appCount > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                            {appCount > 99 ? '99+' : appCount}
                          </span>
                        )}
                        {item.href === '/services' && svcCount > 0 && (
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
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(profile as any)?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    onClick={async () => { await signOut(); navigate('/auth'); }}
                    variant="outline"
                    size="sm"
                    className="hidden md:inline-flex"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      )}

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="bg-card p-0">
          <div className="flex items-center justify-between relative">
            {/* Left: Bell + Avatar */}
            <div className="flex items-center gap-2 pl-2">
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
                  <div className="absolute left-0 mt-2 w-80 max-w-[90vw] z-50 rounded-md border bg-popover text-popover-foreground shadow-md">
                    <div className="p-2 border-b text-sm font-medium">Notifications</div>
                    <div className="max-h-64 overflow-auto">
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
              <Avatar className="h-8 w-8">
                <AvatarImage src={(profile as any)?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Center: Brand Logo + Name */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="h-8 w-8 rounded-md overflow-hidden">
                <img src={logos} alt="publicgermany logo" className="h-full w-full object-contain object-center" />
              </div>
              <span className="font-semibold text-base text-foreground">publicgermany</span>
            </div>

            {/* Right: Theme + Sign Out (icons) */}
            <div className="pr-2 flex items-center gap-1">
              <ThemeToggle variant="icon" />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={async () => {
                  const ok = window.confirm('Are you sure you want to sign out?');
                  if (!ok) return;
                  await signOut();
                  navigate('/auth');
                }}
              >
                <LogOut className="h-5 w-5" />
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