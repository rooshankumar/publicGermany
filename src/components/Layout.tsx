import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Bell
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
    { href: '/aps', label: 'APS', icon: FileText },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: Users },
    { href: '/admin/requests', label: 'Requests', icon: FileBarChart },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/applications', label: 'Applications', icon: FileText },
    { href: '/admin/payments', label: 'Payments', icon: FileBarChart },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen">
        {/* Desktop Sidebar */}
  <div className="w-72 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
          {/* Logo Header */}
          <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <img src={logo} alt="GermanyHelp" className="w-10 h-10 rounded-lg transition-transform group-hover:scale-105" />
              <div>
                <h1 className="text-xl font-bold text-foreground">GermanyHelp</h1>
                <p className="text-sm text-muted-foreground">Study in Germany Platform</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-x-1"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
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
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MobileNavigation />
              <Link to="/dashboard" className="flex items-center space-x-2">
                <img src={logo} alt="GermanyHelp" className="w-8 h-8 rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold text-foreground">GermanyHelp</h1>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Mobile Main Content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;