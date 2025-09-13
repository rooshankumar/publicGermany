import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import logo from '@/assets/germany-help-logo.png';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const isAdmin = profile?.role === 'admin';

  const studentNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/services', label: 'Services', icon: Briefcase },
    { href: '/applications', label: 'University Applications', icon: GraduationCap },
    { href: '/resources', label: 'Resources', icon: FileText },
    { href: '/documents', label: 'Documents', icon: FileText },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen">
        {/* Desktop Sidebar */}
  <div className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
          {/* Logo Header */}
          <div className="p-0">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="block" aria-label="Go to home">
              <img src={logo} alt="publicgermany" className="block w-full h-32 object-cover rounded-none" />
            </Link>
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
                      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <MobileNavigation />
              <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2 min-w-0" aria-label="Go to home">
                <img src={logo} alt="publicgermany" className="block w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-none" />
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={(profile as any)?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
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