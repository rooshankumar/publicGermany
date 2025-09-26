import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home, Users, FileBarChart, CreditCard, MoreHorizontal, Settings, Star, Mail } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const AdminMobileBottomNav = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [openRequests, setOpenRequests] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: r } = await (supabase as any)
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .in('status', ['new', 'in_review', 'payment_pending', 'in_progress']);
        setOpenRequests(r || 0);

        const { count: rv } = await (supabase as any)
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('is_approved', false);
        setPendingReviews(rv || 0);
      } catch {}
    };

    const rch = supabase
      .channel('mb-admin-req')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, fetchCounts)
      .subscribe();
    const vch = supabase
      .channel('mb-admin-rev')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchCounts)
      .subscribe();

    fetchCounts();
    return () => {
      supabase.removeChannel(rch);
      supabase.removeChannel(vch);
    };
  }, []);

  const primary = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/requests', label: 'Requests', icon: FileBarChart },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  ];

  const more = [
    { href: '/admin/exports', label: 'Exports', icon: Settings },
    { href: '/admin/reviews', label: 'Reviews', icon: Star },
    { href: '/admin/email-logs', label: 'Email Logs', icon: Mail },
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <ul className="grid grid-cols-5 items-stretch h-14">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex">
                <Link
                  to={item.href}
                  className={cn(
                    'flex-1 relative flex flex-col items-center justify-center text-xs gap-1 rounded-md',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => {
                    if (item.href === '/admin/requests') setOpenRequests(0);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-none">{item.label}</span>
                  {item.href === '/admin/requests' && openRequests > 0 && (
                    <span className="absolute top-1.5 right-3 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                      {openRequests > 99 ? '99+' : openRequests}
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
                <button className="flex-1 flex flex-col items-center justify-center text-xs gap-1 rounded-md text-muted-foreground hover:text-foreground" aria-label="More">
                  <MoreHorizontal className="h-5 w-5" />
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
                        className="p-3 border rounded-lg flex items-center gap-3 hover:bg-accent/30 relative"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.href === '/admin/reviews' && pendingReviews > 0 && (
                          <span className="absolute top-2 right-2 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                            {pendingReviews > 99 ? '99+' : pendingReviews}
                          </span>
                        )}
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

export default AdminMobileBottomNav;
