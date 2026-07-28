import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useReferralsByEditor, useUpdateReferral } from '@/hooks/useReferrals';
import { QUALIFIED_STATUSES, serviceLabel, statusColor, statusLabel, priorityColor } from '@/lib/referralConstants';
import {
  ArrowLeft, Users, UserPlus, Star, CheckCircle2, Clock, ShieldCheck,
  Mail, Calendar, ChevronRight,
} from 'lucide-react';
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

  const verifyReferral = async (r: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await update.mutateAsync({
        id: r.id,
        patch: {
          verified_by_admin: true,
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          commission_status: 'earned',
        },
      });
      toast({ title: 'Referral verified', description: 'Editor can no longer edit this referral. Revenue tracked.' });
      refetch();
    } catch (e: any) {
      toast({ title: 'Verification failed', description: e.message, variant: 'destructive' });
    }
  };

  const unverifyReferral = async (id: string) => {
    await update.mutateAsync({
      id,
      patch: {
        verified_by_admin: false,
        verified_at: null,
        verified_by: null,
        commission_status: 'pending',
      },
    });
    toast({ title: 'Verification removed', description: 'Editor can edit again. Revenue removed.' });
    refetch();
  };

  const convert = async (r: any) => {
    await update.mutateAsync({ id: r.id, patch: { converted_at: new Date().toISOString(), current_status: 'completed' } });
    toast({ title: 'Marked as converted', description: 'Create the student account in the Students module and link manually.' });
    refetch();
  };

  if (!editor) return <FullScreenLoader label="Loading editor" />;

  const initials = (editor.full_name || 'E').split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();

  const ReferralActions = ({ r }: { r: any }) => (
    <div className="flex items-center gap-1 shrink-0">
      {r.verified_by_admin ? (
        <>
          <Badge className="bg-green-600 text-[9px] h-5 px-1.5 gap-0.5 whitespace-nowrap">
            <ShieldCheck className="h-2.5 w-2.5" />Verified
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-5 text-[9px] px-1 text-amber-600 border-amber-300">Unverify</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm">Remove verification?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">The editor will be able to edit this referral again and commission will be unearned.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => unverifyReferral(r.id)} className="h-9 text-xs bg-amber-600 hover:bg-amber-700">Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <Button size="sm" variant="outline" className="h-5 text-[9px] px-1 text-green-600 border-green-300 gap-0.5" onClick={() => verifyReferral(r)}>
          <ShieldCheck className="h-2.5 w-2.5" />Verify
        </Button>
      )}
      <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1" onClick={() => navigate(`/editor/referrals/${r.id}`)}>View</Button>
      {!r.converted_student_id && (
        <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1" onClick={() => convert(r)}>Convert</Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1 text-destructive">Reject</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Reject this referral?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">This will mark the referral as 'Not Interested'.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => reject(r.id)} className="h-9 text-xs bg-destructive hover:bg-destructive/90">Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const ReferralTable = ({ data }: { data: any[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left p-2 font-medium text-[10px] whitespace-nowrap">Name</th>
            <th className="text-left p-2 font-medium text-[10px] hidden sm:table-cell whitespace-nowrap">Contact</th>
            <th className="text-left p-2 font-medium text-[10px] hidden md:table-cell whitespace-nowrap">Services</th>
            <th className="text-left p-2 font-medium text-[10px] hidden lg:table-cell whitespace-nowrap">Priority</th>
            <th className="text-center p-2 font-medium text-[10px] whitespace-nowrap">Status</th>
            <th className="text-left p-2 font-medium text-[10px] whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="align-middle">
          {data.map(r => (
            <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="p-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-[11px] truncate max-w-[140px]">{r.full_name}</span>
                  {r.verified_by_admin && <ShieldCheck className="h-3 w-3 text-green-600 shrink-0" />}
                </div>
              </td>
              <td className="p-2 hidden sm:table-cell">
                <span className="text-[10px] text-muted-foreground">{r.phone || r.email || '—'}</span>
              </td>
              <td className="p-2 hidden md:table-cell">
                <div className="flex flex-wrap gap-0.5">
                  {(r.referral_services || []).slice(0, 2).map((s: any) => (
                    <Badge key={s.id} variant="secondary" className="text-[8px] px-1 py-0 h-3.5">{serviceLabel(s.service_key)}</Badge>
                  ))}
                  {(r.referral_services || []).length > 2 && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">+{r.referral_services.length - 2}</Badge>
                  )}
                </div>
              </td>
              <td className="p-2 hidden lg:table-cell">
                {r.priority && (
                  <Badge variant="outline" className={`text-[8px] capitalize px-1 py-0 ${priorityColor(r.priority)}`}>{r.priority}</Badge>
                )}
              </td>
              <td className="p-2 text-center">
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${statusColor(r.current_status)}`}>
                  {statusLabel(r.current_status)}
                </Badge>
              </td>
              <td className="p-2">
                <ReferralActions r={r} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout>
      <div className="px-4 py-5 max-w-4xl mx-auto space-y-4">
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate('/admin/editors')}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Editors
        </button>

        {/* Editor profile header */}
        <div className="flex items-center gap-3 pb-2">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">{editor.full_name || 'Editor'}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {new Date(editor.created_at).toLocaleDateString()}</span>
              <Badge variant="outline" className="text-[9px] capitalize">{editor.role}</Badge>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Assigned Students', value: stats.assigned, icon: Users },
            { label: 'Manual Referrals', value: stats.referrals, icon: UserPlus },
            { label: 'Qualified Leads', value: stats.qualified, icon: Star },
            { label: 'Converted', value: stats.converted, icon: CheckCircle2 },
          ].map(s => (
            <div key={s.label} className="border rounded-lg p-3 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold tabular-nums">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="referrals">
          <TabsList className="w-full sm:w-auto bg-muted/50 p-0.5 h-auto">
            <TabsTrigger value="referrals" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">Referrals</TabsTrigger>
            <TabsTrigger value="qualified" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">Qualified</TabsTrigger>
            <TabsTrigger value="students" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">Students</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">Activity</TabsTrigger>
          </TabsList>

          {/* Referrals tab */}
          <TabsContent value="referrals" className="pt-3">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">No referrals yet</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <ReferralTable data={referrals} />
              </div>
            )}
          </TabsContent>

          {/* Qualified tab */}
          <TabsContent value="qualified" className="pt-3">
            {qualified.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">No qualified leads yet</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <ReferralTable data={qualified} />
              </div>
            )}
          </TabsContent>

          {/* Students tab */}
          <TabsContent value="students" className="pt-3">
            {assigned.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">No students assigned</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b text-muted-foreground bg-muted/30">
                      <th className="text-left p-2 font-medium text-[10px] whitespace-nowrap">Student</th>
                      <th className="text-left p-2 font-medium text-[10px] hidden sm:table-cell whitespace-nowrap">Country</th>
                      <th className="text-left p-2 font-medium text-[10px] whitespace-nowrap">Assigned</th>
                      <th className="text-left p-2 font-medium text-[10px] whitespace-nowrap"></th>
                    </tr>
                  </thead>
                  <tbody className="align-middle">
                    {assigned.map(s => (
                      <tr key={s.user_id} className="border-b hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/students/${s.user_id}`)}>
                        <td className="p-2">
                          <span className="font-medium text-[11px]">{s.full_name || '—'}</span>
                        </td>
                        <td className="p-2 hidden sm:table-cell">
                          <span className="text-[10px] text-muted-foreground">{s.country_of_education || '—'}</span>
                        </td>
                        <td className="p-2">
                          <span className="text-[10px] text-muted-foreground">{s.assigned_at ? new Date(s.assigned_at).toLocaleDateString() : '—'}</span>
                        </td>
                        <td className="p-2 text-right">
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground inline-block" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Activity tab */}
          <TabsContent value="activity" className="pt-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map(a => (
                  <div key={a.id} className="flex gap-3 px-1 py-2.5 border-b border-border/50 last:border-0">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{a.title || a.type}</p>
                      {a.body && <p className="text-xs text-muted-foreground mt-0.5">{a.body}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(a.created_at).toLocaleString()} · {a.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
