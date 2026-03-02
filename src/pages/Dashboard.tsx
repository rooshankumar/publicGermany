import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ContractCard } from '@/components/ContractCard';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ArrowRight,
  BookOpen,
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  Clock,
  Upload,
  Send,
  CheckCircle2,
  AlertCircle,
  Zap,
  Trophy,
  BarChart3,
  Lightbulb
} from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [docsCount, setDocsCount] = useState(0);
  const [appsCount, setAppsCount] = useState(0);
  const [submittedApps, setSubmittedApps] = useState(0);
  const [nearestDeadline, setNearestDeadline] = useState<{ name: string; date: string; days: number } | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<{ action: string; entity_type: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [
          profResult,
          { count: dCount },
          { data: apps },
          { data: ctrData },
          { data: events },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).single(),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('applications').select('id, status, university_name, application_end_date').eq('user_id', user.id),
          supabase.from('contracts').select('*').eq('student_id', user.id).neq('status', 'draft').order('sent_at', { ascending: false }),
          supabase.from('events').select('action, entity_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        ]);

        const prof = profResult.data;
        const fields = [
          !!prof?.full_name, !!prof?.date_of_birth, !!prof?.country_of_education,
          !!prof?.class_12_marks, !!prof?.bachelor_degree_name,
          !!(prof?.ielts_toefl_score || prof?.german_level)
        ];
        setProfileCompletion(Math.round((fields.filter(Boolean).length / fields.length) * 100));
        setDocsCount(dCount || 0);
        const appsList = apps || [];
        setAppsCount(appsList.length);
        setSubmittedApps(appsList.filter(a => ['submitted', 'Applied'].includes(a.status)).length);

        const now = new Date();
        const upcoming = appsList
          .filter(a => a.application_end_date && new Date(a.application_end_date) > now)
          .sort((a, b) => new Date(a.application_end_date!).getTime() - new Date(b.application_end_date!).getTime());
        if (upcoming.length > 0) {
          const d = new Date(upcoming[0].application_end_date!);
          setNearestDeadline({
            name: upcoming[0].university_name,
            date: d.toLocaleDateString(),
            days: Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          });
        }

        setContracts(ctrData || []);
        setRecentEvents(events || []);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return <Layout><div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></Layout>;
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <Layout>
      <div className="space-y-4 pb-6">
        <div className="german-stripe w-full" />

        {/* Greeting + Quick Stats */}
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome, {firstName}! 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {profileCompletion < 100 
                ? `Your profile is ${profileCompletion}% complete. Let's get you to 100%!` 
                : '✓ Your profile is complete! Ready to take next steps.'}
            </p>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link to="/profile" className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:border-blue-400 transition-colors">
              <User className="h-4 w-4 text-blue-600" />
              <div className="text-xs">
                <div className="font-semibold text-foreground">Profile</div>
                <div className="text-muted-foreground">{profileCompletion}%</div>
              </div>
            </Link>
            <Link to="/documents" className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg hover:border-green-400 transition-colors">
              <FileText className="h-4 w-4 text-green-600" />
              <div className="text-xs">
                <div className="font-semibold text-foreground">Documents</div>
                <div className="text-muted-foreground">{docsCount} uploaded</div>
              </div>
            </Link>
            <Link to="/applications" className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg hover:border-purple-400 transition-colors">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              <div className="text-xs">
                <div className="font-semibold text-foreground">Applications</div>
                <div className="text-muted-foreground">{appsCount} added</div>
              </div>
            </Link>
            <Link to="/services" className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg hover:border-orange-400 transition-colors">
              <Briefcase className="h-4 w-4 text-orange-600" />
              <div className="text-xs">
                <div className="font-semibold text-foreground">Services</div>
                <div className="text-muted-foreground">Get help</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Link to="/profile">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                  <User className="h-3 w-3 mr-1" />
                  Complete Profile
                </Button>
              </Link>
              <Link to="/documents">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Docs
                </Button>
              </Link>
              <Link to="/applications">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Add University
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Browse Services
                </Button>
              </Link>
              <Link to="/converter">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Grade Converter
                </Button>
              </Link>
              <Link to="/resources">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Resources
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Journey Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-blue-600" />
              Your Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${profileCompletion === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {profileCompletion === 100 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Complete Your Profile</div>
                <div className="text-xs text-muted-foreground">Fill in all essential details</div>
              </div>
              <div className="text-xs font-semibold">{profileCompletion}%</div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${docsCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {docsCount > 0 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Upload Documents</div>
                <div className="text-xs text-muted-foreground">Provide required certificates & transcripts</div>
              </div>
              <Link to="/documents" className="text-xs text-primary hover:underline">
                {docsCount > 0 ? 'View' : 'Add'} →
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${appsCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {appsCount > 0 ? <CheckCircle2 className="h-4 w-4" /> : '3'}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Add Universities</div>
                <div className="text-xs text-muted-foreground">Shortlist your target universities</div>
              </div>
              <Link to="/applications" className="text-xs text-primary hover:underline">
                {appsCount > 0 ? 'View' : 'Add'} →
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-700">
                4
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Get Professional Help</div>
                <div className="text-xs text-muted-foreground">Access SOP, LOR, and visa guidance</div>
              </div>
              <Link to="/services" className="text-xs text-primary hover:underline">
                Explore →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Priority Alerts */}
        {(nearestDeadline || profileCompletion < 50) && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="pt-4">
              <div className="space-y-2">
                {profileCompletion < 50 && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold text-amber-900 dark:text-amber-100">Profile Incomplete</div>
                      <div className="text-amber-800 dark:text-amber-200">Complete your profile to unlock all features and get better recommendations.</div>
                      <Link to="/profile"><Button size="sm" variant="outline" className="mt-1 h-6 text-xs">Complete Now</Button></Link>
                    </div>
                  </div>
                )}
                {nearestDeadline && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold text-orange-900 dark:text-orange-100">Upcoming Deadline</div>
                      <div className="text-orange-800 dark:text-orange-200">{nearestDeadline.name} application deadline in {nearestDeadline.days} days ({nearestDeadline.date})</div>
                      <Link to="/applications"><Button size="sm" variant="outline" className="mt-1 h-6 text-xs">View Details</Button></Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Helpful Tips Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Helpful Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>💡 A complete profile increases your chances of getting accurate university matches.</li>
              <li>📄 Keep all your documents ready (10th, 12th, Bachelor transcripts, IELTS scores).</li>
              <li>🎯 Start adding universities early to track application deadlines.</li>
              <li>🚀 Our services include SOP writing, LOR collection, and visa guidance.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Active Contracts — compact */}
        {contracts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Contracts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  userId={user?.id}
                  onStatusChange={async () => {
                    const { data } = await supabase.from('contracts').select('*').eq('student_id', user?.id).neq('status', 'draft').order('sent_at', { ascending: false });
                    if (data) setContracts(data);
                  }}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recentEvents.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentEvents.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      {ev.entity_type === 'document' ? <Upload className="h-3 w-3 text-muted-foreground" /> :
                       ev.entity_type === 'application' ? <Send className="h-3 w-3 text-muted-foreground" /> :
                       <FileText className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-muted-foreground">{ev.action}</span>
                    </div>
                    <span className="text-muted-foreground">{new Date(ev.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
