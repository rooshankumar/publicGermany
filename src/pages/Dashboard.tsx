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
  Send
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

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
      <div className="space-y-3 max-w-4xl mx-auto">
        <div className="german-stripe w-full" />

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Welcome, {firstName} 👋</h1>
            <p className="text-xs text-muted-foreground">
              {profileCompletion < 100 ? `Profile ${profileCompletion}% complete` : 'Profile complete ✓'}
            </p>
          </div>
        </div>

        {/* Compact Stats Row — Excel-style */}
        <Card>
          <CardContent className="py-2 px-3">
            <div className="flex items-center divide-x divide-border text-xs overflow-x-auto">
              <Link to="/profile" className="flex items-center gap-1.5 px-3 py-1 hover:bg-muted/50 rounded whitespace-nowrap">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Profile</span>
                <span className="text-muted-foreground">{profileCompletion}%</span>
              </Link>
              <Link to="/documents" className="flex items-center gap-1.5 px-3 py-1 hover:bg-muted/50 rounded whitespace-nowrap">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Documents</span>
                <span className="text-muted-foreground">{docsCount}</span>
              </Link>
              <Link to="/applications" className="flex items-center gap-1.5 px-3 py-1 hover:bg-muted/50 rounded whitespace-nowrap">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Applications</span>
                <span className="text-muted-foreground">{appsCount} ({submittedApps} submitted)</span>
              </Link>
              <Link to="/services" className="flex items-center gap-1.5 px-3 py-1 hover:bg-muted/50 rounded whitespace-nowrap">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Services</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Profile completion bar (only if < 100) */}
        {profileCompletion < 100 && (
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Complete your profile</span>
                  <span className="text-xs text-muted-foreground">{profileCompletion}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
                </div>
              </div>
              <Link to="/profile"><Button size="sm" variant="outline" className="text-xs h-7">Complete</Button></Link>
            </CardContent>
          </Card>
        )}

        {/* Nearest Deadline — compact */}
        {nearestDeadline && (
          <Card className="border-warning/30">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-xs"><span className="font-medium">{nearestDeadline.name}</span> — {nearestDeadline.date} ({nearestDeadline.days}d left)</span>
              </div>
              <Link to="/applications"><Button size="sm" variant="ghost" className="text-xs h-6 px-2">View</Button></Link>
            </CardContent>
          </Card>
        )}

        {/* Active Contracts — compact */}
        {contracts.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Contracts ({contracts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-3">
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
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
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
