import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useReferral, useReferralActivities, useReferralTasks, useReferralDocuments,
  useUpdateReferral, useSetReferralServices, useAddActivity, useAddTask, useUpdateTask,
} from '@/hooks/useReferrals';
import {
  REFERRAL_SERVICES, REFERRAL_STATUSES, REFERRAL_PRIORITIES,
  ACTIVITY_TYPES, TRAINER_NAMES, statusLabel, statusColor, priorityColor,
} from '@/lib/referralConstants';
import { ArrowLeft, Plus, Clock, User, FileText, ShieldCheck, Lock, Edit2, Save, X, Phone, Mail, MapPin, CalendarDays, IndianRupee, StickyNote, Globe, Tag } from 'lucide-react';
import { MultiFileUpload } from '@/components/MultiFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function ReferralDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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

  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [activityType, setActivityType] = useState('note');
  const [activityBody, setActivityBody] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [uploading, setUploading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<any>({});
  const [editServices, setEditServices] = useState<string[]>([]);

  // Init edit form when referral loads or when entering edit mode
  useEffect(() => {
    if (referral) {
      setEditForm({
        full_name: referral.full_name || '',
        phone: referral.phone || '',
        whatsapp: referral.whatsapp || '',
        email: referral.email || '',
        city: referral.city || '',
        lead_source: referral.lead_source || '',
        trainer_name: referral.trainer_name || '',
        current_status: referral.current_status || 'new',
        priority: referral.priority || 'medium',
        next_followup_date: referral.next_followup_date || '',
        total_fees: referral.total_fees || '',
        remarks: referral.remarks || '',
      });
      setEditServices((referral.referral_services || []).map(s => s.service_key));
    }
  }, [referral]);

  if (isLoading) return <Layout><div className="flex items-center justify-center min-h-[40vh]"><p className="text-xs text-muted-foreground">Loading referral...</p></div></Layout>;
  if (!referral) return <Layout><div className="p-6 text-center text-xs text-muted-foreground">Referral not found</div></Layout>;

  const isAdmin = profile?.role === 'admin';
  const locked = !!(referral.verified_by_admin && !isAdmin);
  const canEdit = !locked;

  // View-mode services
  const activeServices = new Set((referral.referral_services || []).map(s => s.service_key));

  const toggleEditService = (k: string) => {
    setEditServices(prev => prev.includes(k) ? prev.filter(s => s !== k) : [...prev, k]);
  };

  const handleSaveEdit = async () => {
    if (!editForm.full_name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSavingEdit(true);
    try {
      const patch: any = {};
      const fields: (keyof typeof editForm)[] = [
        'full_name', 'phone', 'whatsapp', 'email', 'city', 'lead_source',
        'trainer_name', 'current_status', 'priority', 'next_followup_date', 'total_fees', 'remarks'
      ];
      for (const f of fields) {
        const ref = (referral as any)[f];
        const form = editForm[f];
        if (String(form ?? '') !== String(ref ?? '')) {
          patch[f] = form || null;
        }
      }
      if (Object.keys(patch).length > 0) {
        await update.mutateAsync({ id: referral.id, patch });
      }
      const currentServices = (referral.referral_services || []).map(s => s.service_key).sort().join(',');
      const newServices = [...editServices].sort().join(',');
      if (currentServices !== newServices) {
        await setServices.mutateAsync({ id: referral.id, services: editServices });
      }
      toast({ title: 'Changes saved' });
      setEditing(false);
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    if (referral) {
      setEditForm({
        full_name: referral.full_name || '',
        phone: referral.phone || '',
        whatsapp: referral.whatsapp || '',
        email: referral.email || '',
        city: referral.city || '',
        lead_source: referral.lead_source || '',
        trainer_name: referral.trainer_name || '',
        current_status: referral.current_status || 'new',
        priority: referral.priority || 'medium',
        next_followup_date: referral.next_followup_date || '',
        total_fees: referral.total_fees || '',
        remarks: referral.remarks || '',
      });
      setEditServices((referral.referral_services || []).map(s => s.service_key));
    }
    setEditing(false);
  };

  const setEdit = (k: string, v: any) => setEditForm((f: any) => ({ ...f, [k]: v }));

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

  // Reusable edit field row
  const EditFieldRow = ({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<any>; children: React.ReactNode }) => (
    <div className="grid grid-cols-[140px_1fr] items-center gap-4 px-4 py-2.5 odd:bg-muted/20">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70 flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      {children}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 space-y-3">
        {/* Back + Edit button row */}
        <div className="flex items-center justify-between gap-2">
          <button
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          {canEdit && (
            <div className="flex items-center gap-1.5">
              {locked && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">
                  <Lock className="h-3 w-3" />
                  <span>Editor editing locked</span>
                </div>
              )}
              {editing ? (
                <>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={handleCancelEdit} disabled={savingEdit}>
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" className="h-7 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSaveEdit} disabled={savingEdit}>
                    {savingEdit ? (
                      <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button size="sm" className="h-7 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setEditing(true)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Header Card */}
        <div className="border rounded-lg bg-card">
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-sm sm:text-base font-semibold text-card-foreground truncate">{referral.full_name}</h1>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-medium ${statusColor(referral.current_status)}`}>{statusLabel(referral.current_status)}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-medium capitalize ${priorityColor(referral.priority)}`}>{referral.priority}</span>
              {referral.converted_student_id && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-medium bg-emerald-600 text-white">Converted</span>}
              {referral.verified_by_admin && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-medium bg-emerald-600 text-white gap-0.5"><ShieldCheck className="h-2.5 w-2.5" />Approved</span>}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {referral.phone || '—'} · {referral.email || '—'} · {referral.city || ''}
              {referral.total_fees && <> · {referral.total_fees}</>}
              {referral.trainer_name && <> · Trainer: {referral.trainer_name}</>}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <div className="overflow-x-auto -mx-2 px-2">
            <TabsList className="h-7 p-0.5 bg-muted/50 gap-0.5 w-full sm:w-auto inline-flex rounded-lg">
              <TabsTrigger value="overview" className="text-[10px] h-6 px-2 sm:px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="timeline" className="text-[10px] h-6 px-2 sm:px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Timeline ({activities.length})</TabsTrigger>
              <TabsTrigger value="tasks" className="text-[10px] h-6 px-2 sm:px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Tasks ({tasks.length})</TabsTrigger>
              <TabsTrigger value="documents" className="text-[10px] h-6 px-2 sm:px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Docs ({docs.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* ===== OVERVIEW ===== */}
          <TabsContent value="overview" className="space-y-2 pt-2">
            {editing ? (
              /* ===== EDIT MODE - Table-like layout ===== */
              <div className="space-y-2">
                {/* Personal Info Section */}
                <div className="border rounded-lg bg-card overflow-hidden">
                  <div className="px-4 py-2 border-b bg-muted/20">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Personal Information
                    </p>
                  </div>
                  <div className="divide-y">
                    <EditFieldRow label="Full Name" icon={User}>
                      <Input value={editForm.full_name} onChange={e => setEdit('full_name', e.target.value)} placeholder="Full name" className="h-7 text-xs" />
                    </EditFieldRow>
                    <EditFieldRow label="Phone" icon={Phone}>
                      <Input value={editForm.phone} onChange={e => setEdit('phone', e.target.value)} placeholder="Phone number" className="h-7 text-xs" />
                    </EditFieldRow>
                    <EditFieldRow label="WhatsApp" icon={Phone}>
                      <Input value={editForm.whatsapp} onChange={e => setEdit('whatsapp', e.target.value)} placeholder="WhatsApp number" className="h-7 text-xs" />
                    </EditFieldRow>
                    <EditFieldRow label="Email" icon={Mail}>
                      <Input value={editForm.email} onChange={e => setEdit('email', e.target.value)} placeholder="Email address" className="h-7 text-xs" />
                    </EditFieldRow>
                    <EditFieldRow label="City" icon={MapPin}>
                      <Input value={editForm.city} onChange={e => setEdit('city', e.target.value)} placeholder="City" className="h-7 text-xs" />
                    </EditFieldRow>
                  </div>
                </div>

                {/* Services Section */}
                <div className="border rounded-lg bg-card overflow-hidden">
                  <div className="px-4 py-2 border-b bg-muted/20">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Interested Services
                    </p>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {REFERRAL_SERVICES.map(s => {
                        const active = editServices.includes(s.key);
                        return (
                          <button key={s.key} type="button" onClick={() => toggleEditService(s.key)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                              active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted/30 border text-muted-foreground'
                            }`}>
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Lead & Fees Section */}
                <div className="border rounded-lg bg-card overflow-hidden">
                  <div className="px-4 py-2 border-b bg-muted/20">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Lead &amp; Fees
                    </p>
                  </div>
                  <div className="divide-y">
                    <EditFieldRow label="Lead Source">
                      <Select value={editForm.lead_source} onValueChange={v => setEdit('lead_source', v)}>
                        <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Select source" /></SelectTrigger>
                        <SelectContent>
                          {['Instagram','WhatsApp','Friend','Offline','College','Seminar','YouTube','Other'].map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditFieldRow>
                    <EditFieldRow label="Trainer">
                      <Select value={editForm.trainer_name} onValueChange={v => setEdit('trainer_name', v)}>
                        <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Select trainer" /></SelectTrigger>
                        <SelectContent>
                          {TRAINER_NAMES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </EditFieldRow>
                    <EditFieldRow label="Status">
                      <Select value={editForm.current_status} onValueChange={v => setEdit('current_status', v)}>
                        <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REFERRAL_STATUSES.map(s => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </EditFieldRow>
                    <EditFieldRow label="Priority">
                      <Select value={editForm.priority} onValueChange={v => setEdit('priority', v)}>
                        <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REFERRAL_PRIORITIES.map(p => <SelectItem key={p.key} value={p.key} className="text-xs">{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </EditFieldRow>
                    <EditFieldRow label="Follow-up" icon={CalendarDays}>
                      <Input type="date" value={editForm.next_followup_date} onChange={e => setEdit('next_followup_date', e.target.value)} className="h-7 text-xs" />
                    </EditFieldRow>
                    <EditFieldRow label="Total Fees" icon={IndianRupee}>
                      <Input value={editForm.total_fees} onChange={e => setEdit('total_fees', e.target.value)} placeholder="e.g. ₹5,000 or EUR 500" className="h-7 text-xs max-w-xs" />
                    </EditFieldRow>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="border rounded-lg bg-card overflow-hidden">
                  <div className="px-4 py-2 border-b bg-muted/20">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <StickyNote className="h-3 w-3" /> Notes
                    </p>
                  </div>
                  <div className="p-4">
                    <Textarea rows={3} value={editForm.remarks} onChange={e => setEdit('remarks', e.target.value)}
                      placeholder="Add notes..." className="text-xs min-h-[40px]" />
                  </div>
                </div>

                {/* Save/Cancel footer */}
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={handleCancelEdit} disabled={savingEdit}>
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" className="h-7 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSaveEdit} disabled={savingEdit}>
                    {savingEdit ? (
                      <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              /* ===== VIEW MODE ===== */
              <>
                {/* Key Info Table */}
                <div className="border rounded-lg bg-card overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y">
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium w-[140px]">Full Name</td>
                        <td className="px-3 py-2 font-medium text-card-foreground">{referral.full_name}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Phone</td>
                        <td className="px-3 py-2 text-card-foreground/80">{referral.phone || '—'}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">WhatsApp</td>
                        <td className="px-3 py-2 text-card-foreground/80">{referral.whatsapp || '—'}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Email</td>
                        <td className="px-3 py-2 text-card-foreground/80">{referral.email || '—'}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">City</td>
                        <td className="px-3 py-2 text-card-foreground/80">{referral.city || '—'}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Lead Source</td>
                        <td className="px-3 py-2 text-card-foreground/80">{referral.lead_source || '—'}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Trainer</td>
                        <td className="px-3 py-2 text-card-foreground/80">{referral.trainer_name || '—'}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Next Follow-up</td>
                        <td className="px-3 py-2 text-card-foreground/80">{referral.next_followup_date || '—'}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Total Fees</td>
                        <td className="px-3 py-2 font-medium text-card-foreground">{referral.total_fees || '—'}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Verification</td>
                        <td className="px-3 py-2 text-card-foreground/80">{referral.verified_by_admin ? 'Verified' : 'Pending'}</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Created</td>
                        <td className="px-3 py-2 text-card-foreground/80">{new Date(referral.created_at).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Services */}
                <div className="border rounded-lg bg-card overflow-hidden">
                  <div className="p-2.5 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Services</p>
                    <div className="flex flex-wrap gap-1">
                      {REFERRAL_SERVICES.map(s => {
                        const active = activeServices.has(s.key);
                        return (
                          <span key={s.key} className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/30 text-muted-foreground border'
                          }`}>
                            {s.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {referral.remarks && (
                  <div className="border rounded-lg bg-card overflow-hidden">
                    <div className="p-2.5 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                      <p className="text-[11px] text-card-foreground/80 whitespace-pre-wrap">{referral.remarks}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ===== TIMELINE ===== */}
          <TabsContent value="timeline" className="space-y-2 pt-2">
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="p-2.5 space-y-1.5">
                <div className="flex flex-col sm:flex-row gap-1.5">
                  <Select value={activityType} onValueChange={setActivityType}>
                    <SelectTrigger className="h-7 w-full sm:w-32 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map(a => <SelectItem key={a.key} value={a.key} className="text-[11px]">{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Add note..." value={activityBody} onChange={e => setActivityBody(e.target.value)} className="h-7 text-[11px]" />
                  <Button onClick={submitActivity} size="sm" className="h-7 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-3 w-3 mr-1" />Log</Button>
                </div>
              </div>
            </div>
            <div className="border rounded-lg bg-card overflow-hidden">
              {activities.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-muted-foreground">No activity yet</div>
              ) : (activities as any[]).map(a => (
                <div key={a.id} className="flex gap-2 px-2.5 py-2 border-b last:border-0 hover:bg-muted/20">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-card-foreground">{a.title || a.type}</div>
                    {a.body && <div className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap">{a.body}</div>}
                    <div className="text-[9px] text-muted-foreground/60 mt-0.5">{new Date(a.created_at).toLocaleString()} · {a.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ===== TASKS ===== */}
          <TabsContent value="tasks" className="space-y-2 pt-2">
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="p-2.5 flex flex-col sm:flex-row gap-1.5">
                <Input placeholder="Task title..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="h-7 text-[11px]" />
                <Input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="h-7 sm:w-36 text-[11px]" />
                <Button onClick={submitTask} size="sm" className="h-7 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-3 w-3 mr-1" />Add</Button>
              </div>
            </div>
            <div className="border rounded-lg bg-card overflow-hidden">
              {tasks.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-muted-foreground">No tasks yet</div>
              ) : (tasks as any[]).map(t => (
                <div key={t.id} className="flex items-center gap-2 px-2.5 py-2 border-b last:border-0 hover:bg-muted/20">
                  <Checkbox checked={t.status === 'done'} onCheckedChange={(v) => updateTask.mutate({ id: t.id, patch: { status: v ? 'done' : 'open' } })} className="h-3.5 w-3.5" />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] ${t.status === 'done' ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>{t.title}</div>
                    {t.due_date && <div className="text-[9px] text-muted-foreground">Due {t.due_date}</div>}
                  </div>
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-medium capitalize ${
                    t.status === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ===== DOCUMENTS ===== */}
          <TabsContent value="documents" className="space-y-2 pt-2">
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="p-2.5">
                <MultiFileUpload onFilesSelected={handleUpload} maxFiles={10} />
                {uploading && <p className="text-[10px] text-muted-foreground mt-1.5">Uploading...</p>}
              </div>
            </div>
            <div className="border rounded-lg bg-card overflow-hidden">
              {docs.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-muted-foreground">No documents uploaded</div>
              ) : (docs as any[]).map(d => (
                <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-2.5 py-2 border-b last:border-0 hover:bg-muted/20">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-card-foreground truncate">{d.file_name}</div>
                    <div className="text-[9px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
                  </div>
                </a>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
