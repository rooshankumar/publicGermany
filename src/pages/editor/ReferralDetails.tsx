import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useReferral, useReferralActivities, useReferralTasks, useReferralDocuments,
  useUpdateReferral, useSetReferralServices, useAddActivity, useAddTask, useUpdateTask,
} from '@/hooks/useReferrals';
import {
  REFERRAL_SERVICES, REFERRAL_STATUSES, REFERRAL_PRIORITIES,
  ACTIVITY_TYPES, serviceLabel, statusLabel, statusColor, priorityColor,
} from '@/lib/referralConstants';
import { ArrowLeft, Plus, Clock, User, FileText } from 'lucide-react';
import { MultiFileUpload } from '@/components/MultiFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function ReferralDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: referral, isLoading } = useReferral(id);
  const { data: activities = [] } = useReferralActivities(id);
  const { data: tasks = [] } = useReferralTasks(id);
  const { data: docs = [] } = useReferralDocuments(id);
  const update = useUpdateReferral();
  const setServices = useSetReferralServices();
  const addActivity = useAddActivity();
  const addTask = useAddTask();
  const updateTask = useUpdateTask();

  const [activityType, setActivityType] = useState('note');
  const [activityBody, setActivityBody] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [uploading, setUploading] = useState(false);

  if (isLoading) return <Layout><div className="flex items-center justify-center min-h-[40vh]"><p className="text-xs text-muted-foreground">Loading referral...</p></div></Layout>;
  if (!referral) return <Layout><div className="p-6 text-center text-xs text-muted-foreground">Referral not found</div></Layout>;

  const activeServices = new Set((referral.referral_services || []).map(s => s.service_key));

  const toggleService = async (k: string) => {
    const next = new Set(activeServices);
    if (next.has(k)) next.delete(k); else next.add(k);
    await setServices.mutateAsync({ id: referral.id, services: Array.from(next) });
  };

  const submitActivity = async () => {
    if (!activityBody.trim()) return;
    await addActivity.mutateAsync({
      referral_id: referral.id,
      type: activityType,
      title: ACTIVITY_TYPES.find(a => a.key === activityType)?.label,
      body: activityBody,
    });
    setActivityBody('');
    toast({ title: 'Activity added' });
  };

  const submitTask = async () => {
    if (!taskTitle.trim()) return;
    await addTask.mutateAsync({
      referral_id: referral.id,
      title: taskTitle,
      due_date: taskDue || null,
    });
    setTaskTitle(''); setTaskDue('');
  };

  const handleUpload = async (files: File[]) => {
    if (!files.length || !user) return;
    setUploading(true);
    try {
      for (const f of files) {
        const path = `referrals/${referral.id}/${Date.now()}-${f.name}`;
        const { error: upErr } = await supabase.storage.from('documents').upload(path, f);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('documents').getPublicUrl(path);
        await (supabase as any).from('referral_documents').insert({
          referral_id: referral.id,
          uploaded_by: user.id,
          file_name: f.name,
          file_url: pub.publicUrl,
          mime: f.type,
          size: f.size,
        });
        await addActivity.mutateAsync({
          referral_id: referral.id,
          type: 'docs',
          title: 'Document uploaded',
          body: f.name,
        });
      }
      toast({ title: 'Files uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 space-y-3">
        <button
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Header */}
        <Card className="shadow-none border-border/60">
          <CardContent className="p-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-sm font-semibold truncate">{referral.full_name}</h1>
                  <Badge variant="outline" className={`text-[8px] py-0 h-4 ${statusColor(referral.current_status)}`}>{statusLabel(referral.current_status)}</Badge>
                  <Badge variant="outline" className={`text-[8px] py-0 h-4 capitalize ${priorityColor(referral.priority)}`}>{referral.priority}</Badge>
                  {referral.converted_student_id && <Badge className="text-[8px] py-0 h-4 bg-emerald-600">Converted</Badge>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {referral.phone || '—'} · {referral.email || '—'} · {referral.city || ''}
                  {referral.total_fees && <> · {referral.total_fees}</>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Select value={referral.current_status} onValueChange={(v) => update.mutate({ id: referral.id, patch: { current_status: v } })}>
                  <SelectTrigger className="h-7 w-32 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REFERRAL_STATUSES.map(s => <SelectItem key={s.key} value={s.key} className="text-[11px]">{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={referral.priority} onValueChange={(v) => update.mutate({ id: referral.id, patch: { priority: v } })}>
                  <SelectTrigger className="h-7 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REFERRAL_PRIORITIES.map(p => <SelectItem key={p.key} value={p.key} className="text-[11px]">{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList className="h-7 p-0.5 bg-muted/60 gap-0.5">
            <TabsTrigger value="overview" className="text-[10px] h-6 px-2 data-[state=active]:bg-background">Overview</TabsTrigger>
            <TabsTrigger value="timeline" className="text-[10px] h-6 px-2 data-[state=active]:bg-background">Timeline ({activities.length})</TabsTrigger>
            <TabsTrigger value="tasks" className="text-[10px] h-6 px-2 data-[state=active]:bg-background">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="documents" className="text-[10px] h-6 px-2 data-[state=active]:bg-background">Docs ({docs.length})</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-2 pt-2">
            <Card className="shadow-none border-border/60">
              <CardContent className="p-2.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-2 text-xs">
                <Info label="Full Name" value={referral.full_name} />
                <Info label="Phone" value={referral.phone} />
                <Info label="WhatsApp" value={referral.whatsapp} />
                <Info label="Email" value={referral.email} />
                <Info label="City" value={referral.city} />
                <Info label="Lead Source" value={referral.lead_source} />
                <Info label="Next Follow-up" value={referral.next_followup_date} />
                <Info label="Total Fees" value={referral.total_fees || '—'} />
                <Info label="Commission" value={referral.commission_status} />
                <Info label="Created" value={new Date(referral.created_at).toLocaleString()} />
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/60">
              <CardContent className="p-2.5 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Interested Services</p>
                <div className="flex flex-wrap gap-1">
                  {REFERRAL_SERVICES.map(s => {
                    const active = activeServices.has(s.key);
                    return (
                      <button key={s.key} onClick={() => toggleService(s.key)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                          active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border/60'}`}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/60">
              <CardContent className="p-2.5 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                <Textarea rows={2} defaultValue={referral.remarks || ''}
                  placeholder="Any relevant notes..."
                  className="text-[11px] min-h-[40px]"
                  onBlur={(e) => e.target.value !== (referral.remarks || '') && update.mutate({ id: referral.id, patch: { remarks: e.target.value || null } })} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="space-y-2 pt-2">
            <Card className="shadow-none border-border/60">
              <CardContent className="p-2.5 space-y-1.5">
                <div className="flex flex-col sm:flex-row gap-1.5">
                  <Select value={activityType} onValueChange={setActivityType}>
                    <SelectTrigger className="h-7 w-full sm:w-32 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map(a => <SelectItem key={a.key} value={a.key} className="text-[11px]">{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Add note..." value={activityBody} onChange={e => setActivityBody(e.target.value)} className="h-7 text-[11px]" />
                  <Button onClick={submitActivity} size="sm" className="h-7 text-[10px]"><Plus className="h-3 w-3 mr-1" />Log</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/60">
              <CardContent className="p-0">
                {activities.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-muted-foreground">No activity yet</div>
                ) : (activities as any[]).map(a => (
                  <div key={a.id} className="flex gap-2 px-2.5 py-2 border-b border-border/60 last:border-0">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Clock className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium">{a.title || a.type}</div>
                      {a.body && <div className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap">{a.body}</div>}
                      <div className="text-[9px] text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleString()} · {a.type}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TASKS */}
          <TabsContent value="tasks" className="space-y-2 pt-2">
            <Card className="shadow-none border-border/60">
              <CardContent className="p-2.5 flex flex-col sm:flex-row gap-1.5">
                <Input placeholder="Task title..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="h-7 text-[11px]" />
                <Input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="h-7 sm:w-36 text-[11px]" />
                <Button onClick={submitTask} size="sm" className="h-7 text-[10px]"><Plus className="h-3 w-3 mr-1" />Add</Button>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border/60">
              <CardContent className="p-0">
                {tasks.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-muted-foreground">No tasks yet</div>
                ) : (tasks as any[]).map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-2.5 py-2 border-b border-border/60 last:border-0">
                    <Checkbox checked={t.status === 'done'} onCheckedChange={(v) => updateTask.mutate({ id: t.id, patch: { status: v ? 'done' : 'open' } })} className="h-3.5 w-3.5" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] ${t.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
                      {t.due_date && <div className="text-[9px] text-muted-foreground">Due {t.due_date}</div>}
                    </div>
                    <Badge variant="outline" className="text-[8px] py-0 h-4 capitalize">{t.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents" className="space-y-2 pt-2">
            <Card className="shadow-none border-border/60">
              <CardContent className="p-2.5">
                <MultiFileUpload onFilesSelected={handleUpload} maxFiles={10} />
                {uploading && <p className="text-[10px] text-muted-foreground mt-1.5">Uploading...</p>}
              </CardContent>
            </Card>
            <Card className="shadow-none border-border/60">
              <CardContent className="p-0">
                {docs.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-muted-foreground">No documents uploaded</div>
                ) : (docs as any[]).map(d => (
                  <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-2.5 py-2 border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] truncate">{d.file_name}</div>
                      <div className="text-[9px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
      <p className="text-[11px] font-medium truncate" title={value || ''}>{value || '—'}</p>
    </div>
  );
}
