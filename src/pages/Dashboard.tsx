import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  BookOpen, 
  Phone, 
  User, 
  Calendar,
  FileCheck,
  GraduationCap,
  Globe,
  CreditCard,
  Plane,
  Shield,
  Home,
  Target,
  TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import APSPathwaySelector from '@/components/APSPathwaySelector';
import NextActionCard from '@/components/NextActionCard';
import ModuleProgressGrid from '@/components/ModuleProgressGrid';

interface ChecklistItem {
  id: string;
  module: string;
  item_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  notes: string | null;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedPathway, setSelectedPathway] = useState<string>('');

  const modules = [
    { 
      key: 'aps', 
      name: 'APS Documents', 
      icon: FileCheck,
      link: '/profile',
      description: 'Academic evaluation & document verification'
    },
    { 
      key: 'university_applications', 
      name: 'University Applications', 
      icon: GraduationCap,
      link: '/applications',
      description: 'Apply to German universities'
    },
    { 
      key: 'ielts', 
      name: 'Language Proficiency', 
      icon: Globe,
      link: '/profile',
      description: 'IELTS/TOEFL & German language'
    },
    { 
      key: 'sop_cv', 
      name: 'Documents (SOP/CV)', 
      icon: FileText,
      link: '/services',
      description: 'Statement of Purpose & CV preparation'
    },
    { 
      key: 'blocked_account', 
      name: 'Blocked Account', 
      icon: CreditCard,
      link: '/services',
      description: 'Financial proof for visa'
    },
    { 
      key: 'visa', 
      name: 'Visa Process', 
      icon: Plane,
      link: '/services',
      description: 'German student visa application'
    },
    { 
      key: 'health_insurance', 
      name: 'Health Insurance', 
      icon: Shield,
      link: '/services',
      description: 'Student health coverage'
    },
    { 
      key: 'accommodation', 
      name: 'Accommodation', 
      icon: Home,
      link: '/resources',
      description: 'Student housing arrangements'
    },
  ];

  useEffect(() => {
    fetchChecklistItems();
    
    // Set selected pathway from profile
    if (profile?.aps_pathway) {
      setSelectedPathway(profile.aps_pathway);
    }
    
    // Show profile completion dialog if profile is incomplete
    if (profile && !profile.country_of_education && !showProfileDialog) {
      setTimeout(() => setShowProfileDialog(true), 1000);
    }
  }, [profile]);

  const fetchChecklistItems = async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChecklistItems(data || []);
    } catch (error) {
      console.error('Error fetching checklist items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleKey: string) => {
    const moduleItems = checklistItems.filter(item => item.module === moduleKey);
    if (moduleItems.length === 0) return 0;
    const completedItems = moduleItems.filter(item => item.status === 'completed');
    return Math.round((completedItems.length / moduleItems.length) * 100);
  };

  const getOverallProgress = () => {
    const totalProgress = modules.reduce((sum, module) => sum + getModuleProgress(module.key), 0);
    return Math.round(totalProgress / modules.length);
  };

  const getCompletedSteps = () => {
    return modules.filter(module => getModuleProgress(module.key) === 100).length;
  };

  const handlePathwaySelect = (pathwayId: string) => {
    setSelectedPathway(pathwayId);
    // Update profile with selected pathway
    if (profile?.user_id) {
      supabase
        .from('profiles')
        .update({ aps_pathway: pathwayId as any })
        .eq('user_id', profile.user_id)
        .then(() => console.log('Pathway updated'));
    }
  };

  // Generate next actions based on current progress
  const getNextActions = () => {
    const actions = [];
    
    // Check profile completion
    if (!profile?.country_of_education || !profile?.aps_pathway) {
      actions.push({
        id: 'complete_profile',
        title: 'Complete Your Profile',
        description: 'Add your academic background and select APS pathway',
        priority: 'high' as const,
        category: 'Profile',
        actionLink: '/profile'
      });
    }

    // Check APS documents
    const apsProgress = getModuleProgress('aps');
    if (apsProgress < 100 && profile?.aps_pathway) {
      actions.push({
        id: 'aps_documents',
        title: 'Upload APS Documents',
        description: 'Complete your APS document submission',
        priority: 'high' as const,
        category: 'APS',
        actionLink: '/profile',
        dueDate: 'ASAP'
      });
    }

    // Check university applications
    const uniProgress = getModuleProgress('university_applications');
    if (uniProgress < 50) {
      actions.push({
        id: 'university_research',
        title: 'Research Universities',
        description: 'Start exploring German universities for your field',
        priority: 'medium' as const,
        category: 'Universities',
        actionLink: '/applications'
      });
    }

    return actions.slice(0, 3); // Return top 3 actions
  };

  // Generate module data for the grid
  const getModuleData = () => {
    return modules.map(module => {
      const progress = getModuleProgress(module.key);
      const moduleItems = checklistItems.filter(item => item.module === module.key);
      const completedCount = moduleItems.filter(item => item.status === 'completed').length;
      const totalCount = moduleItems.length || 1;
      
      let status: 'completed' | 'in_progress' | 'pending' | 'needs_attention' = 'pending';
      let nextAction = '';
      
      if (progress === 100) {
        status = 'completed';
      } else if (progress > 0) {
        status = 'in_progress';
        nextAction = `${Math.ceil((totalCount - completedCount) / 2)} tasks remaining`;
      } else {
        status = 'pending';
        nextAction = 'Get started';
      }

      return {
        key: module.key,
        name: module.name,
        icon: module.icon,
        progress,
        completedTasks: completedCount,
        totalTasks: totalCount,
        status,
        nextAction,
        link: module.link
      };
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-modern h-32"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-mobile space-y-8">
        {/* Modern Hero Header */}
        <div className="bg-gradient-to-r from-primary to-primary-glow rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}! 🎓` : 'Welcome to GermanyHelp! 🎓'}
                </h1>
                <p className="text-primary-foreground/90 text-lg">
                  Your personalized journey to studying in Germany
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold">{getOverallProgress()}%</div>
                  <div className="text-sm text-primary-foreground/80">Complete</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-l from-white/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Actions */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Priority Actions</h2>
              </div>
              <NextActionCard actions={getNextActions()} />
            </div>

            {/* Module Progress Grid */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Your Progress</h2>
              </div>
              <ModuleProgressGrid modules={getModuleData()} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Journey Overview */}
            <Card className="bg-gradient-to-br from-card to-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Journey Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{getOverallProgress()}%</span>
                  </div>
                  <Progress value={getOverallProgress()} className="h-3 progress-glow" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{getCompletedSteps()}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">{modules.length - getCompletedSteps()}</div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* APS Pathway */}
            <APSPathwaySelector 
              selectedPathway={selectedPathway}
              onSelectPathway={handlePathwaySelect}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Essential tools and resources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/resources">
                  <Button variant="outline" className="w-full justify-start h-12" size="lg">
                    <BookOpen className="mr-3 h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">📚 Resources</div>
                      <div className="text-xs text-muted-foreground">Guides & materials</div>
                    </div>
                  </Button>
                </Link>

                <Link to="/services">
                  <Button variant="outline" className="w-full justify-start h-12" size="lg">
                    <Calendar className="mr-3 h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">📅 Book Consultation</div>
                      <div className="text-xs text-muted-foreground">Expert guidance</div>
                    </div>
                  </Button>
                </Link>

                <Link to="/contact">
                  <Button variant="outline" className="w-full justify-start h-12" size="lg">
                    <Phone className="mr-3 h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">💬 Support</div>
                      <div className="text-xs text-muted-foreground">Get help</div>
                    </div>
                  </Button>
                </Link>

                <Link to="/profile">
                  <Button variant="outline" className="w-full justify-start h-12" size="lg">
                    <User className="mr-3 h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">👤 Profile</div>
                      <div className="text-xs text-muted-foreground">Update details</div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Profile Completion Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Your Profile</DialogTitle>
              <DialogDescription>
                Complete your profile for better APS match & university suggestions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Adding your academic background and language proficiency will help us:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Determine your APS pathway automatically</li>
                <li>• Suggest relevant universities and programs</li>
                <li>• Provide personalized guidance</li>
              </ul>
              <div className="flex space-x-2">
                <Link to="/profile" className="flex-1">
                  <Button onClick={() => setShowProfileDialog(false)} className="w-full">
                    Complete Profile Now
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => setShowProfileDialog(false)} className="flex-1">
                  Maybe Later
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Dashboard;