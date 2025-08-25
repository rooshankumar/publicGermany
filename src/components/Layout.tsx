import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  GraduationCap, 
  FileText, 
  HeadphonesIcon, 
  BookOpen, 
  MessageSquare,
  Settings,
  Users,
  FileBarChart,
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const isAdmin = profile?.role === 'admin';

  const studentNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/applications', label: 'University Application', icon: FileText },
    { href: '/profile', label: 'Profile', icon: Settings },
    { href: '/services', label: 'Services', icon: HeadphonesIcon },
    { href: '/resources', label: 'Resources', icon: BookOpen },
    { href: '/contact', label: 'Contact', icon: MessageSquare },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Students', icon: Users },
    { href: '/admin/requests', label: 'Requests', icon: FileBarChart },
    { href: '/admin/analytics', label: 'Analytics', icon: FileBarChart },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const navItems = isAdmin ? [...studentNavItems, ...adminNavItems] : studentNavItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="GermanyHelp" className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold text-foreground">GermanyHelp</h1>
              <p className="text-sm text-muted-foreground">Study in Germany</p>
            </div>
          </div>
        </div>

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
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">
            {profile?.full_name || 'User'}
          </div>
          <Button 
            onClick={signOut} 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start"
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
  );
};

export default Layout;