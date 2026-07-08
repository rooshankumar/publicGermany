import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEditorPermissions } from '@/hooks/useEditorPermissions';
import { useMyReferrals, useMyTasks } from '@/hooks/useReferrals';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { QUALIFIED_STATUSES, statusColor, statusLabel } from '@/lib/referralConstants';
import MyReferralsPanel from '@/components/referrals/MyReferralsPanel';
import TasksInbox from '@/components/referrals/TasksInbox';
import FullScreenLoader from '@/components/FullScreenLoader';
import { Users, MapPin, ArrowUpRight, ClipboardList, Star, CheckCircle2, AlertTriangle, CalendarClock, UserPlus } from 'lucide-react';

interface StudentSummary {
  user_id: string;
  full_name: string | null;
  country_of_education: string | null;
}

const StatCard = ({ label, value, icon: Icon, tone = '' }: any) => (
  <Card>
    <CardContent className="p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-md flex items-center justify-center bg-primary/10 text-primary ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold tabular-nums">{value}</div>
      </div>
    </CardContent>
  </Card>
);

const EditorDashboard = () => {
  const { user, profile } = useAuth();
  const { assignedStudentIds } = useEditorPermissions();
  const { data: referrals = [] } = useMyReferrals();
  const { data: tasks = [] } = useMyTasks();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      if (assignedStudentIds.length === 0) { setStudents([]); setLoadingStudents(false); return; }
      const { data } = await supabase.from('profiles')
        .select('user_id, full_name, country_of_education')
        .in('user_id', assignedStudentIds);
      setStudents((data || []) as StudentSummary[]);
      setLoadingStudents(false);
    };
    fetch();
  }, [assignedStudentIds.join(',')]);

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const todaysFollowups = referrals.filter(r => r.next_followup_date === today).length;
    const overdue = referrals.filter(r => r.next_followup_date && r.next_followup_date < today && !['completed', 'lost', 'not_interested'].includes(r.current_status)).length;
    const qualified = referrals.filter(r => QUALIFIED_STATUSES.includes(r.current_status)).length;
    const converted = referrals.filter(r => !!r.converted_student_id).length;
    const pendingTasks = (tasks as any[]).filter(t => t.status === 'open').length;
    return {
      assigned: students.length,
      referrals: referrals.length,
      todaysFollowups,
      overdue,
      qualified,
      converted,
      pendingTasks,
    };
  }, [referrals, tasks, students.length, today]);

  const initials = (profile?.full_name || user?.email || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback></Avatar>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Editor Workspace</p>
              <h1 className="text-xl md:text-2xl font-semibold">{profile?.full_name || 'Editor'}</h1>
            </div>
          </div>
        </header>

        <Tabs defaultValue="dashboard">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="referrals">My Referrals</TabsTrigger>
            <TabsTrigger value="students">Assigned Students</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="pt-3 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <StatCard label="Assigned Students" value={stats.assigned} icon={Users} />
              <StatCard label="My Referrals" value={stats.referrals} icon={UserPlus} />
              <StatCard label="Today's Follow-ups" value={stats.todaysFollowups} icon={CalendarClock} />
              <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} />
              <StatCard label="Qualified Leads" value={stats.qualified} icon={Star} />
              <StatCard label="Converted" value={stats.converted} icon={CheckCircle2} />
              <StatCard label="Pending Tasks" value={stats.pendingTasks} icon={ClipboardList} />
            </div>

            {/* Recent referrals */}
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <p className="text-sm font-semibold">Recent Referrals</p>
                  <Button variant="ghost" size="sm" onClick={() => document.querySelector<HTMLButtonElement>('[value="referrals"]')?.click()}>View all</Button>
                </div>
                {referrals.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No referrals yet. Create your first from "My Referrals".</div>
                ) : referrals.slice(0, 5).map(r => (
                  <button key={r.id} onClick={() => navigate(`/editor/referrals/${r.id}`)}
                    className="w-full flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/40 text-left">
                    <div>
                      <div className="text-sm font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.phone || r.email || '—'} · Next: {r.next_followup_date || '—'}</div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusColor(r.current_status)}`}>{statusLabel(r.current_status)}</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REFERRALS */}
          <TabsContent value="referrals" className="pt-3">
            <MyReferralsPanel />
          </TabsContent>

          {/* STUDENTS */}
          <TabsContent value="students" className="pt-3">
            {loadingStudents ? <FullScreenLoader label="Loading students" /> : students.length === 0 ? (
              <Card><CardContent className="py-10 text-center space-y-2">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm">No students assigned yet</p>
                <p className="text-xs text-muted-foreground">Contact your admin to get students assigned.</p>
              </CardContent></Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {students.map(s => {
                  const init = (s.full_name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <button key={s.user_id} onClick={() => navigate(`/editor/students/${s.user_id}`)}
                      className="group text-left rounded-lg border border-border bg-card hover:border-primary/50 transition-all p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-sm">{init}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{s.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{s.country_of_education || '—'}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TASKS */}
          <TabsContent value="tasks" className="pt-3">
            <TasksInbox />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EditorDashboard;
