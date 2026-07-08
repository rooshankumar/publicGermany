import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useReferralsByEditor, useUpdateReferral } from '@/hooks/useReferrals';
import { QUALIFIED_STATUSES, serviceLabel, statusColor, statusLabel, priorityColor } from '@/lib/referralConstants';
import { ArrowLeft, Users, UserPlus, Star, CheckCircle2, Clock } from 'lucide-react';
import FullScreenLoader from '@/components/FullScreenLoader';
import { useToast } from '@/hooks/use-toast';

const sb = supabase as any;

export default function EditorProfile() {
  const { editorId } = useParams<{ editorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editor, setEditor] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [assigned, setAssigned] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const { data: referrals = [], isLoading, refetch } = useReferralsByEditor(editorId);
  const update = useUpdateReferral();

  useEffect(() => {
    if (!editorId) return;
    (async () => {
      const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', editorId).maybeSingle();
      setEditor(prof);
      const { data: em } = await sb.rpc('get_user_email', { p_user_id: editorId });
      setEmail(em || '');
      const { data: perms } = await supabase.from('editor_permissions').select('student_user_id, created_at').eq('editor_user_id', editorId);
      if (perms?.length) {
        const ids = perms.map((p: any) => p.student_user_id);
        const { data: studs } = await supabase.from('profiles').select('user_id, full_name, country_of_education').in('user_id', ids);
        setAssigned((studs || []).map((s: any) => ({ ...s, assigned_at: perms.find((p: any) => p.student_user_id === s.user_id)?.created_at })));
      }
    })();
  }, [editorId]);

  useEffect(() => {
    if (!referrals.length) { setActivities([]); return; }
    (async () => {
      const ids = referrals.map(r => r.id);
      const { data } = await sb.from('referral_activities').select('*').in('referral_id', ids).order('created_at', { ascending: false }).limit(50);
      setActivities(data || []);
    })();
  }, [referrals]);

  const stats = useMemo(() => ({
    assigned: assigned.length,
    referrals: referrals.length,
    qualified: referrals.filter(r => QUALIFIED_STATUSES.includes(r.current_status)).length,
    converted: referrals.filter(r => !!r.converted_student_id).length,
  }), [assigned.length, referrals]);

  const qualified = referrals.filter(r => QUALIFIED_STATUSES.includes(r.current_status));

  const reject = async (id: string) => {
    await update.mutateAsync({ id, patch: { current_status: 'not_interested' } });
    toast({ title: 'Referral rejected' });
    refetch();
  };

  const convert = async (r: any) => {
    // lightweight linkage placeholder: mark as converted; admin still creates the student account manually
    await update.mutateAsync({ id: r.id, patch: { converted_at: new Date().toISOString(), current_status: 'completed' } });
    toast({ title: 'Marked as converted', description: 'Create the student account in the Students module and link manually.' });
    refetch();
  };

  if (!editor) return <FullScreenLoader label="Loading editor" />;

  const initials = (editor.full_name || 'E').split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();

  const ReferralsTable = ({ rows }: { rows: any[] }) => (
    <Card><CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Services</TableHead><TableHead>Status</TableHead>
            <TableHead>Priority</TableHead><TableHead>Next</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">Loading...</TableCell></TableRow>
              : rows.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">No referrals</TableCell></TableRow>
              : rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell><div className="font-medium">{r.full_name}</div><div className="text-xs text-muted-foreground">{r.phone || r.email || '—'}</div></TableCell>
                  <TableCell><div className="flex flex-wrap gap-1 max-w-[220px]">
                    {(r.referral_services || []).slice(0, 3).map((s: any) => <Badge key={s.id} variant="secondary" className="text-[10px]">{serviceLabel(s.service_key)}</Badge>)}
                  </div></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${statusColor(r.current_status)}`}>{statusLabel(r.current_status)}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${priorityColor(r.priority)}`}>{r.priority}</Badge></TableCell>
                  <TableCell className="text-sm">{r.next_followup_date || '—'}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/editor/referrals/${r.id}`)}>View</Button>
                    {!r.converted_student_id && <Button size="sm" variant="ghost" onClick={() => convert(r)}>Convert</Button>}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => reject(r.id)}>Reject</Button>
                  </div></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </CardContent></Card>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/editors')} className="gap-1"><ArrowLeft className="h-4 w-4" />Back to Editors</Button>

        <Card><CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary/10 text-primary text-lg">{initials}</AvatarFallback></Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{editor.full_name || 'Editor'}</h1>
            <p className="text-xs text-muted-foreground">{email || '—'}</p>
            <p className="text-xs text-muted-foreground">Joined {new Date(editor.created_at).toLocaleDateString()}</p>
          </div>
          <Badge variant="outline" className="text-[10px] capitalize">{editor.role}</Badge>
        </CardContent></Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { l: 'Assigned Students', v: stats.assigned, i: Users },
            { l: 'Manual Referrals', v: stats.referrals, i: UserPlus },
            { l: 'Qualified Leads', v: stats.qualified, i: Star },
            { l: 'Converted', v: stats.converted, i: CheckCircle2 },
          ].map(s => (
            <Card key={s.l}><CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><s.i className="h-4 w-4" /></div>
              <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.l}</div><div className="text-lg font-semibold tabular-nums">{s.v}</div></div>
            </CardContent></Card>
          ))}
        </div>

        <Tabs defaultValue="referrals">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="referrals">Manual Referrals</TabsTrigger>
            <TabsTrigger value="qualified">Qualified Leads</TabsTrigger>
            <TabsTrigger value="students">Assigned Students</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="pt-3"><ReferralsTable rows={referrals} /></TabsContent>
          <TabsContent value="qualified" className="pt-3"><ReferralsTable rows={qualified} /></TabsContent>

          <TabsContent value="students" className="pt-3">
            <Card><CardContent className="p-0">
              <div className="overflow-x-auto"><Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Country</TableHead><TableHead>Assigned</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assigned.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground">No students assigned</TableCell></TableRow>
                    : assigned.map(s => (
                      <TableRow key={s.user_id} className="cursor-pointer" onClick={() => navigate(`/admin/students/${s.user_id}`)}>
                        <TableCell className="font-medium">{s.full_name || '—'}</TableCell>
                        <TableCell>{s.country_of_education || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.assigned_at ? new Date(s.assigned_at).toLocaleDateString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table></div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="activity" className="pt-3">
            <Card><CardContent className="p-0">
              {activities.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No activity yet</div>
                : activities.map(a => (
                  <div key={a.id} className="flex gap-3 px-4 py-3 border-b border-border last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Clock className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{a.title || a.type}</div>
                      {a.body && <div className="text-sm text-muted-foreground mt-0.5">{a.body}</div>}
                      <div className="text-[11px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()} · {a.type}</div>
                    </div>
                  </div>
                ))}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
