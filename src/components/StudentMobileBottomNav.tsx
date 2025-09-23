import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Briefcase, GraduationCap, FileText, MoreHorizontal, Home, BookOpen, Bell, Star, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const StudentMobileBottomNav = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const primary = [
    { href: '/services', label: 'Services', icon: Briefcase },
    { href: '/applications', label: 'Applications', icon: GraduationCap },
    { href: '/documents', label: 'Documents', icon: FileText },
  ];

  const more = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/resources', label: 'Resources', icon: BookOpen },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/reviews', label: 'Reviews', icon: Star },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <ul className="grid grid-cols-4 items-stretch h-14">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex">
                <Link
                  to={item.href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center text-xs gap-1 rounded-md',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-none">{item.label}</span>
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
