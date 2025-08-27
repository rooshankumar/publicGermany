import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';

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

  // Minimal modules for progress calculation
  const modules = [
    { key: 'aps', name: 'APS Documents' },
    { key: 'university_applications', name: 'University Applications' },
    { key: 'ielts', name: 'Language Proficiency' },
    { key: 'sop_cv', name: 'Documents (SOP/CV)' },
    { key: 'blocked_account', name: 'Blocked Account' },
    { key: 'visa', name: 'Visa Process' },
    { key: 'health_insurance', name: 'Health Insurance' },
    { key: 'accommodation', name: 'Accommodation' },
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

  // ...existing code...

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
      <div className="container-mobile max-w-xl mx-auto py-10 space-y-8">
        {/* Minimal Hero Header */}
        <div className="bg-gradient-to-r from-primary to-primary-glow rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}! 🎓` : 'Welcome to GermanyHelp! 🎓'}
            </h1>
            <p className="text-primary-foreground/90 text-lg mb-4">
              Your journey to studying in Germany, simplified.
            </p>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold">{getOverallProgress()}%</div>
                  <div className="text-sm text-primary-foreground/80">Complete</div>
                </div>
              </div>
              <Progress value={getOverallProgress()} className="h-3 w-32 progress-glow" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-l from-white/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        </div>

        {/* Next Steps */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Next Steps</h2>
          <ul className="space-y-4">
            {getNextActions().slice(0, 2).map(action => (
              <li key={action.id} className="bg-muted rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium text-base">{action.title}</div>
                  <div className="text-sm text-muted-foreground">{action.description}</div>
                </div>
                <Link to={action.actionLink} className="mt-2 md:mt-0">
                  <Button size="sm">Go</Button>
                </Link>
              </li>
            ))}
            {getNextActions().length === 0 && (
              <li className="text-muted-foreground text-sm">You're all caught up! 🎉</li>
            )}
          </ul>
        </div>

        {/* Profile Completion Dialog (unchanged) */}
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