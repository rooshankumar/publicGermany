import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu,
  X,
  LayoutDashboard, 
  FileText, 
  Settings,
  HeadphonesIcon, 
  BookOpen, 
  MessageSquare,
  Users,
  FileBarChart,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import logo from '@/assets/germany-help-logo.png';

const MobileNavigation = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const studentNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/applications', label: 'Applications', icon: FileText },
    { href: '/profile', label: 'Profile & APS', icon: Settings },
    { href: '/services', label: 'Services', icon: HeadphonesIcon },
    { href: '/resources', label: 'Resources', icon: BookOpen },
    { href: '/contact', label: 'Contact', icon: MessageSquare },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Admin Panel', icon: Users },
    { href: '/admin/requests', label: 'Requests', icon: FileBarChart },
  ];

  const navItems = isAdmin ? [...studentNavItems, ...adminNavItems] : studentNavItems;

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={logo} alt="GermanyHelp" className="w-10 h-10 rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold text-foreground">GermanyHelp</h1>
                  <p className="text-sm text-muted-foreground">Study in Germany</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
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
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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

          {/* User Section */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center space-x-3 mb-4 p-3 rounded-lg bg-background">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
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
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              variant="outline" 
              className="w-full justify-start"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;