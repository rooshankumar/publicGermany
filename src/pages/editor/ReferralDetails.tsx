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
import FullScreenLoader from '@/components/FullScreenLoader';

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

  if (isLoading) return <FullScreenLoader label="Loading referral" />;
  if (!referral) return <Layout><div className="p-8 text-center text-sm text-muted-foreground">Referral not found</div></Layout>;

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
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Header */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{referral.full_name}</h1>
                <Badge variant="outline" className={`text-[10px] ${statusColor(referral.current_status)}`}>{statusLabel(referral.current_status)}</Badge>
                <Badge variant="outline" className={`text-[10px] capitalize ${priorityColor(referral.priority)}`}>{referral.priority} priority</Badge>
                {referral.converted_student_id && <Badge className="text-[10px] bg-emerald-600">Converted</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {referral.phone || '—'} · {referral.email || '—'} · {referral.city || ''} {referral.state || ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={referral.current_status} onValueChange={(v) => update.mutate({ id: referral.id, patch: { current_status: v } })}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{REFERRAL_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={referral.priority} onValueChange={(v) => update.mutate({ id: referral.id, patch: { priority: v } })}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{REFERRAL_PRIORITIES.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline ({activities.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="documents">Documents ({docs.length})</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-3 pt-3">
            <Card><CardContent className="p-4 grid md:grid-cols-2 gap-4 text-sm">
              <Info label="Full Name" value={referral.full_name} />
              <Info label="Phone" value={referral.phone} />
              <Info label="WhatsApp" value={referral.whatsapp} />
              <Info label="Email" value={referral.email} />
              <Info label="City" value={referral.city} />
              <Info label="State" value={referral.state} />
              <Info label="Qualification" value={referral.qualification} />
              <Info label="Percentage / CGPA" value={referral.percentage} />
              <Info label="Passing Year" value={referral.passing_year} />
              <Info label="German Level" value={referral.german_level} />
              <Info label="Preferred Intake" value={referral.preferred_intake} />
              <Info label="Passport" value={referral.passport_available ? 'Yes' : 'No'} />
              <Info label="Lead Source" value={referral.lead_source} />
              <Info label="Next Follow-up" value={referral.next_followup_date} />
              <Info label="Commission" value={referral.commission_status} />
              <Info label="Created" value={new Date(referral.created_at).toLocaleString()} />
            </CardContent></Card>

            <Card><CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interested Services</p>
              <div className="flex flex-wrap gap-2">
                {REFERRAL_SERVICES.map(s => {
                  const active = activeServices.has(s.key);
                  return (
                    <button key={s.key} onClick={() => toggleService(s.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'}`}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </CardContent></Card>

            <Card><CardContent className="p-4 space-y-2">
              <Label className="text-xs">Remarks</Label>
              <Textarea rows={3} defaultValue={referral.remarks || ''}
                onBlur={(e) => e.target.value !== (referral.remarks || '') && update.mutate({ id: referral.id, patch: { remarks: e.target.value } })} />
            </CardContent></Card>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="space-y-3 pt-3">
            <Card><CardContent className="p-4 space-y-2">
              <div className="flex flex-col md:flex-row gap-2">
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="h-9 w-full md:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTIVITY_TYPES.map(a => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Add note or activity..." value={activityBody} onChange={e => setActivityBody(e.target.value)} className="h-9" />
                <Button onClick={submitActivity} className="h-9"><Plus className="h-4 w-4 mr-1" />Log</Button>
              </div>
            </CardContent></Card>

            <Card><CardContent className="p-0">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No activity yet</div>
              ) : (activities as any[]).map(a => (
                <div key={a.id} className="flex gap-3 px-4 py-3 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{a.title || a.type}</div>
                    {a.body && <div className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{a.body}</div>}
                    <div className="text-[11px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()} · {a.type}</div>
                  </div>
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>

          {/* TASKS */}
          <TabsContent value="tasks" className="space-y-3 pt-3">
            <Card><CardContent className="p-4 flex flex-col md:flex-row gap-2">
              <Input placeholder="Task title..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="h-9" />
              <Input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="h-9 md:w-44" />
              <Button onClick={submitTask} className="h-9"><Plus className="h-4 w-4 mr-1" />Add Task</Button>
            </CardContent></Card>
            <Card><CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No tasks yet</div>
              ) : (tasks as any[]).map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
                  <Checkbox checked={t.status === 'done'} onCheckedChange={(v) => updateTask.mutate({ id: t.id, patch: { status: v ? 'done' : 'open' } })} />
                  <div className="flex-1">
                    <div className={`text-sm ${t.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
                    {t.due_date && <div className="text-[11px] text-muted-foreground">Due {t.due_date}</div>}
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{t.status}</Badge>
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents" className="space-y-3 pt-3">
            <Card><CardContent className="p-4">
              <MultiFileUpload onFilesSelected={handleUpload} maxFiles={10} />
              {uploading && <p className="text-xs text-muted-foreground mt-2">Uploading...</p>}
            </CardContent></Card>
            <Card><CardContent className="p-0">
              {docs.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No documents uploaded</div>
              ) : (docs as any[]).map(d => (
                <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/40">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{d.file_name}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
                  </div>
                </a>
              ))}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{value || '—'}</div>
    </div>
  );
}
