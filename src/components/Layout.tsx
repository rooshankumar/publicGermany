import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

    return () => { supabase.removeChannel(channel); };
  }, [profile?.user_id]);

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
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-lg text-foreground tracking-tight">publicgermany</span>
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
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Right: Theme, Notifications, Avatar, Sign out */}
              <div className="flex items-center gap-2">
                <ThemeToggle variant="icon" />
                <div className="relative">
                  <Button variant="ghost" size="icon" onClick={() => { setNotifOpen(v => !v); setUnseen(0); }} aria-label="Notifications">
                    <Bell className="h-5 w-5" />
                    {unseen > 0 && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-destructive rounded-full" />}
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
                    onClick={async () => { await signOut(); navigate('/'); }}
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
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Right: Theme, Notifications, Avatar, Sign out */}
              <div className="flex items-center gap-2">
                <ThemeToggle variant="icon" />
                <div className="relative">
                  <Button variant="ghost" size="icon" onClick={() => { setNotifOpen(v => !v); setUnseen(0); }} aria-label="Notifications">
                    <Bell className="h-5 w-5" />
                    {unseen > 0 && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-destructive rounded-full" />}
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
                    onClick={async () => { await signOut(); navigate('/'); }}
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
                <Button variant="ghost" size="icon" onClick={() => { setNotifOpen(v => !v); setUnseen(0); }} aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unseen > 0 && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-destructive rounded-full" />}
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

            {/* Center: Logo removed for mobile as requested */}

            {/* Right: Hamburger */}
            <div className="pr-2 flex items-center gap-1">
              <ThemeToggle variant="icon" />
              {/* Hide legacy drawer nav for both roles since we use bottom navs */}
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