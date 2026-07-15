import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, BookOpen, FileText, GraduationCap, Youtube, MoreHorizontal, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const EditorMobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const primary = [
    { href: '/editor', label: 'Dashboard', icon: Home },
    { href: '/resources', label: 'Resources', icon: BookOpen },
    { href: '/europass-cv', label: 'Europass CV', icon: FileText },
    { href: '/converter', label: 'Converter', icon: GraduationCap },
  ];

  const more = [
    { href: '/german-course', label: 'German Course', icon: Youtube },
    { href: '/editor', label: 'Dashboard', icon: Home },
    { href: '/resources', label: 'Resources', icon: BookOpen },
    { href: '/europass-cv', label: 'Europass CV', icon: FileText },
    { href: '/converter', label: 'Grade Converter', icon: GraduationCap },
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
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="leading-none">{item.label}</span>
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
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium leading-tight break-words">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <button
                    onClick={async () => {
                      setOpen(false);
                      await signOut();
                      navigate('/auth');
                    }}
                    className="w-full p-3 border border-destructive/30 rounded-lg flex items-center gap-3 text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default EditorMobileBottomNav;
