import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Calendar, FileText, BookOpen, Phone, ExternalLink, User, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import APSPathwaySelector from '@/components/APSPathwaySelector';

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
    { key: 'aps', name: 'APS Documents', icon: FileText },
    { key: 'university_applications', name: 'University Applications', icon: BookOpen },
    { key: 'ielts', name: 'IELTS Preparation', icon: BookOpen },
    { key: 'sop_cv', name: 'Prepare SOP / CV', icon: FileText },
    { key: 'blocked_account', name: 'Blocked Account', icon: FileText },
    { key: 'visa', name: 'Visa Process', icon: FileText },
    { key: 'health_insurance', name: 'Health Insurance', icon: FileText },
    { key: 'accommodation', name: 'Accommodation', icon: FileText },
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
    // You can add logic here to update the profile with selected pathway
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Greeting */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
          <h1 className="text-2xl font-bold text-foreground mb-1">Study in Germany</h1>
          <p className="text-sm text-muted-foreground mb-2">
            {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}! 😊` : 'Welcome! 😊'}
          </p>
          <p className="text-foreground">Your personalized checklist for studying in Germany</p>
        </div>

        {/* Journey Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Your Journey Progress</CardTitle>
            <CardDescription>
              {getCompletedSteps()} of {modules.length} steps completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={getOverallProgress()} className="h-3" />
              <p className="text-sm text-muted-foreground text-right">
                {getOverallProgress()}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* APS Pathway Selection */}
        <APSPathwaySelector 
          selectedPathway={selectedPathway}
          onSelectPathway={handlePathwaySelect}
        />

        {/* Quick Checklist Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            const progress = getModuleProgress(module.key);
            const moduleItems = checklistItems.filter(item => item.module === module.key);
            const completedCount = moduleItems.filter(item => item.status === 'completed').length;
            
            return (
              <Card key={module.key} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{module.name}</CardTitle>
                    </div>
                    {progress === 100 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Complete
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {completedCount} / {moduleItems.length || 1} tasks
                      </span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/resources">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">📚 Resources</h3>
                    <p className="text-sm text-muted-foreground">Organized guides for every stage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/services">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">📅 Book 1:1 Call</h3>
                    <p className="text-sm text-muted-foreground">Get personalized guidance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/contact">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Phone className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">💬 Support</h3>
                    <p className="text-sm text-muted-foreground">Get help & connect</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/profile">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <User className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">👤 Profile</h3>
                    <p className="text-sm text-muted-foreground">Update your details</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
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