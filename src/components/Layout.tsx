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
import MobileNavigation from './MobileNavigation';
import logos from '@/assets/logos.png';
import { supabase } from '@/integrations/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';

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
    { href: '/applications', label: 'University Applications', icon: GraduationCap },
    { href: '/resources', label: 'Resources', icon: FileText },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/requests', label: 'Requests', icon: FileBarChart },
    { href: '/admin/applications', label: 'Applications', icon: GraduationCap },
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
      <div className="hidden md:flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
          {/* Logo Header (match mobile style) */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-3" aria-label="Go to home">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <img src={logos} alt="publicgermany" className="w-full h-full object-cover object-left" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">publicgermany</h1>
                <p className="text-sm text-muted-foreground">Study in Germany</p>
              </div>
            </Link>
          </div>

          {/* Theme Toggle (Desktop) */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-end">
              <ThemeToggle variant="switch" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="relative">
                        <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        {item.href === '/notifications' && unseen > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 rounded-full bg-destructive text-[10px] leading-3 text-destructive-foreground flex items-center justify-center">
                            {unseen > 9 ? '9+' : unseen}
                          </span>
                        )}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center space-x-3 mb-4 p-3 rounded-lg bg-background">
              <Avatar className="h-10 w-10">
                <AvatarImage src={(profile as any)?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile?.role || 'Student'}
                </p>
              </div>
            </div>

            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="w-full justify-start hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>

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
              <MobileNavigation />
            </div>
          </div>
        </header>

        {/* Mobile Main Content */}
        <main className="p-3 sm:p-4 max-w-full pb-[calc(env(safe-area-inset-bottom)+4.5rem)] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;