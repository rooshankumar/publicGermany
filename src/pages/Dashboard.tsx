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

  // --- Modern Dashboard Layout ---
  return (
    <Layout>
      <div className="container mx-auto py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Progress Overview Card */}
          <div className="p-6 flex flex-col items-center text-center bg-white rounded-xl shadow mb-4">
            <div className="relative mb-2">
              <Progress value={getOverallProgress()} className="w-32 h-6 rounded-full border-4 border-primary" />
              <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{getOverallProgress()}%</span>
            </div>
            <div className="flex gap-4 justify-center mb-2">
              {modules.map((m, i) => (
                <span key={i} className={`flex items-center gap-1 text-xs ${getModuleProgress(m.key) === 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {getModuleProgress(m.key) === 100 ? '✅' : '❌'} {m.name}
                </span>
              ))}
            </div>
          </div>

          {/* Next Steps / To-Do List */}
          <div className="p-4 bg-accent/30 rounded-xl mb-4">
            <h3 className="font-semibold mb-3">Next Steps</h3>
            <div className="flex flex-col gap-3">
              {getNextActions().map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{i === 0 ? '📑' : i === 1 ? '🎓' : '🏠'}</span>
                  <span className="flex-1">{step.title}</span>
                  <Button size="sm" asChild><Link to={step.actionLink}>{step.title.includes('Upload') ? 'Upload' : step.title.includes('Research') ? 'Start' : 'Explore'}</Link></Button>
                  {/* Checkmark if done logic can be added here */}
                </div>
              ))}
              {getNextActions().length === 0 && <span className="text-muted-foreground text-sm">You're all caught up! 🎉</span>}
            </div>
          </div>

          {/* Services Quick Access */}
          <div className="flex gap-3 overflow-x-auto py-2 mb-4">
            {/* Example icons, replace with real navigation/actions */}
            <div className="flex flex-col items-center justify-center p-4 min-w-[120px] rounded-xl shadow-sm bg-white">
              <span className="text-primary mb-2 text-2xl">📝</span>
              <span className="text-sm font-medium text-center">University Applications</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 min-w-[120px] rounded-xl shadow-sm bg-white">
              <span className="text-primary mb-2 text-2xl">🏢</span>
              <span className="text-sm font-medium text-center">APS Services</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 min-w-[120px] rounded-xl shadow-sm bg-white">
              <span className="text-primary mb-2 text-2xl">💳</span>
              <span className="text-sm font-medium text-center">Finances</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 min-w-[120px] rounded-xl shadow-sm bg-white">
              <span className="text-primary mb-2 text-2xl">📬</span>
              <span className="text-sm font-medium text-center">Embassy / Visa</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 min-w-[120px] rounded-xl shadow-sm bg-white">
              <span className="text-primary mb-2 text-2xl">📚</span>
              <span className="text-sm font-medium text-center">Language Learning</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {/* Timeline / Deadlines Widget */}
          <div className="p-4 bg-white rounded-xl shadow mb-4">
            <h3 className="font-semibold mb-3">Timeline & Deadlines</h3>
            <div className="space-y-2">
              {/* Example timeline, replace with real data if available */}
              <div className="flex items-center gap-2 text-green-600"><span>✅</span> APS applied <span className="text-xs text-muted-foreground ml-auto">15 Aug</span></div>
              <div className="flex items-center gap-2 text-orange-500"><span>⏳</span> APS result expected <span className="text-xs text-muted-foreground ml-auto">10 Nov</span></div>
              <div className="flex items-center gap-2 text-orange-500"><span>📅</span> University application deadline <span className="text-xs text-muted-foreground ml-auto">2 Sep</span></div>
              <div className="flex items-center gap-2 text-red-600"><span>📅</span> Visa appointment <span className="text-xs text-muted-foreground ml-auto">TBD</span></div>
            </div>
          </div>

          {/* Document Hub (Mini Preview) */}
          <div className="p-4 bg-accent/20 rounded-xl mb-4">
            <h3 className="font-semibold mb-3">Uploaded Docs</h3>
            <div className="space-y-2">
              {/* Example docs, replace with real data if available */}
              <div className="flex items-center gap-2"><span>📄</span> Passport.pdf <Button size="xs" variant="outline">View</Button> <Button size="xs" variant="ghost">Delete</Button> <span className="text-green-600">✅</span></div>
              <div className="flex items-center gap-2"><span>📄</span> IELTS.pdf <Button size="xs" variant="outline">View</Button> <Button size="xs" variant="ghost">Delete</Button> <span className="text-green-600">✅</span></div>
            </div>
            <Button variant="link" className="mt-2">Go to Full Documents →</Button>
          </div>

          {/* Motivation / Tips Box */}
          <div className="p-4 bg-white rounded-xl shadow">
            <h3 className="font-semibold mb-2">Motivation & Tips</h3>
            <div className="text-sm text-muted-foreground">💡 Did you know? Most German universities don’t charge tuition fees!</div>
          </div>
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