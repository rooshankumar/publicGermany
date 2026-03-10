import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Briefcase, GraduationCap, FileText, MoreHorizontal, Home, BookOpen, Bell, Star, User, Calculator } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const StudentMobileBottomNav = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const [docCount, setDocCount] = useState(0);
  const [appCount, setAppCount] = useState(0);
  const [svcCount, setSvcCount] = useState(0);
  const [suppressDocs, setSuppressDocs] = useState(false);
  const [suppressApps, setSuppressApps] = useState(false);
  const [suppressSvcs, setSuppressSvcs] = useState(false);

  useEffect(() => {
    if (!profile?.user_id) return;
    const fetchCounts = async () => {
      try {
        const { count: d } = await (supabase as any)
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .in('status', ['pending', 'rejected']);
        setDocCount(d || 0);

        const { count: a } = await (supabase as any)
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .in('status', ['submitted', 'interview']);
        setAppCount(a || 0);

        const { count: s } = await (supabase as any)
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .in('status', ['new', 'in_review', 'payment_pending', 'in_progress']);
        setSvcCount(s || 0);
      } catch {}
    };

    const dch = supabase
      .channel(`sm-docs-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${profile.user_id}` }, () => { setSuppressDocs(false); fetchCounts(); })
      .subscribe();
    const ach = supabase
      .channel(`sm-apps-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${profile.user_id}` }, () => { setSuppressApps(false); fetchCounts(); })
      .subscribe();
    const sch = supabase
      .channel(`sm-svc-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `user_id=eq.${profile.user_id}` }, () => { setSuppressSvcs(false); fetchCounts(); })
      .subscribe();

    fetchCounts();
    return () => {
      supabase.removeChannel(dch);
      supabase.removeChannel(ach);
      supabase.removeChannel(sch);
    };
  }, [profile?.user_id]);

  // Hide badges after visiting their routes; reset only when new updates come in
  useEffect(() => {
    const path = location.pathname;
    if (path === '/documents' || path.startsWith('/documents/')) { setDocCount(0); setSuppressDocs(true); }
    if (path === '/applications' || path.startsWith('/applications/')) { setAppCount(0); setSuppressApps(true); }
    if (path === '/services' || path.startsWith('/services/')) { setSvcCount(0); setSuppressSvcs(true); }
  }, [location.pathname]);

  const primary = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/services', label: 'Services', icon: Briefcase },
    { href: '/applications', label: 'Applications', icon: GraduationCap },
    { href: '/documents', label: 'Documents', icon: FileText },
  ];

  const more = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/europass-cv', label: 'Europass CV', icon: FileText },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/payments', label: 'Contracts', icon: FileText },
    { href: '/reviews', label: 'Reviews', icon: Star },
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <ul className="grid grid-cols-5 items-stretch h-12 sm:h-14">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex">
                <Link
                  to={item.href}
                  className={cn(
                    'flex-1 relative flex flex-col items-center justify-center text-[10px] sm:text-xs gap-0.5 rounded-md',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => {
                    if (item.href === '/documents') { setDocCount(0); setSuppressDocs(true); }
                    if (item.href === '/applications') { setAppCount(0); setSuppressApps(true); }
                    if (item.href === '/services') { setSvcCount(0); setSuppressSvcs(true); }
                  }}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="leading-none">{item.label}</span>
                  {item.href === '/documents' && docCount > 0 && !active && !suppressDocs && (
                    <span className="absolute top-1.5 right-3 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                      {docCount > 99 ? '99+' : docCount}
                    </span>
                  )}
                  {item.href === '/applications' && appCount > 0 && !active && !suppressApps && (
                    <span className="absolute top-1.5 right-3 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                      {appCount > 99 ? '99+' : appCount}
                    </span>
                  )}
                  {item.href === '/services' && svcCount > 0 && !active && !suppressSvcs && (
                    <span className="absolute top-1.5 right-3 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                      {svcCount > 99 ? '99+' : svcCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}

          {/* More */}
          <li className="flex">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="flex-1 flex flex-col items-center justify-center text-[10px] sm:text-xs gap-0.5 rounded-md text-muted-foreground hover:text-foreground" aria-label="More">
                  <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="leading-none">More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <SheetHeader>
                  <SheetTitle>More</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {more.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setOpen(false)}
                        className="p-3 border rounded-lg flex items-center gap-3 hover:bg-accent/30"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default StudentMobileBottomNav;
