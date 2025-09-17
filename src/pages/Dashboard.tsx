import React, { useEffect, useState } from 'react';
import { useAuth, type Profile } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import FullScreenLoader from '@/components/FullScreenLoader';
import { Badge } from '@/components/ui/badge';
// Custom Progress component to replace the shadcn/ui one
const Progress = ({ value, className = '', indicatorClassName = '' }: { 
  value: number; 
  className?: string;
  indicatorClassName?: string;
}) => {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
      <div 
        className={`h-full rounded-full transition-all duration-500 ${indicatorClassName}`}
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`
        }}
      />
    </div>
  );
};
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  FileText, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Users,
  BookOpen,
  MapPin,
  Shield,
  Globe,
  Calendar,
  Target,
  Star,
  Loader2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Interface for user data
interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  profile_completion: number;
  documents_count: number;
  applications_count: number;
  upcoming_deadline?: string;
  days_until_deadline?: number;
  ielts_toefl_score?: string;
  german_level?: string;
}

// Interface for task data
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  url: string;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completedSteps: 0,
    inProgress: 0,
    overallProgress: 0,
    universitiesSelected: 0,
    documentsReady: 0,
    daysToDeadline: 45
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch user documents
        const { count: documentsCount, error: docsError } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (docsError) throw docsError;

        // Fetch university applications - using the correct table name from schema
        const { count: appsCount, error: appsError } = await supabase
          .from('applications') // Changed from 'university_applications' to 'applications'
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (appsError) {
          console.error('Error fetching applications:', appsError);
          throw appsError;
        }

        // Calculate profile completion from a dynamic set of required fields
        const requiredFields = [
          !!profileData?.full_name,
          !!profileData?.date_of_birth,
          !!profileData?.country_of_education,
          !!profileData?.class_12_marks,
          !!profileData?.bachelor_degree_name,
          !!(profileData?.ielts_toefl_score || profileData?.german_level)
        ];
        const totalFields = requiredFields.length;
        const completedFields = requiredFields.filter(Boolean).length;
        const profileCompletion = Math.round((completedFields / totalFields) * 100);

        // Update stats
        setStats({
          completedSteps: completedFields, // Real number of completed required fields
          inProgress: totalFields - completedFields, // Fields remaining
          overallProgress: profileCompletion,
          universitiesSelected: appsCount || 0,
          documentsReady: documentsCount || 0,
          daysToDeadline: 45 // This would be calculated based on application deadlines
        });

        // Set user data with language test information
        setUserData({
          id: user.id,
          email: user.email || '',
          full_name: profileData?.full_name || 'Student',
          profile_completion: profileCompletion,
          documents_count: documentsCount || 0,
          applications_count: appsCount || 0,
          avatar_url: (profileData as any)?.profile_image_url || undefined,
          ielts_toefl_score: profileData?.ielts_toefl_score,
          german_level: profileData?.german_level
        });

        // Set tasks (dynamically based on user data)
        const userTasks: Task[] = [
          {
            id: '1',
            title: 'Complete Profile',
            description: 'Fill in missing profile information',
            status: profileCompletion < 100 ? 'in_progress' : 'completed',
            priority: 'high',
            url: '/profile'
          },
          {
            id: '2',
            title: 'Upload Documents',
            description: documentsCount ? `You've uploaded ${documentsCount} documents` : 'No documents uploaded yet',
            status: documentsCount ? 'in_progress' : 'pending',
            priority: 'high',
            url: '/documents'
          },
          {
            id: '3',
            title: 'University Applications',
            description: appsCount ? `You've started ${appsCount} applications` : 'No applications started yet',
            status: appsCount ? 'in_progress' : 'pending',
            priority: 'high',
            url: '/applications'
          }
        ];

        // Add language test task if not completed
        if (!profileData?.ielts_toefl_score && !profileData?.german_level) {
          userTasks.push({
            id: '4',
            title: 'Language Test',
            description: 'Prepare for language proficiency tests',
            status: 'pending',
            priority: 'medium',
            url: '/resources/language-tests'
          });
        }

        setTasks(userTasks);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading || !userData) {
    return (
      <Layout>
        <FullScreenLoader label="Loading dashboard" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 no-x-scroll">
        {/* Welcome Header */}
        <div className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}></div>
          
          <div className="relative container mx-auto px-4 sm:px-6 py-8 md:py-16">
            <div className="max-w-4xl mx-auto text-center text-foreground">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Avatar className="h-14 w-14 ring-2 ring-foreground/30">
                  <AvatarImage src={userData.avatar_url} />
                  <AvatarFallback className="bg-foreground/10 text-foreground">
                    {userData.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="w-16 h-16 bg-foreground/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <GraduationCap className="w-8 h-8 text-foreground" />
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
                Welcome back, {userData.full_name.split(' ')[0]}!
              </h1>
              <p className="text-lg md:text-2xl text-foreground/90 mb-6 md:mb-8">
                {userData.profile_completion < 50 
                  ? `Let's get started on your journey to studying in Germany`
                  : `You're ${userData.profile_completion}% of the way there! Keep up the great work!`}
              </p>
              <div className="flex items-center justify-center gap-4 text-foreground/80">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span>Goal-oriented</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Trusted guidance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  <span>Proven success</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 -mt-8 relative z-10">
          {/* Progress Overview */}
          <Card className="mb-6 md:mb-8 bg-gradient-to-r from-card to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CheckCircle className="w-6 h-6 text-success" />
                Your Progress
              </CardTitle>
              <CardDescription>
                Track your journey to studying in Germany
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{stats.completedSteps}</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.completedSteps === 1 ? 'Step' : 'Steps'} Completed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning mb-2">{stats.inProgress}</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.inProgress === 1 ? 'Task' : 'Tasks'} In Progress
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-success mb-2">{stats.overallProgress}%</div>
                  <div className="text-sm text-muted-foreground">Overall Progress</div>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={stats.overallProgress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Started</span>
                  <span>{stats.overallProgress}% Complete</span>
                  <span>Goal: 100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-8 mb-6 md:mb-8">
            {/* Priority Actions */}
            <Card className="border-warning/30 bg-gradient-to-r from-warning/5 to-warning/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Clock className="w-5 h-5" />
                  Priority Actions
                </CardTitle>
                <CardDescription>
                  Complete these tasks to stay on track
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-4 bg-background rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {task.title.includes('Profile') ? (
                          <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        ) : task.title.includes('Document') ? (
                          <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        ) : task.title.includes('University') ? (
                          <GraduationCap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground">{task.description}</div>
                        </div>
                      </div>
                      <Link to={task.url}>
                        <Button 
                          size="sm" 
                          variant={task.status === 'completed' ? 'outline' : 'default'}
                          className="whitespace-nowrap"
                        >
                          {task.status === 'completed' ? 'View' : task.status === 'in_progress' ? 'Continue' : 'Start'}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No priority tasks at the moment</p>
                    <Link to="/profile">
                      <Button variant="link" className="mt-2">
                        Complete your profile to see tasks
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-success" />
                  Your Journey Stats
                </CardTitle>
                <CardDescription>
                  Key metrics and milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <div className="text-2xl font-bold text-success mb-1">{stats.universitiesSelected}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.universitiesSelected === 1 ? 'University' : 'Universities'} Selected
                    </div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">{stats.overallProgress}%</div>
                    <div className="text-xs text-muted-foreground">Profile Complete</div>
                  </div>
                  <div className="text-center p-4 bg-warning/10 rounded-lg">
                    <div className="text-2xl font-bold text-warning mb-1">{stats.documentsReady}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.documentsReady === 1 ? 'Document' : 'Documents'} Ready
                    </div>
                  </div>
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <div className="text-2xl font-bold text-foreground mb-1">{stats.daysToDeadline}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.daysToDeadline === 1 ? 'Day' : 'Days'} to Deadline
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 auto-grid-sm">
            {/* APS Module */}
            <Card className="card-hover border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Documents</CardTitle>
                      <CardDescription>Manage your documents</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      `${
                        stats.documentsReady === 0 
                          ? 'bg-destructive/10 text-destructive border-destructive/30' 
                          : stats.documentsReady < 5 
                            ? 'bg-warning/10 text-warning border-warning/30' 
                            : 'bg-success/10 text-success border-success/30'
                      }`
                    }
                  >
                    {stats.documentsReady === 0 ? 'Not Started' : stats.documentsReady < 5 ? 'In Progress' : 'Complete'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress 
                    value={Math.min(100, (stats.documentsReady / 10) * 100)} 
                    className="h-2" 
                    indicatorClassName={
                      stats.documentsReady === 0 
                        ? 'bg-destructive' 
                        : stats.documentsReady < 5 
                          ? 'bg-warning' 
                          : 'bg-success'
                    }
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {stats.documentsReady} of 10 documents
                    </span>
                    <span className="font-medium">
                      {Math.min(100, (stats.documentsReady / 10) * 100)}%
                    </span>
                  </div>
                  <Link to="/documents" className="block">
                    <Button className="w-full">
                      {stats.documentsReady === 0 ? 'Start Uploading' : 'Manage Documents'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* University Applications */}
            <Card className="card-hover border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">University Applications</CardTitle>
                      <CardDescription>Track your applications</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      `${
                        stats.universitiesSelected === 0 
                          ? 'bg-destructive/10 text-destructive border-destructive/30' 
                          : 'bg-success/10 text-success border-success/30'
                      }`
                    }
                  >
                    {stats.universitiesSelected === 0 ? 'Not Started' : 'Active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm font-medium">
                      {stats.universitiesSelected === 0 
                        ? 'No applications yet' 
                        : `${stats.universitiesSelected} ${stats.universitiesSelected === 1 ? 'application' : 'applications'} in progress`}
                    </span>
                  </div>
                  <Link to="/applications" className="block">
                    <Button className="w-full" variant="outline">
                      {stats.universitiesSelected === 0 ? 'Start Application' : 'View Applications'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Profile Setup */}
            <Card className="card-hover border-success/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Profile</CardTitle>
                      <CardDescription>Personal information</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      `${
                        stats.overallProgress < 50 
                          ? 'bg-destructive/10 text-destructive border-destructive/30' 
                          : stats.overallProgress < 100 
                            ? 'bg-warning/10 text-warning border-warning/30' 
                            : 'bg-success/10 text-success border-success/30'
                      }`
                    }
                  >
                    {stats.overallProgress < 50 ? 'Incomplete' : stats.overallProgress < 100 ? 'In Progress' : 'Complete'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress 
                    value={stats.overallProgress} 
                    className="h-2"
                    indicatorClassName={
                      stats.overallProgress < 50 
                        ? 'bg-destructive' 
                        : stats.overallProgress < 100 
                          ? 'bg-warning' 
                          : 'bg-success'
                    }
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {stats.overallProgress === 100 ? 'All sections done' : 'Profile completion'}
                    </span>
                    <span className="font-medium">
                      {stats.overallProgress}%
                    </span>
                  </div>
                  <Link to="/profile" className="block">
                    <Button 
                      className="w-full" 
                      variant={stats.overallProgress === 100 ? 'outline' : 'default'}
                    >
                      {stats.overallProgress === 100 ? 'View Profile' : 'Complete Profile'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Language Tests */}
            <Card className="card-hover border-warning/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Language Tests</CardTitle>
                      <CardDescription>IELTS/TOEFL/German</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      `${
                        !userData?.ielts_toefl_score && !userData?.german_level
                          ? 'bg-destructive/10 text-destructive border-destructive/30'
                          : (userData?.ielts_toefl_score || userData?.german_level) && 
                            (!userData?.ielts_toefl_score || !userData?.german_level)
                            ? 'bg-warning/10 text-warning border-warning/30'
                            : 'bg-success/10 text-success border-success/30'
                      }`
                    }
                  >
                    {!userData?.ielts_toefl_score && !userData?.german_level
                      ? 'Not Started'
                      : (userData?.ielts_toefl_score || userData?.german_level) && 
                        (!userData?.ielts_toefl_score || !userData?.german_level)
                        ? 'In Progress'
                        : 'Complete'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">English (IELTS/TOEFL)</span>
                      <span className="text-sm font-medium">
                        {userData?.ielts_toefl_score || 'Not added'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">German Level</span>
                      <span className="text-sm font-medium">
                        {userData?.german_level ? 
                          userData.german_level.toUpperCase() : 'Not added'}
                      </span>
                    </div>
                  </div>
                  <Link to="/profile#language" className="block">
                    <Button className="w-full" variant="outline">
                      {!userData?.ielts_toefl_score && !userData?.german_level
                        ? 'Add Language Scores'
                        : 'Update Language Info'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="card-hover border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Expert Services</CardTitle>
                      <CardDescription>Professional guidance</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-accent text-foreground border-border">
                    Available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Get personalized help from our experts
                  </div>
                  <Link to="/services" className="block">
                    <Button className="w-full">
                      Browse Services
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="card-hover border-accent/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-accent/50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Resources</CardTitle>
                      <CardDescription>Guides and materials</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-accent text-foreground border-border">
                    Updated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Latest guides, forms, and helpful materials
                  </div>
                  <Link to="/resources" className="block">
                    <Button className="w-full" variant="outline">
                      View Resources
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-10 md:mt-12 bg-gradient-to-r from-primary/5 to-success/5 rounded-2xl p-4 sm:p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Ready to Take the Next Step?</h2>
              <p className="text-muted-foreground">Get personalized guidance from our Germany education experts</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="w-full sm:w-auto">
                  <Calendar className="mr-2 w-5 h-5" />
                  Book Consultation
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Star className="mr-2 w-5 h-5" />
                  View All Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;